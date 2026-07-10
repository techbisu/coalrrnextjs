/**
 * Prisma Project Repository - Concrete implementation of IProjectRepository.
 * This belongs in the infrastructure layer and handles all database operations.
 * NO BUSINESS LOGIC HERE - only persistence concerns.
 */
import { db } from '@/lib/db'
import { Project, IProjectRepository, IProjectQueryOptions } from '@/domain'
import { IPaginatedResult } from '@/core/interfaces'
import Decimal from 'decimal.js'

export class PrismaProjectRepository implements IProjectRepository {
  
  async findById(id: string): Promise<Project | null> {
    const data = await db.mst_project.findUnique({
      where: { id },
      include: {
        land_schedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
        payrolls: true,
        ledger_entries: true,
      },
    })

    if (!data) return null

    return Project.reconstitute({
      id: data.id,
      name: data.name,
      colliery_code: data.colliery_code,
      total_land_limit_acres: data.total_land_limit_acres.toString(),
      total_budget_ceiling: data.total_budget_ceiling.toString(),
      total_employment_quota: data.total_employment_quota,
      boundary: data.boundary ? String(data.boundary) : '',
      statutory_clearances: data.statutory_clearances ? String(data.statutory_clearances) : '',
      locked_at: data.locked_at,
      lockedBy: null, // We don't track who locked in current schema
      entry_ts: data.entry_ts!,
      updt_ts: data.updt_ts!,
    })
  }

  async findAll(options?: IProjectQueryOptions): Promise<IPaginatedResult<Project>> {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (options?.colliery_code) {
      where.colliery_code = options.colliery_code
    }
    
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { colliery_code: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.mst_project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: options?.orderBy ?? { entry_ts: 'desc' },
        include: {
          land_schedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
          payrolls: true,
          ledger_entries: true,
        },
      }),
      db.mst_project.count({ where }),
    ])

    const projects = data.map(p => Project.reconstitute({
      id: p.id,
      name: p.name,
      colliery_code: p.colliery_code,
      total_land_limit_acres: p.total_land_limit_acres.toString(),
      total_budget_ceiling: p.total_budget_ceiling.toString(),
      total_employment_quota: p.total_employment_quota,
      boundary: p.boundary,
      statutory_clearances: p.statutory_clearances,
      locked_at: p.locked_at,
      lockedBy: null,
      entry_ts: p.entry_ts!,
      updt_ts: p.updt_ts!,
    }))

    return {
      data: projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async findByName(name: string): Promise<Project | null> {
    const data = await db.mst_project.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    if (!data) return null

    return Project.reconstitute({
      id: data.id,
      name: data.name,
      colliery_code: data.colliery_code,
      total_land_limit_acres: data.total_land_limit_acres.toString(),
      total_budget_ceiling: data.total_budget_ceiling.toString(),
      total_employment_quota: data.total_employment_quota,
      boundary: data.boundary ? String(data.boundary) : '',
      statutory_clearances: data.statutory_clearances ? String(data.statutory_clearances) : '',
      locked_at: data.locked_at,
      lockedBy: null,
      entry_ts: data.entry_ts!,
      updt_ts: data.updt_ts!,
    })
  }

  async findByCollieryCode(colliery_code: string, options?: IProjectQueryOptions): Promise<IPaginatedResult<Project>> {
    return this.findAll({ ...options, colliery_code })
  }

  async save(project: Project): Promise<void> {
    const data = project.toPersistence()
    
    const exists = await this.exists(project.id)
    
    if (exists) {
      await db.mst_project.update({
        where: { id: data.id },
        data: {
          name: data.name,
          colliery_code: data.colliery_code,
          total_land_limit_acres: new Decimal(data.total_land_limit_acres),
          total_budget_ceiling: new Decimal(data.total_budget_ceiling),
          total_employment_quota: data.total_employment_quota,
          boundary: data.boundary ? String(data.boundary) : '',
          statutory_clearances: data.statutory_clearances ? String(data.statutory_clearances) : '',
          updt_ts: new Date(),
        },
      })
    } else {
      await db.mst_project.create({
        data: {
          id: data.id,
          name: data.name,
          colliery_code: data.colliery_code,
          total_land_limit_acres: new Decimal(data.total_land_limit_acres),
          total_budget_ceiling: new Decimal(data.total_budget_ceiling),
          total_employment_quota: data.total_employment_quota,
          boundary: data.boundary ? String(data.boundary) : '',
          statutory_clearances: data.statutory_clearances ? String(data.statutory_clearances) : '',
        },
      })
    }
  }

  async delete(id: string): Promise<void> {
    await db.mst_project.delete({ where: { id } })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.mst_project.count({ where: { id } })
    return count > 0
  }

  async lock(id: string, user_id: string): Promise<boolean> {
    const result = await db.mst_project.updateMany({
      where: { id, locked_at: null },
      data: { locked_at: new Date() },
    })
    
    return result.count > 0
  }

  // Dashboard-specific query (separate from domain)
  async getDashboardData(): Promise<Array<{
    project: Project
    payrollCount: number
    totalDisbursed: Decimal
    budgetUtilization: number
    plots: Array<any>
  }>> {
    const projects = await db.mst_project.findMany({
      orderBy: { entry_ts: 'desc' },
      include: {
        land_schedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
        payrolls: true,
        ledger_entries: true,
      },
    })

    const allPlots = await db.mst_plot.findMany({ include: { mouza: true } })

    return projects.map(p => {
      const totalAcquired = p.ledger_entries.reduce(
        (s, e) => s.add(new Decimal(e.amount_land.toString())).add(new Decimal(e.amount_rnr.toString())),
        new Decimal(0)
      )
      const budgetCeiling = new Decimal(p.total_budget_ceiling.toString())

      const project = Project.reconstitute({
        id: p.id,
        name: p.name,
        colliery_code: p.colliery_code,
        total_land_limit_acres: p.total_land_limit_acres.toString(),
        total_budget_ceiling: p.total_budget_ceiling.toString(),
        total_employment_quota: p.total_employment_quota,
        boundary: p.boundary,
        statutory_clearances: p.statutory_clearances,
        locked_at: p.locked_at,
        lockedBy: null,
        entry_ts: p.entry_ts!,
        updt_ts: p.updt_ts!,
      })

      return {
        project,
        payrollCount: p.payrolls.length,
        totalDisbursed: totalAcquired,
        budgetUtilization: budgetCeiling.isZero() 
          ? 0 
          : totalAcquired.dividedBy(budgetCeiling).times(100).toNumber(),
        plots: allPlots.map(pl => ({
          id: pl.id.toString(),
          plot_number: pl.plot_number,
          mouza: pl.mouza.name,
          land_type: pl.land_type,
          area_acres: pl.area_acres.toString(),
          exhausted_area_for_jobs: pl.exhausted_area_for_jobs.toString(),
          remaining_job_quota: pl.remaining_job_quota,
        })),
      }
    })
  }
}
