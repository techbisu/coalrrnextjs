import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '@/app/api/_lib'
import { getProposalDetailsUseCase, acqProposalRepository } from '@/infrastructure/di/Container'
import { workflowEngineServer } from '@/core/workflow/WorkflowEngineServer'
import { workflowActionHistoryService } from '@/core/workflow/services/WorkflowActionHistoryService'
import { ProposalState } from '@/domain/entities/proposal'
import { MODULE_CODES, ACQ_LAND_SCHEDULE, resolveWorkflowCode } from '@/core/config/module-codes.config'
import { db } from '@/lib/db'
import { z } from 'zod'

type Ctx = { params: Promise<{ id: string }> }

const TransitionSchema = z.object({
  transition: z.string().min(1),
  actorRole: z.string().optional(),
  comments: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.view')
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const proposalDetails = await getProposalDetailsUseCase.execute({ proposalId: id })
    if (proposalDetails.isFailure) return notFound('Proposal not found')

    const currentState = proposalDetails.value!.state
    const acqModeId = (proposalDetails.value as any)?.acq_mode_id || 6

    const available = await workflowEngineServer.getAvailableTransitionsAsync({
      recordId: id,
      recordType: MODULE_CODES.LAND_SCHEDULE,
      acqModeId: Number(acqModeId),
      actorRole: 'all' as any,
      currentState: ProposalState.fromString(currentState).value as any,
    })

    return ok({
      proposalId: id,
      currentState,
      availableTransitions: available.map((t) => ({ name: t.name, label: t.label, to: t.to, role: t.role })),
    })
  } catch (e: any) {
    console.error('GET /api/proposals/[id]/transition error:', e)
    return serverError('Failed to get transitions', e.message)
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.update')
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = TransitionSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(`Invalid input: ${parsed.error.issues.map(i => i.message).join(', ')}`)
    }

    // Execute state read, transition check, persistence, and audit logging inside atomic transaction
    const txResult = await db.$transaction(async (tx) => {
      const proposal = await acqProposalRepository.findById(id, tx)
      if (!proposal) return { error: notFound('Proposal not found') }

      const previousState = proposal.state.value
      const actorRole = (parsed.data.actorRole as any) ?? 'unit_office'
      const acqModeId = Number((proposal as any).acq_mode_id || 6)

      // Attempt transition via single source of truth WorkflowEngineServer
      const transitionResult = await workflowEngineServer.attemptTransitionAsync(
        {
          recordId: proposal.id,
          recordType: MODULE_CODES.LAND_SCHEDULE,
          acqModeId,
          actorRole,
          currentState: previousState as any,
        },
        parsed.data.transition
      )

      if (!transitionResult.ok) {
        return { error: badRequest(transitionResult.reason || `Transition '${parsed.data.transition}' not allowed`) }
      }

      const newStateStr = transitionResult.newState!
      const newProposalState = ProposalState.fromString(newStateStr)

      // Execute state transition on aggregate root
      const stateRes = proposal.transitionTo(newProposalState, String(auth.user.id), parsed.data.comments)
      if (stateRes.isFailure) {
        return { error: badRequest(String(stateRes.error)) }
      }

      // Persist updated aggregate root within transaction
      await acqProposalRepository.save(proposal, tx)

      // Record audit history entry within transaction
      await workflowActionHistoryService.recordAction({
        entityId: proposal.id,
        moduleCode: MODULE_CODES.LAND_SCHEDULE,
        workflowCode: resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, acqModeId),
        action: parsed.data.transition,
        fromState: previousState,
        toState: newStateStr,
        userId: typeof auth.user.id === 'number' ? auth.user.id : (parseInt(String(auth.user.id), 10) || 1),
        userEmail: auth.user.email || String(auth.user.id),
        targetRecipientLabel: parsed.data.comments?.includes('sent to:') ? parsed.data.comments.split('.')[0] : undefined,
        comments: parsed.data.comments,
      }, tx)

      return {
        proposalId: proposal.id,
        scheduleCode: proposal.scheduleCode.value,
        previousState,
        newState: newStateStr,
        message: `Proposal transitioned from ${previousState} to ${newStateStr} via '${parsed.data.transition}'.`,
      }
    })

    if ('error' in txResult) {
      return txResult.error
    }

    return ok(txResult)
  } catch (e: any) {
    console.error('POST /api/proposals/[id]/transition error:', e)
    return serverError('Failed to apply transition', e.message)
  }
}
