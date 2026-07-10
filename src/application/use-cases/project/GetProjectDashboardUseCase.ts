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
  colliery_code: string
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
  plots: Array<{
    id: string
    plot_number: string
    mouza: string
    land_type: string
    area_acres: string
    exhausted_area_for_jobs: string
    remaining_job_quota: number
  }>
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
        d.project.colliery_code.toLowerCase().includes(searchLower)
      )
    }

    // Paginate
    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    // Map to response DTOs
    const projects: ProjectDashboardItem[] = paged.map(d => ({
      id: d.project.id.toString(),
      name: d.project.name,
      colliery_code: d.project.colliery_code,
      total_land_limit_acres: d.project.totalLandLimit.toDecimal().toString(),
      total_budget_ceiling: d.project.total_budget_ceiling.toDecimal().toString(),
      total_employment_quota: d.project.total_employment_quota,
      boundary: d.project.boundary ?? null,
      statutory_clearances: d.project.statutory_clearances ?? null,
      locked_at: d.project.locked_at?.toISOString() ?? null,
      isLocked: d.project.isLocked(),
      payrollCount: d.payrollCount,
      totalDisbursed: d.totalDisbursed.toFixed(2),
      budgetUtilization: d.budgetUtilization.toFixed(1),
      plots: d.plots,
    }))

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
