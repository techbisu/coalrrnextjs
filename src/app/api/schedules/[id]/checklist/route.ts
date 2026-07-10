// PATCH /api/schedules/[id]/checklist — update a CL-1 checklist item status
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, readJson } from '../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import { UpdateChecklistItemUseCase } from '@/application/use-cases/proposal'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('proposal.edit')
    if (auth.error) return auth.error

    const user = await getCurrentUser()
    if (!user) return badRequest('user not found')

    const { id } = await ctx.params
    const body = await readJson<{ itemKey: string; status: 'pending' | 'in_progress' | 'complete' | 'not_applicable' }>(req)
    if (!body?.itemKey || !body.status) return badRequest('itemKey and status required')

    const proposalRepo = new PrismaProposalRepository()
    const useCase = new UpdateChecklistItemUseCase(proposalRepo)

    const result = await useCase.execute({
      proposalId: id,
      itemKey: body.itemKey,
      status: body.status,
      user_id: user.id.toString()
    })

    if (result.isFailure) {
      return badRequest(String(result.error) || 'Failed to update checklist')
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to update checklist', e instanceof Error ? e.message : String(e))
  }
}
