import { IUseCase, Result } from '@/core'
import { IDashboardRepository, DashboardStats } from '@/domain/repositories/IDashboardRepository'
import Decimal from 'decimal.js'

export interface GetSystemDashboardRequest {}

export interface SystemDashboardNotification {
  id: string
  type: 'sla' | 'grievance' | 'approval' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export interface GetSystemDashboardResponse {
  stats: {
    projectCount: number
    plotCount: number
    claimCount: number
    payrollCount: number
    ledgerEntryCount: number
    nomineePoolCount: number
    employmentAppCount: number
    openGrievanceCount: number
    pendingReviewCount: number
    totalBudget: string
    totalSpent: string
    budgetUtilization: string
    totalAcreage: string
    totalAwardPending: string
  }
  projects: any[]
  plots: any[]
  payrolls: any[]
  ledger_entries: any[]
  nomineePools: any[]
  employmentApps: any[]
  grievances: any[]
  reviewTasks: any[]
  notifications: SystemDashboardNotification[]
  stateDistribution: Record<string, number>
  landTypeDistribution: Record<string, number>
}

export class GetSystemDashboardUseCase implements IUseCase<GetSystemDashboardRequest, GetSystemDashboardResponse> {
  constructor(private readonly dashboardRepository: IDashboardRepository) {}

  async execute(): Promise<Result<GetSystemDashboardResponse>> {
    const data = await this.dashboardRepository.getSystemDashboardStats()

    const {
      projects, plots, claims, payrolls, ledger_entries,
      nomineePools, employmentApps, grievances, reviewTasks
    } = data

    // Safe parsing for decimals
    const dec = (val: any) => {
      if (!val) return '0'
      if (val instanceof Decimal || val.toDecimal) return val.toString()
      return new Decimal(val).toString()
    }
    const iso = (val: any) => val ? new Date(val).toISOString() : null

    const totalBudget = projects.reduce((s, p) => s + Number(p.landBudget || 0) + Number(p.rrBudget || 0), 0)
    const totalSpent = ledger_entries.reduce((s, e) => s + Number(e.amount_land || 0) + Number(e.amount_rnr || 0), 0)
    const totalAcreage = plots.reduce((s, p) => s + Number(p.area_acres || 0), 0)
    const totalAwardPending = payrolls
      .filter((p) => p.state !== 'Published')
      .reduce((s, p) => s + Number(p.total_award || 0), 0)

    const openGrievances = grievances.filter((g) => !g.resolution)
    const pendingReviews = reviewTasks.filter((r) => r.status === 'pending')

    const now = Date.now()
    const notifications: SystemDashboardNotification[] = [
      ...openGrievances.map((g) => ({
        id: g.id,
        type: 'grievance' as const,
        title: `grievance ${g.grievance_code}`,
        message: g.description?.slice(0, 120) || '',
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

    const response: GetSystemDashboardResponse = {
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
        id: p.projCd,
        name: p.projNm,
        mine_cd: p.eclProjCd,
        total_land_limit_acres: dec(p.totalApprovedArea),
        total_budget_ceiling: dec(Number(p.landBudget || 0) + Number(p.rrBudget || 0)),
        total_employment_quota: p.totalEmpSanctioned || 0,
        locked_at: iso(p.lockedAt),
        scheduleCount: p._count.land_schedule,
        payrollCount: p._count.compensation_payroll,
      })),
      plots: plots.map((p) => ({
        id: p.id,
        plot_number: p.plot_number,
        mouza: p.mouza?.mouza_en || '',
        land_type: p.land_type,
        area_acres: dec(p.area_acres),
        exhausted_area_for_jobs: dec(p.exhausted_area_for_jobs),
        remaining_job_quota: p.remaining_job_quota,
      })),
      payrolls: payrolls.map((p) => ({
        id: p.id,
        payroll_code: p.payroll_code,
        projectName: p.mst_project?.name || '',
        state: p.state,
        landowner_count: p.landowner_count,
        total_award: dec(p.total_award),
        multiplication_factor: dec(p.multiplication_factor),
        lineCount: p.compensation_payroll_line?.length || 0,
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
        contributionCount: np.nominee_pool_contribution?.length || 0,
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
    }

    return {
      isSuccess: true,
      isFailure: false,
      value: response,
      error: null
    }
  }
}
