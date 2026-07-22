/**
 * Get Project Dashboard Use Case - Application service for dashboard data.
 * Returns projects with calculated metrics for the dashboard view.
 */
import { IUseCase, Result } from '@/core'
import { IProjectRepository } from '@/domain'
import Decimal from 'decimal.js'

export interface ProjectDashboardItem {
  id: string
  name: string
  mine_cd: string
  state_lgd?: string
  district_lgd?: string | null
  block_lgd?: string | null
  area_cd?: string | null
  mouza_lgds?: string[]
  pr_docs?: Array<{
    id: string
    file_name: string
    file_size_kb: number
    mime_type: string
    virus_scan_status: 'clean' | 'scanning' | 'infected'
  }>
  total_land_limit_acres: string
  total_budget_ceiling: string
  total_employment_quota: number
  boundary: string | null
  statutory_clearances: string | null
  locked_at: string | null
  isLocked: boolean
  payrollCount: number
  totalDisbursed: string
  budgetUtilization: string
  total_acquired_area: string
  areaUtilization: number
  plots: Array<{
    id: string
    plot_number: string
    mouza: string
    land_type: string
    area_acres: string
    exhausted_area_for_jobs: string
    remaining_job_quota: number
  }>
  breachedProposals: Array<{ id: string; schedule_code: string }>
  boardApprovals: Array<{ id: string; date: string; remarks: string; file_id?: string; file_name?: string }>
}

export interface GetProjectDashboardRequest {
  page?: number
  pageSize?: number
  search?: string
}

export interface GetProjectDashboardResponse {
  projects: ProjectDashboardItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class GetProjectDashboardUseCase implements IUseCase<GetProjectDashboardRequest, GetProjectDashboardResponse> {
  constructor(
    private readonly projectRepository: any // Using PrismaProjectRepository for dashboard-specific queries
  ) {}

  async execute(request: GetProjectDashboardRequest): Promise<Result<GetProjectDashboardResponse>> {
    const page = request.page ?? 1
    const pageSize = request.pageSize ?? 20

    // Get dashboard data with calculated metrics
    const dashboardData = await this.projectRepository.getDashboardData()

    // Filter by search if provided
    let filtered = dashboardData
    if (request.search) {
      const searchLower = request.search.toLowerCase()
      filtered = dashboardData.filter(d => 
        d.project.name.toLowerCase().includes(searchLower) ||
        d.project.mine_cd.toLowerCase().includes(searchLower)
      )
    }

    // Paginate
    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    // Map to response DTOs
    const projects: ProjectDashboardItem[] = paged.map(d => {
      // Safe extraction to handle both domain entity instances and plain objects
      const p: any = d.project;
      const approvedArea = p.totalApprovedArea ?? p._totalApprovedArea;
      const landBudget = p.landBudget ?? p._landBudget;
      const rrBudget = p.rrBudget ?? p._rrBudget;
      
      const totalLandLimitAcres = approvedArea?.toDecimal ? approvedArea.toDecimal().toString() : (p.total_land_limit_acres || '0');
      const totalBudgetCeiling = (landBudget && rrBudget && landBudget.add) 
        ? landBudget.add(rrBudget).toDecimal().toString() 
        : (p.total_budget_ceiling || '0');
      const eclProjCd = p.eclProjCd ?? p._eclProjCd ?? p.mine_cd ?? '';
      const actualMineCd = p.id?.toString() || p.projCd || '';

      return {
      id: actualMineCd,
      name: p.name || p.projNm || p._projNm || '',
      mine_cd: actualMineCd,
      ecl_proj_cd: eclProjCd,
      state_lgd: d.state_lgd,
      district_lgd: d.district_lgd,
      block_lgd: d.block_lgd,
      area_cd: d.area_cd,
      mouza_lgds: d.mouza_lgds,
      pr_docs: d.pr_docs,
      total_land_limit_acres: totalLandLimitAcres,
      land_budget: landBudget?.toDecimal ? landBudget.toDecimal().toString() : (p.landBudget || p.land_budget || '0'),
      rr_budget: rrBudget?.toDecimal ? rrBudget.toDecimal().toString() : (p.rrBudget || p.rr_budget || '0'),
      total_budget_ceiling: totalBudgetCeiling,
      total_employment_quota: p.totalEmpSanctioned ?? p._totalEmpSanctioned ?? p.total_employment_quota ?? 0,
      boundary: d.boundary,
      statutory_clearances: d.statutory_clearances,
      locked_at: d.locked_at?.toISOString() ?? null,
      isLocked: d.locked_at !== null,
      payrollCount: d.payrollCount,
      totalDisbursed: d.totalDisbursed.toFixed(2),
      budgetUtilization: d.budgetUtilization.toFixed(1),
      total_acquired_area: d.total_acquired_area,
      areaUtilization: d.areaUtilization,
      plots: d.plots,
      breachedProposals: d.breachedProposals,
      boardApprovals: d.boardApprovals,
    }})

    return {
      isSuccess: true,
      isFailure: false,
      value: {
        projects,
        total,
        page,
        pageSize,
        totalPages,
      },
      error: null,
    }
  }
}
