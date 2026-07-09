// DELETE /api/schedules/[id]/items/[itemId] — remove a plot
// PATCH  /api/schedules/[id]/items/[itemId] — reclassify annexure tag
import { ProposalService } from '@/modules/land-acquisition/services/ProposalService'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, readJson } from '../../../../_lib'
import type { NextRequest } from 'next/server'

const service = new ProposalService()
type Ctx = { params: Promise<{ id: string; itemId: string }> }

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('proposal.edit')
    if (auth.error) return auth.error

    const { id, itemId } = await ctx.params
    const result = await service.removePlotFromProposal(id, itemId)
    return ok({ deleted: true, ...result })
  } catch (e) {
    return serverError('Failed to delete item', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('proposal.edit')
    if (auth.error) return auth.error

    const { id, itemId } = await ctx.params
    const body = await readJson<{ annexureTag?: 'A' | 'B' | 'C' }>(req)
    if (!body?.annexureTag) return badRequest('annexureTag required (A | B | C)')

    const result = await service.reclassifyPlotAnnexure(id, itemId, body.annexureTag)
    return ok(result)
  } catch (e) {
    return serverError('Failed to update annexure tag', e instanceof Error ? e.message : String(e))
  }
}
