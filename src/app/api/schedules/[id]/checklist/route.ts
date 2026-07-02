// PATCH /api/schedules/[id]/checklist — update a CL-1 checklist item status
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers')
    const { id } = await ctx.params
    const s = await db.landSchedule.findUnique({ where: { id } })
    if (!s) return notFound('Schedule not found')
    if (s.state !== 'Drafting' && s.state !== 'AreaVetting') return badRequest(`Cannot edit checklist in state ${s.state}`)
    const body = await readJson<{ itemKey: string; status: 'pending' | 'in_progress' | 'complete' | 'skipped' }>(req)
    if (!body?.itemKey || !body.status) return badRequest('itemKey and status required')
    const checklist = JSON.parse(s.modeSpecificChecklist ?? '{"items":[]}')
    const items: Array<{ key: string; label: string; required: boolean; status: string }> = checklist.items ?? []
    const idx = items.findIndex((i) => i.key === body.itemKey)
    if (idx === -1) return badRequest(`Checklist item "${body.itemKey}" not found in ${checklist.checklistCode}`)
    items[idx].status = body.status
    checklist.items = items
    await db.landSchedule.update({ where: { id }, data: { modeSpecificChecklist: JSON.stringify(checklist) } })
    const requiredItems = items.filter((i) => i.required)
    const completedRequired = requiredItems.filter((i) => i.status === 'complete').length
    return ok({ itemKey: body.itemKey, newStatus: body.status, checklistCode: checklist.checklistCode, progress: { completedRequired, totalRequired: requiredItems.length, allRequiredDone: completedRequired === requiredItems.length } })
  } catch (e) {
    return serverError('Failed to update checklist', e instanceof Error ? e.message : String(e))
  }
}
