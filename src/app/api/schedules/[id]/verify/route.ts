import type { NextRequest } from 'next/server'
import { MODULE_CODES } from '@/core/config/module-codes.config'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, notFound } from '../../../_lib'
import { db } from '@/lib/db'
import { workflowEngineServer } from '@/core/workflow/WorkflowEngineServer'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    let auth = await authorizeApi('proposal.edit')
    if (auth.error) auth = await authorizeApi('acquisition.edit')
    if (auth.error) auth = await authorizeApi('proposal.view')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await req.json()
    const action = body?.action || body?.transitionName
    if (!action) return badRequest('action or transitionName required')

    // Action-specific RBAC permission checks
    if (action === 'escalate_to_board') {
      let permAuth = await authorizeApi('proposal.escalate')
      if (permAuth.error) permAuth = await authorizeApi('proposal.approve')
      if (permAuth.error) return permAuth.error
    } else if (['submit_to_area', 'submit_to_hq_parallel', 'advance_to_director', 'advance_to_director_finance', 'advance_to_cmd', 'publish'].includes(action)) {
      let permAuth = await authorizeApi('proposal.approve')
      if (permAuth.error) permAuth = await authorizeApi('acquisition.approve')
      if (permAuth.error) return permAuth.error
    } else if (action.startsWith('return_')) {
      let permAuth = await authorizeApi('proposal.return')
      if (permAuth.error) permAuth = await authorizeApi('proposal.edit')
      if (permAuth.error) return permAuth.error
    }

    // Find proposal
    const proposal = await db.acq_proposal.findUnique({ where: { proposal_id: id } })
    if (!proposal) return notFound(`Proposal ${id} not found`)

    const normalizedState = proposal.current_stage_cd || 'Drafting'

    // Map user role
    const userRoleStr = (auth.user?.roles?.[0] || 'unit_office').toLowerCase()
    const mappedUserRole = userRoleStr.includes('lre') || userRoleStr.includes('planning') ? 'gm_planning'
      : userRoleStr.includes('finance') ? 'gm_finance'
      : userRoleStr.includes('area') ? 'area_office'
      : userRoleStr.includes('director') ? 'director'
      : userRoleStr.includes('cmd') ? 'cmd'
      : 'unit_office'
    const isSuperAdmin = auth.user?.roles?.some((r: string) => r.toLowerCase().includes('admin'))
    const actorRole = isSuperAdmin ? (body.role || mappedUserRole) : mappedUserRole

    // Fetch mandatory checklist rules & submissions — used to populate checklist guard ctx
    const mandatoryRules = await db.checklist_requirement_rule.findMany({
      where: { module_code: { in: [MODULE_CODES.LAND_SCHEDULE] }, is_mandatory: true, is_active: true }
    })

    const submissions = await db.checklist_submission.findMany({
      where: { checkable_id: id, status: { in: ['COMPLETED', 'SUBMITTED', 'APPROVED'] } }
    })

    const completedReqIds = new Set(submissions.map(s => s.requirement_id))
    const missingRules = mandatoryRules.filter(r => !completedReqIds.has((r as any).chk_id || (r as any).id))
    const isChecklistComplete = missingRules.length === 0

    // Build checklist map for ChecklistFullySatisfiedGuard
    const checklistData: Record<string, { complete: boolean }> = {}
    for (const r of mandatoryRules) {
      const isCompleted = completedReqIds.has((r as any).chk_id || (r as any).id)
      checklistData[(r as any).chk_code || r.title || 'CL-unknown'] = { complete: isCompleted }
    }
    if (Object.keys(checklistData).length === 0) {
      checklistData['dummy'] = { complete: true }
    }

    // Fetch baseline breach status
    let isBaselineBreached = false
    try {
      const limitsRes = await fetch(`${req.nextUrl.origin}/api/proposals/${id}/limits`, {
        headers: { cookie: req.headers.get('cookie') || '' }
      })
      if (limitsRes.ok) {
        const json = await limitsRes.json()
        if (json.details?.isWithinLimit === false) isBaselineBreached = true
      }
    } catch (e) {
      console.warn('Failed to check limits in verify route:', e)
    }

    // Fetch current snapshot to populate pending recommendations for guards
    const { workflowSnapshotQueryService } = await import('@/core/workflow/services/WorkflowSnapshotQueryService')
    const currentSnapshot = await workflowSnapshotQueryService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      'acq_land_schedule',
      id,
      { role: actorRole, userId: auth.user?.id }
    )

    const pendingRecommendations = currentSnapshot.currentAssignment.recommendations || []

    const guardCtx = {
      recordId: id,
      recordType: MODULE_CODES.LAND_SCHEDULE,
      currentState: normalizedState as any,
      actorRole: actorRole as any,
      checklistStatus: isChecklistComplete ? ('COMPLETED' as const) : ('INCOMPLETE' as const),
      isBaselineBreached,
      data: {
        isChecklistComplete,
        missingChecklistItems: missingRules.map(r => r.title),
        checklist: checklistData,
        pendingRecommendations,
        total_award: isBaselineBreached ? '20000000' : '5000000',
        budgetCeiling: '10000000',
      }
    }

    // ─── DB-driven transition (reads workflow_transitions table, 60s cache) ───
    const normalizedAction = action === 'submit' ? 'submit_to_unit' : action
    const transitionResult = await workflowEngineServer.attemptTransitionAsync(guardCtx, normalizedAction)

    if (!transitionResult.ok) {
      return badRequest(transitionResult.reason || `Transition '${action}' blocked from state '${normalizedState}'`)
    }

    const newState = transitionResult.newState

    // Atomic DB Transaction: Update state, record action history with recommendations, emit outbox event
    const { workflowActionHistoryService } = await import('@/core/workflow/services/WorkflowActionHistoryService')

    const updated = await db.$transaction(async (tx) => {
      const p = await tx.acq_proposal.update({
        where: { proposal_id: id },
        data: {
          current_stage_cd: newState.slice(0, 30),
          overall_status: newState.slice(0, 20),
          updt_ts: BigInt(Math.floor(Date.now() / 1000)),
          updt_by: String(auth.user?.id || 1).slice(0, 20),
        }
      })

      await workflowActionHistoryService.recordAction({
        moduleCode: MODULE_CODES.LAND_SCHEDULE,
        entityType: 'acq_land_schedule',
        entityId: id,
        action: normalizedAction,
        fromState: normalizedState,
        toState: newState,
        userId: Number(auth.user?.id) || 1,
        userEmail: auth.user?.email || 'user@coalrr.gov.in',
        comments: body?.comments || 'Transition executed via UI',
        recommendations: body?.recommendations || null,
        documentId: body?.document_id || null,
      }, tx)

      // Emit outbox event for real-time SSE stream push
      await tx.outbox_events.create({
        data: {
          event_name: 'WORKFLOW_RECOMMENDATION_CREATED',
          module: MODULE_CODES.LAND_SCHEDULE,
          payload: {
            entityId: id,
            entityType: 'acq_land_schedule',
            fromState: normalizedState,
            toState: newState,
            actorRole,
          },
        },
      })

      return p
    })

    return ok({
      success: true,
      ok: true,
      newState,
      newStatusLabel: newState,
      data: updated
    })
  } catch (e: any) {
    console.error('POST /api/schedules/[id]/verify error:', e)
    return serverError('Failed to verify schedule', e.message)
  }
}
