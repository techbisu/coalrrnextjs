// POST /api/schedules/[id]/items — add a plot to the schedule
import { ProposalService } from '@/modules/land-acquisition/services/ProposalService'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, readJson } from '../../../_lib'
import type { NextRequest } from 'next/server'

const service = new ProposalService()
type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('proposal.edit')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await readJson<{ plotId?: string; annexureTag?: 'A' | 'B' | 'C' }>(req)
    if (!body?.plotId) return badRequest('plotId required')

    const result = await service.addPlotToProposal(id, body.plotId, body.annexureTag ?? 'A')
    return ok(result, { status: 201 })
  } catch (e) {
    return serverError('Failed to add item', e instanceof Error ? e.message : String(e))
  }
}
