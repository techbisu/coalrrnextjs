// POST /api/schedules/[id]/verify — proposal verification workflow transition
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import { COMPENSATION_PAYROLL_STATES } from '@/lib/engines'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers')
    const { id } = await ctx.params
    const body = await readJson<{ transition?: string }>(req)
    if (!body?.transition) return badRequest('transition required')
    const s = await db.landSchedule.findUnique({ where: { id }, include: { project: true } })
    if (!s) return notFound('Schedule not found')
    const currentState = s.state as keyof typeof COMPENSATION_PAYROLL_STATES
    const stateMeta = COMPENSATION_PAYROLL_STATES[currentState]
    if (!stateMeta) return badRequest(`Unknown state: ${s.state}`)
    const transition = stateMeta.allowedTransitions.find((t) => t.name === body.transition)
    if (!transition) return ok({ ok: false, reason: `No authorised transition "${body.transition}" from state "${s.state}"`, currentState: s.state })

    const checklist = JSON.parse(s.modeSpecificChecklist ?? '{"items":[]}')
    const requiredItems: Array<{ status: string }> = (checklist.items ?? []).filter((i: { required: boolean }) => i.required)
    const allChecklistDone = requiredItems.every((i) => i.status === 'complete')

    if (transition.guard) {
      const guardResult = transition.guard.check({
        recordId: id, recordType: 'LandSchedule' as never, actorRole: user.role as never, currentState: s.state as never,
        data: { checklistSatisfied: allChecklistDone, batchTotal: Number(s.totalAreaAcres), budgetCeiling: Number(s.project.totalLandLimitAcres) },
      })
      if (!guardResult.ok) return ok({ ok: false, failedGuard: transition.guard.name, reason: guardResult.reason, currentState: s.state })
    }
    if (body.transition === 'submit_to_area' && !allChecklistDone) {
      return ok({ ok: false, failedGuard: 'ChecklistFullySatisfied', reason: `Cannot forward: ${requiredItems.filter((i) => i.status !== 'complete').length} required checklist items still incomplete.`, currentState: s.state })
    }

    const updated = await db.landSchedule.update({ where: { id }, data: { state: transition.to } })
    let spawnedTasks: { role: string }[] = []
    if (transition.to === 'HqParallelVetting') {
      for (const role of ['gm_planning', 'gm_finance']) {
        await db.workflowReviewTask.create({ data: { reviewableType: 'LandSchedule', reviewableId: id, role, status: 'pending' } })
        spawnedTasks.push({ role })
      }
    }
    return ok({ ok: true, previousState: s.state, newState: updated.state, newStatusLabel: COMPENSATION_PAYROLL_STATES[transition.to as keyof typeof COMPENSATION_PAYROLL_STATES]?.label, spawnedTasks })
  } catch (e) {
    return serverError('Verification transition failed', e instanceof Error ? e.message : String(e))
  }
}
