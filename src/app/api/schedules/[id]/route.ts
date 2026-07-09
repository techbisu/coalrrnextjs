// GET  /api/schedules/[id] — fetch one schedule with items + checklist
// PATCH /api/schedules/[id] — update proposal details
import { ProposalService } from '@/modules/land-acquisition/services/ProposalService'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError, dec, iso, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'

const service = new ProposalService()
type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('acquisition.view')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const s = await service.getProposalById(id)
    if (!s) return notFound('Schedule not found')

    return ok({
      id: s.id, scheduleCode: s.scheduleCode, projectId: s.projectId, projectName: s.project.name,
      projectBudgetCeiling: dec(s.project.totalBudgetCeiling), projectLandLimit: dec(s.project.totalLandLimitAcres),
      acquisitionMode: s.acquisitionMode, state: s.state, proposalTitle: s.proposalTitle, description: s.description,
      proposedBy: s.proposedBy, proposedByRole: s.proposedByRole, areaOffice: s.areaOffice, collieryCode: s.collieryCode,
      adjacentColliery: s.adjacentColliery, totalAreaAcres: dec(s.totalAreaAcres), notificationDate: iso(s.notificationDate),
      annexureA: s.annexureA, annexureB: s.annexureB, annexureC: s.annexureC,
      modeSpecificChecklist: s.modeSpecificChecklist,
      items: s.items.map((it: any) => ({ 
        id: it.id, plotId: it.plotId, plotNumber: it.plot.plotNumber, 
        mouza: it.plot.mouza?.name || 'Unknown', landType: it.plot.landType, 
        areaAcres: dec(it.plot.areaAcres), annexureTag: it.annexureTag, isActive: it.isActive 
      })),
      createdAt: s.createdAt.toISOString(),
    })
  } catch (e) {
    return serverError('Failed to load schedule', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('acquisition.edit')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await readJson<{ proposalTitle?: string; description?: string; areaOffice?: string; adjacentColliery?: string; notificationDate?: string }>(req)
    if (!body) return badRequest('Invalid body')
    
    const data: any = {}
    if (body.proposalTitle !== undefined) data.proposalTitle = body.proposalTitle
    if (body.description !== undefined) data.description = body.description
    if (body.areaOffice !== undefined) data.areaOffice = body.areaOffice
    if (body.adjacentColliery !== undefined) data.adjacentColliery = body.adjacentColliery
    if (body.notificationDate !== undefined) data.notificationDate = body.notificationDate ? new Date(body.notificationDate) : null

    const updated = await service.updateProposal(id, data)
    return ok({ id: updated.id, savedAt: new Date().toISOString() })
  } catch (e) {
    return serverError('Failed to update schedule', e instanceof Error ? e.message : String(e))
  }
}
