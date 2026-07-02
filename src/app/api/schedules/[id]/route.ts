// GET  /api/schedules/[id] — fetch one schedule with items + checklist
// PATCH /api/schedules/[id] — update proposal details
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, dec, iso, readJson } from '../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const s = await db.landSchedule.findUnique({ where: { id }, include: { project: true, items: { include: { plot: { include: { mouza: true } } } } } })
    if (!s) return notFound('Schedule not found')
    return ok({
      id: s.id, scheduleCode: s.scheduleCode, projectId: s.projectId, projectName: s.project.name,
      projectBudgetCeiling: dec(s.project.totalBudgetCeiling), projectLandLimit: dec(s.project.totalLandLimitAcres),
      acquisitionMode: s.acquisitionMode, state: s.state, proposalTitle: s.proposalTitle, description: s.description,
      proposedBy: s.proposedBy, proposedByRole: s.proposedByRole, areaOffice: s.areaOffice, collieryCode: s.collieryCode,
      adjacentColliery: s.adjacentColliery, totalAreaAcres: dec(s.totalAreaAcres), notificationDate: iso(s.notificationDate),
      annexureA: s.annexureA, annexureB: s.annexureB, annexureC: s.annexureC,
      modeSpecificChecklist: s.modeSpecificChecklist,
      items: s.items.map((it) => ({ id: it.id, plotId: it.plotId, plotNumber: it.plot.plotNumber, mouza: it.plot.mouza.name, landType: it.plot.landType, areaAcres: dec(it.plot.areaAcres), annexureTag: it.annexureTag, isActive: it.isActive })),
      createdAt: s.createdAt.toISOString(),
    })
  } catch (e) {
    return serverError('Failed to load schedule', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers can edit schedules')
    const { id } = await ctx.params
    const s = await db.landSchedule.findUnique({ where: { id } })
    if (!s) return notFound('Schedule not found')
    if (s.state !== 'Drafting') return badRequest(`Cannot edit schedule in state ${s.state}`)
    const body = await readJson<{ proposalTitle?: string; description?: string; areaOffice?: string; adjacentColliery?: string; notificationDate?: string }>(req)
    if (!body) return badRequest('Invalid body')
    const updated = await db.landSchedule.update({
      where: { id },
      data: {
        ...(body.proposalTitle !== undefined && { proposalTitle: body.proposalTitle }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.areaOffice !== undefined && { areaOffice: body.areaOffice }),
        ...(body.adjacentColliery !== undefined && { adjacentColliery: body.adjacentColliery }),
        ...(body.notificationDate !== undefined && { notificationDate: body.notificationDate ? new Date(body.notificationDate) : null }),
      },
    })
    return ok({ id: updated.id, savedAt: new Date().toISOString() })
  } catch (e) {
    return serverError('Failed to update schedule', e instanceof Error ? e.message : String(e))
  }
}
