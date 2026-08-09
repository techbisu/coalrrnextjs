import { NextResponse } from 'next/server'
import { MODULE_CODES } from '@/core/config/module-codes.config'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, notFound } from '../../../_lib'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { WorkflowEngine } from '@/core/workflow/engine'
import { COMPENSATION_PAYROLL_STATES } from '@/core/workflow/states'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    let auth = await authorizeApi('proposal.edit')
    if (auth.error) {
      auth = await authorizeApi('acquisition.edit')
    }
    if (auth.error) {
      auth = await authorizeApi('proposal.view')
    }
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await req.json()
    const action = body?.action || body?.transitionName
    if (!action) return badRequest('action or transitionName required')

    // Action-specific RBAC permission checks
    if (action === 'escalate_to_board') {
      let permAuth = await authorizeApi('proposal.escalate')
      if (permAuth.error) {
        permAuth = await authorizeApi('proposal.approve')
      }
      if (permAuth.error) return permAuth.error
    } else if (action === 'submit_to_area' || action === 'submit_to_hq_parallel' || action === 'advance_to_director' || action === 'advance_to_director_finance' || action === 'advance_to_cmd' || action === 'publish') {
      let permAuth = await authorizeApi('proposal.approve')
      if (permAuth.error) {
        permAuth = await authorizeApi('acquisition.approve')
      }
      if (permAuth.error) return permAuth.error
    } else if (action.startsWith('return_')) {
      let permAuth = await authorizeApi('proposal.return')
      if (permAuth.error) {
        permAuth = await authorizeApi('proposal.edit')
      }
      if (permAuth.error) return permAuth.error
    }

    // Find proposal
    const proposal = await db.acq_proposal.findUnique({
      where: { proposal_id: id }
    })

    if (!proposal) return notFound(`Proposal ${id} not found`)

    const normalizedState = proposal.current_stage_cd || 'Drafting'
    const userRoleStr = (auth.user?.roles?.[0] || 'unit_office').toLowerCase()
    const mappedUserRole = (userRoleStr.includes('lre') || userRoleStr.includes('planning')) ? 'gm_planning'
      : userRoleStr.includes('finance') ? 'gm_finance'
      : userRoleStr.includes('area') ? 'area_office'
      : userRoleStr.includes('director') ? 'director'
      : userRoleStr.includes('cmd') ? 'cmd'
      : 'unit_office'
    const isSuperAdmin = auth.user?.roles?.some((r: string) => r.toLowerCase().includes('admin'))
    const actorRole = isSuperAdmin ? (body.role || mappedUserRole) : mappedUserRole

    // Fetch mandatory checklist rules & submissions for proposal
    const mandatoryRules = await db.checklist_requirement_rule.findMany({
      where: { module_code: { in: [MODULE_CODES.LAND_SCHEDULE, 'LAND_ACQ_PROPOSAL', 'LAND_SCHEDULE'] }, is_mandatory: true, is_active: true }
    })

    const submissions = await db.checklist_submission.findMany({
      where: {
        checkable_id: id,
        status: { in: ['COMPLETED', 'SUBMITTED', 'APPROVED'] }
      }
    })

    const completedReqIds = new Set(submissions.map(s => s.requirement_id))
    const missingRules = mandatoryRules.filter(r => !completedReqIds.has((r as any).chk_id || (r as any).id))
    const isChecklistComplete = missingRules.length === 0

    // Fetch limits for baseline check
    let isBaselineBreached = false
    try {
      const limitsRes = await fetch(`${req.nextUrl.origin}/api/proposals/${id}/limits`, {
        headers: { cookie: req.headers.get('cookie') || '' }
      })
      if (limitsRes.ok) {
        const json = await limitsRes.json()
        if (json.details && json.details.isWithinLimit === false) {
          isBaselineBreached = true
        }
      }
    } catch (e) {
      console.warn('Failed to check limits in verify route:', e)
    }

    const engine = new WorkflowEngine()
    const guardCtx = {
      recordId: id,
      recordType: MODULE_CODES.LAND_SCHEDULE,
      currentState: normalizedState as any,
      actorRole: actorRole,
      checklistStatus: isChecklistComplete ? ('COMPLETED' as const) : ('INCOMPLETE' as const),
      isBaselineBreached: isBaselineBreached,
      data: {
        isChecklistComplete,
        missingChecklistItems: missingRules.map(r => r.title),
        total_award: isBaselineBreached ? '20000000' : '5000000',
        budgetCeiling: '10000000'
      }
    }

    const transitionResult = engine.attemptTransition(
      guardCtx,
      action === 'submit' ? 'submit_to_unit' : action
    )

    if (!transitionResult.ok) {
      return badRequest(transitionResult.reason || `Transition '${action}' blocked from state '${normalizedState}'`)
    }

    const newState = transitionResult.newState

    // Update acq_proposal state in DB (safely truncating overall_status and updt_by to match VarChar(20) limits)
    const updated = await db.acq_proposal.update({
      where: { proposal_id: id },
      data: {
        current_stage_cd: newState.slice(0, 30),
        overall_status: newState.slice(0, 20),
        updt_ts: BigInt(Math.floor(Date.now() / 1000)),
        updt_by: String(auth.user?.id || 1)
      }
    })

    const stateMeta = COMPENSATION_PAYROLL_STATES[newState as keyof typeof COMPENSATION_PAYROLL_STATES]

    return ok({
      success: true,
      ok: true,
      newStatusLabel: stateMeta?.label || newState,
      data: updated
    })
  } catch (e: any) {
    console.error('POST /api/schedules/[id]/verify error:', e)
    return serverError('Failed to verify schedule', e.message)
  }
}
