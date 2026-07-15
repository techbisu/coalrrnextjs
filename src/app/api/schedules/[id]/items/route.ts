// POST /api/schedules/[id]/items — attach a plot to a proposal
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, readJson } from '../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import { AddPlotToProposalUseCase } from '@/application/use-cases/proposal'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'
import { PrismaPlotRepository } from '@/infrastructure/persistence/repositories/PrismaPlotRepository'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('acquisition.edit')
    if (auth.error) return auth.error

    const user = await getCurrentUser()
    if (!user) return badRequest('user not found')

    const { id } = await ctx.params
    const body = await readJson<{ plot_id: string; annexure_tag: 'A' | 'B' | 'C' }>(req)
    if (!body?.plot_id || !body.annexure_tag) return badRequest('plot_id and annexure_tag required')

    const proposalRepo = new PrismaProposalRepository()
    const plotRepo = new PrismaPlotRepository()
    const useCase = new AddPlotToProposalUseCase(proposalRepo, plotRepo)

    const result = await useCase.execute({
      proposalId: id,
      plot_id: body.plot_id,
      annexure_tag: body.annexure_tag,
      user_id: user.id.toString()
    })

    if (result.isFailure) {
      return badRequest(String(result.error) || 'Failed to add plot')
    }

    return ok(result.value, { status: 201 })
  } catch (e) {
    return serverError('Failed to attach plot', e instanceof Error ? e.message : String(e))
  }
}
