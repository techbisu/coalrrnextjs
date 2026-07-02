// POST /api/schedules/[id]/items — add a plot to the schedule
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers can add plot items')
    const { id } = await ctx.params
    const s = await db.landSchedule.findUnique({ where: { id } })
    if (!s) return notFound('Schedule not found')
    if (s.state !== 'Drafting') return badRequest(`Cannot add items to schedule in state ${s.state}`)
    const body = await readJson<{ plotId?: string; annexureTag?: 'A' | 'B' | 'C' }>(req)
    if (!body?.plotId) return badRequest('plotId required')
    const plot = await db.mstPlot.findUnique({ where: { id: body.plotId } })
    if (!plot) return badRequest('Plot not found')
    const existingItem = await db.landScheduleItem.findFirst({ where: { plotId: body.plotId, isActive: true, schedule: { state: { not: 'Cancelled' } } }, include: { schedule: true } })
    if (existingItem && existingItem.scheduleId !== id) return badRequest(`Plot ${plot.plotNumber} is already active in schedule ${existingItem.schedule.scheduleCode}.`)
    const tag = body.annexureTag ?? 'A'
    await db.landScheduleItem.create({ data: { scheduleId: id, plotId: body.plotId, annexureTag: tag, isActive: true } })
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
    return ok({ plotNumber: plot.plotNumber, totalAreaAcres: totalArea.toFixed(4), itemCount: allItems.length }, { status: 201 })
  } catch (e) {
    return serverError('Failed to add item', e instanceof Error ? e.message : String(e))
  }
}
