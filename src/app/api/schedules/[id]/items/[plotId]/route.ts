// DELETE /api/schedules/[id]/items/[plot_id] — remove a plot
// PATCH  /api/schedules/[id]/items/[plot_id] — reclassify annexure tag
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, readJson } from '../../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import { RemovePlotFromProposalUseCase, ReclassifyPlotUseCase } from '@/application/use-cases/proposal'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'

type Ctx = { params: Promise<{ id: string; plotId: string }> }

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('acquisition.edit')
    if (auth.error) return auth.error

    const user = await getCurrentUser()
    if (!user) return badRequest('user not found')

    const { id, plotId: plot_id } = await ctx.params
    
    const proposalRepo = new PrismaProposalRepository()
    const useCase = new RemovePlotFromProposalUseCase(proposalRepo)

    const result = await useCase.execute({
      proposalId: id,
      plot_id,
      user_id: user.id.toString()
    })

    if (result.isFailure) {
      return badRequest(String(result.error) || 'Failed to remove plot')
    }

    return ok({ deleted: true, plot_id })
  } catch (e) {
    return serverError('Failed to delete item', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('acquisition.edit')
    if (auth.error) return auth.error

    const user = await getCurrentUser()
    if (!user) return badRequest('user not found')

    const { id, plotId: plot_id } = await ctx.params
    const body = await readJson<{ annexure_tag?: 'A' | 'B' | 'C' }>(req)
    if (!body?.annexure_tag) return badRequest('annexure_tag required (A | B | C)')

    const proposalRepo = new PrismaProposalRepository()
    const useCase = new ReclassifyPlotUseCase(proposalRepo)

    const result = await useCase.execute({
      proposalId: id,
      plot_id,
      annexure_tag: body.annexure_tag,
      user_id: user.id.toString()
    })

    if (result.isFailure) {
      return badRequest(String(result.error) || 'Failed to reclassify plot')
    }

    return ok({ updated: true, plot_id, annexure_tag: body.annexure_tag })
  } catch (e) {
    return serverError('Failed to update annexure tag', e instanceof Error ? e.message : String(e))
  }
}
