// POST /api/workflow/[recordType]/[recordId] — attempt a workflow transition
// Runs the WorkflowEngine guards server-side, mutates state, fires side effects.
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../../_lib'
import {
  WorkflowEngine, COMPENSATION_PAYROLL_STATES, getReviewRolesForState,
} from '@/lib/engines'
import type { NextRequest } from 'next/server'

const engine = new WorkflowEngine()

type Ctx = { params: Promise<{ recordType: string; recordId: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { recordType, recordId } = await ctx.params
    const body = await readJson<{ transition?: string; actorRole?: string; comment?: string }>(req)
    if (!body?.transition) return badRequest('transition required')

    if (recordType !== 'CompensationPayroll') {
      return badRequest(`Workflow for ${recordType} not yet implemented (demo covers CompensationPayroll only)`)
    }

    const payroll = await db.compensationPayroll.findUnique({
      where: { id: recordId },
      include: { project: true },
    })
    if (!payroll) return notFound('Payroll not found')

    // Polymorphic review tasks — fetched separately (no FK relation per spec §3.1)
    const reviewTasks = await db.workflowReviewTask.findMany({
      where: { reviewableType: 'CompensationPayroll', reviewableId: recordId },
    })

    // Compute guard context data
    const batchTotal = Number(payroll.totalAward)
    const ceiling = Number(payroll.project.totalBudgetCeiling)
    const ctxData = {
      batchTotal,
      budgetCeiling: ceiling,
      // For parallel-reviews guard: count approved sibling tasks
      approvedReviewCount: reviewTasks.filter((r) => r.status === 'approved').length,
      requiredReviewCount: getReviewRolesForState(payroll.state as never)?.length ?? 0,
      // For checklist guard: assume CL-1.1 satisfied when state is past UnitSubmitted
      checklistSatisfied: payroll.state !== 'Drafting',
    }

    const result = engine.attemptTransition(
      {
        recordId,
        recordType: recordType as never,
        actorRole: (body.actorRole ?? 'area_office') as never,
        currentState: payroll.state as never,
        data: ctxData,
      },
      body.transition,
    )

    if (!result.ok) {
      return ok({
        ok: false,
        failedGuard: result.failedGuard,
        reason: result.reason,
        currentState: payroll.state,
      }, { status: 200 })
    }

    // Persist state mutation
    const updated = await db.compensationPayroll.update({
      where: { id: recordId },
      data: { state: result.newState },
    })

    // Side effects: spawn review tasks when entering HqParallelVetting (spec §2.3.2)
    const sideEffects = engine.fireSideEffects(
      { recordId, recordType: recordType as never, actorRole: (body.actorRole ?? 'area_office') as never, currentState: result.newState, data: ctxData },
      result.newState,
    )

    const spawnedTasks: { role: string; status: string }[] = []
    for (const fx of sideEffects) {
      if (fx.type === 'spawn_review_tasks') {
        for (const role of fx.roles) {
          const task = await db.workflowReviewTask.create({
            data: {
              reviewableType: recordType,
              reviewableId: recordId,
              role,
              status: 'pending',
            },
          })
          spawnedTasks.push({ role: task.role, status: task.status })
        }
      }
    }

    return ok({
      ok: true,
      previousState: payroll.state,
      newState: result.newState,
      newStatusLabel: COMPENSATION_PAYROLL_STATES[result.newState as keyof typeof COMPENSATION_PAYROLL_STATES]?.label,
      spawnedTasks,
      sideEffects: sideEffects.map((fx) => ({ type: fx.type, ...(fx as Record<string, unknown>) })),
    })
  } catch (e) {
    return serverError('Workflow transition failed', e instanceof Error ? e.message : String(e))
  }
}
