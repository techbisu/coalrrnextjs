// GET /api/dashboard — aggregate KPI data for the main dashboard
import { db } from '@/lib/db'
import { ok, dec, iso, serverError } from '../_lib'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    const [
      projects, plots, claims, payrolls, ledger_entries,
      nomineePools, employmentApps, grievances, reviewTasks,
    ] = await Promise.all([
      db.mst_project.findMany({ include: { _count: { select: { land_schedules: true, payrolls: true } } } }),
      db.mst_plot.findMany({ include: { mouza: true } }),
      db.form_i_claim.findMany({ include: { plot: true } }),
      db.compensation_payroll.findMany({ include: { lines: true, project: true } }),
      db.form_d_ledger_entry.findMany({ orderBy: { paid_at: 'desc' } }),
      db.nominee_pool.findMany({ include: { contributions: { include: { form_i_claim: true } } } }),
      db.employment_application.findMany(),
      db.grievance.findMany({ orderBy: { sla_due_at: 'asc' } }),
      db.workflow_review_task.findMany({ orderBy: { entry_ts: 'desc' } }),
    ])

    const totalBudget = projects.reduce((s, p) => s + Number(p.total_budget_ceiling), 0)
    const totalSpent = ledger_entries.reduce((s, e) => s + Number(e.amount_land) + Number(e.amount_rnr), 0)
    const totalAcreage = plots.reduce((s, p) => s + Number(p.area_acres), 0)
    const totalAwardPending = payrolls
      .filter((p) => p.state !== 'Published')
      .reduce((s, p) => s + Number(p.total_award), 0)

    const openGrievances = grievances.filter((g) => !g.resolution)
    const pendingReviews = reviewTasks.filter((r) => r.status === 'pending')

    const now = Date.now()
    const notifications = [
      ...openGrievances.map((g) => ({
        id: g.id,
        type: 'grievance' as const,
        title: `grievance ${g.grievance_code}`,
        message: g.description.slice(0, 120),
        timestamp: g.entry_ts!.toISOString(),
        read: false,
      })),
      ...claims
        .filter((c) => c.transparency_window_ends_at && new Date(c.transparency_window_ends_at).getTime() > now)
        .map((c) => ({
          id: `sla-${c.id}`,
          type: 'sla' as const,
          title: `Transparency window: ${c.claim_code}`,
          message: `Ends ${new Date(c.transparency_window_ends_at!).toLocaleDateString('en-IN')}`,
          timestamp: c.submitted_at?.toISOString() ?? c.entry_ts!.toISOString(),
          read: false,
        })),
      ...pendingReviews.slice(0, 5).map((r) => ({
        id: `rev-${r.id}`,
        type: 'approval' as const,
        title: `Pending review: ${r.role}`,
        message: `${r.reviewable_type} awaiting ${r.role} decision`,
        timestamp: r.entry_ts!.toISOString(),
        read: false,
      })),
    ]

    const stateDistribution: Record<string, number> = {}
    for (const p of payrolls) stateDistribution[p.state] = (stateDistribution[p.state] ?? 0) + 1
    for (const c of claims) stateDistribution[c.state] = (stateDistribution[c.state] ?? 0) + 1
    for (const a of employmentApps) stateDistribution[a.state] = (stateDistribution[a.state] ?? 0) + 1

    const landTypeDistribution: Record<string, number> = {}
    for (const p of plots) landTypeDistribution[p.land_type] = (landTypeDistribution[p.land_type] ?? 0) + 1

    return ok({
      stats: {
        projectCount: projects.length,
        plotCount: plots.length,
        claimCount: claims.length,
        payrollCount: payrolls.length,
        ledgerEntryCount: ledger_entries.length,
        nomineePoolCount: nomineePools.length,
        employmentAppCount: employmentApps.length,
        openGrievanceCount: openGrievances.length,
        pendingReviewCount: pendingReviews.length,
        totalBudget: totalBudget.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        budgetUtilization: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0',
        totalAcreage: totalAcreage.toFixed(4),
        totalAwardPending: totalAwardPending.toFixed(2),
      },
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        mine_cd: p.mine_cd,
        total_land_limit_acres: dec(p.total_land_limit_acres),
        total_budget_ceiling: dec(p.total_budget_ceiling),
        total_employment_quota: p.total_employment_quota,
        locked_at: iso(p.locked_at),
        scheduleCount: p._count.land_schedules,
        payrollCount: p._count.payrolls,
      })),
      plots: plots.map((p) => ({
        id: p.id,
        plot_number: p.plot_number,
        mouza: p.mouza.mouza_en,
        land_type: p.land_type,
        area_acres: dec(p.area_acres),
        exhausted_area_for_jobs: dec(p.exhausted_area_for_jobs),
        remaining_job_quota: p.remaining_job_quota,
      })),
      payrolls: payrolls.map((p) => ({
        id: p.id,
        payroll_code: p.payroll_code,
        projectName: p.project.name,
        state: p.state,
        landowner_count: p.landowner_count,
        total_award: dec(p.total_award),
        multiplication_factor: dec(p.multiplication_factor),
        lineCount: p.lines.length,
        entry_ts: p.entry_ts!.toISOString(),
      })),
      ledger_entries: ledger_entries.map((e) => ({
        id: e.id,
        plot_id: e.plot_id,
        payee_name: e.payee_name,
        amount_land: dec(e.amount_land),
        amount_rnr: dec(e.amount_rnr),
        rtgs_utr_reference: e.rtgs_utr_reference,
        row_hash: e.row_hash,
        previous_hash: e.previous_hash,
        state: e.state,
        paid_at: e.paid_at.toISOString(),
      })),
      nomineePools: nomineePools.map((np) => ({
        id: np.id,
        nominee_name: np.nominee_name,
        pooled_acreage: dec(np.pooled_acreage),
        apply_button_unlocked: np.apply_button_unlocked,
        contributionCount: np.contributions.length,
      })),
      employmentApps: employmentApps.map((a) => ({
        id: a.id,
        application_code: a.application_code,
        form_ix_balance_acres: dec(a.form_ix_balance_acres),
        form_x_balance_jobs: a.form_x_balance_jobs,
        state: a.state,
      })),
      grievances: grievances.map((g) => ({
        id: g.id,
        grievance_code: g.grievance_code,
        complainant_name: g.complainant_name,
        description: g.description,
        sla_due_at: g.sla_due_at.toISOString(),
        resolution: g.resolution,
        daysRemaining: Math.ceil((g.sla_due_at.getTime() - now) / 86400000),
      })),
      reviewTasks: reviewTasks.map((r) => ({
        id: r.id,
        reviewable_type: r.reviewable_type,
        reviewable_id: r.reviewable_id,
        role: r.role,
        status: r.status,
        decided_by: r.decided_by,
        decided_at: iso(r.decided_at),
        comment: r.comment,
        entry_ts: r.entry_ts!.toISOString(),
      })),
      notifications,
      stateDistribution,
      landTypeDistribution,
    })
  } catch (e) {
    return serverError('Failed to load dashboard', e instanceof Error ? e.message : String(e))
  }
}
