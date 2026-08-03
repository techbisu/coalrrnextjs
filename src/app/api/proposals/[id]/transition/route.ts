import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '@/app/api/_lib'
import { getProposalDetailsUseCase, proposalWorkflowService } from '@/infrastructure/di/Container'
import { z } from 'zod'

type Ctx = { params: Promise<{ id: string }> }

const TransitionSchema = z.object({
  transition: z.enum(['submit', 'begin_area_vetting', 'approve_area_vetting', 'reject_area_vetting', 'approve_board', 'withdraw']),
  comments: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.view')
  if (auth.error) return auth.error

  const { id } = await params

  try {
    // Return available transitions for the proposal's current state
    const proposalDetails = await getProposalDetailsUseCase.execute({ proposalId: id })
    if (proposalDetails.isFailure) return notFound('Proposal not found')

    const currentState = proposalDetails.value!.state
    const available = proposalWorkflowService.getAvailableTransitions(currentState)

    return ok({
      proposalId: id,
      currentState,
      availableTransitions: available,
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

    const result = await proposalWorkflowService.transition({
      proposalId: id,
      transitionName: parsed.data.transition,
      userId: auth.user.id,
      comments: parsed.data.comments,
    })

    if (result.isFailure) {
      return badRequest(String(result.error))
    }

    return ok(result.value)
  } catch (e: any) {
    console.error('POST /api/proposals/[id]/transition error:', e)
    return serverError('Failed to apply transition', e.message)
  }
}
