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
  collieryCode: string
  totalLandLimitAcres: string
  totalBudgetCeiling: string
  totalEmploymentQuota: number
  boundary: string | null
  statutoryClearances: string | null
  lockedAt: string | null
  isLocked: boolean
  payrollCount: number
  totalDisbursed: string
  budgetUtilization: string
  plots: Array<{
    id: string
    plotNumber: string
    mouza: string
    landType: string
    areaAcres: string
    exhaustedAreaForJobs: string
    remainingJobQuota: number
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
        d.project.collieryCode.toLowerCase().includes(searchLower)
      )
    }

    // Paginate
    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    // Map to response DTOs
    const projects: ProjectDashboardItem[] = paged.map(d => ({
      id: d.project.id,
      name: d.project.name,
      collieryCode: d.project.collieryCode,
      totalLandLimitAcres: d.project.totalLandLimit.toDecimal().toString(),
      totalBudgetCeiling: d.project.totalBudgetCeiling.toDecimal().toString(),
      totalEmploymentQuota: d.project.totalEmploymentQuota,
      boundary: d.project.boundary ?? null,
      statutoryClearances: d.project.statutoryClearances ?? null,
      lockedAt: d.project.lockedAt?.toISOString() ?? null,
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
