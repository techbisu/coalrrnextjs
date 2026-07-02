// DELETE /api/schedules/[id]/items/[itemId] — remove a plot
// PATCH  /api/schedules/[id]/items/[itemId] — reclassify annexure tag
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string; itemId: string }> }

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers')
    const { id, itemId } = await ctx.params
    const s = await db.landSchedule.findUnique({ where: { id } })
    if (!s) return notFound('Schedule not found')
    if (s.state !== 'Drafting') return badRequest(`Cannot delete items from schedule in state ${s.state}`)
    await db.landScheduleItem.delete({ where: { id: itemId } })
    const allItems = await db.landScheduleItem.findMany({ where: { scheduleId: id, isActive: true }, include: { plot: true } })
    const totalArea = allItems.reduce((sum, it) => sum + Number(it.plot.areaAcres), 0)
    await db.landSchedule.update({
      where: { id },
      data: {
        totalAreaAcres: totalArea.toFixed(4),
        annexureA: JSON.stringify(allItems.filter((i) => i.annexureTag === 'A').map((i) => i.plotId)),
        annexureB: JSON.stringify(allItems.filter((i) => i.annexureTag === 'B').map((i) => i.plotId)),
        annexureC: JSON.stringify(allItems.filter((i) => i.annexureTag === 'C').map((i) => i.plotId)),
      },
    })
    return ok({ deleted: true, totalAreaAcres: totalArea.toFixed(4), itemCount: allItems.length })
  } catch (e) {
    return serverError('Failed to delete item', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers')
    const { id, itemId } = await ctx.params
    const body = await readJson<{ annexureTag?: 'A' | 'B' | 'C' }>(req)
    if (!body?.annexureTag) return badRequest('annexureTag required (A | B | C)')
    await db.landScheduleItem.update({ where: { id: itemId }, data: { annexureTag: body.annexureTag } })
    const allItems = await db.landScheduleItem.findMany({ where: { scheduleId: id, isActive: true } })
    await db.landSchedule.update({
      where: { id },
      data: {
        annexureA: JSON.stringify(allItems.filter((i) => i.annexureTag === 'A').map((i) => i.plotId)),
        annexureB: JSON.stringify(allItems.filter((i) => i.annexureTag === 'B').map((i) => i.plotId)),
        annexureC: JSON.stringify(allItems.filter((i) => i.annexureTag === 'C').map((i) => i.plotId)),
      },
    })
    return ok({ annexureTag: body.annexureTag })
  } catch (e) {
    return serverError('Failed to reclassify item', e instanceof Error ? e.message : String(e))
  }
}
