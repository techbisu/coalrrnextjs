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
    const data = await db.mstProject.findUnique({
      where: { id },
      include: {
        landSchedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
        payrolls: true,
        ledgerEntries: true,
      },
    })

    if (!data) return null

    return Project.reconstitute({
      id: data.id,
      name: data.name,
      collieryCode: data.collieryCode,
      totalLandLimitAcres: data.totalLandLimitAcres.toString(),
      totalBudgetCeiling: data.totalBudgetCeiling.toString(),
      totalEmploymentQuota: data.totalEmploymentQuota,
      boundary: data.boundary,
      statutoryClearances: data.statutoryClearances,
      lockedAt: data.lockedAt,
      lockedBy: null, // We don't track who locked in current schema
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async findAll(options?: IProjectQueryOptions): Promise<IPaginatedResult<Project>> {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (options?.collieryCode) {
      where.collieryCode = options.collieryCode
    }
    
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { collieryCode: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.mstProject.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: options?.orderBy ?? { createdAt: 'desc' },
        include: {
          landSchedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
          payrolls: true,
          ledgerEntries: true,
        },
      }),
      db.mstProject.count({ where }),
    ])

    const projects = data.map(p => Project.reconstitute({
      id: p.id,
      name: p.name,
      collieryCode: p.collieryCode,
      totalLandLimitAcres: p.totalLandLimitAcres.toString(),
      totalBudgetCeiling: p.totalBudgetCeiling.toString(),
      totalEmploymentQuota: p.totalEmploymentQuota,
      boundary: p.boundary,
      statutoryClearances: p.statutoryClearances,
      lockedAt: p.lockedAt,
      lockedBy: null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
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
    const data = await db.mstProject.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    if (!data) return null

    return Project.reconstitute({
      id: data.id,
      name: data.name,
      collieryCode: data.collieryCode,
      totalLandLimitAcres: data.totalLandLimitAcres.toString(),
      totalBudgetCeiling: data.totalBudgetCeiling.toString(),
      totalEmploymentQuota: data.totalEmploymentQuota,
      boundary: data.boundary,
      statutoryClearances: data.statutoryClearances,
      lockedAt: data.lockedAt,
      lockedBy: null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async findByCollieryCode(collieryCode: string, options?: IProjectQueryOptions): Promise<IPaginatedResult<Project>> {
    return this.findAll({ ...options, collieryCode })
  }

  async save(project: Project): Promise<void> {
    const data = project.toPersistence()
    
    const exists = await this.exists(project.id)
    
    if (exists) {
      await db.mstProject.update({
        where: { id: data.id },
        data: {
          name: data.name,
          collieryCode: data.collieryCode,
          totalLandLimitAcres: new Decimal(data.totalLandLimitAcres),
          totalBudgetCeiling: new Decimal(data.totalBudgetCeiling),
          totalEmploymentQuota: data.totalEmploymentQuota,
          boundary: data.boundary,
          statutoryClearances: data.statutoryClearances,
          updatedAt: new Date(),
        },
      })
    } else {
      await db.mstProject.create({
        data: {
          id: data.id,
          name: data.name,
          collieryCode: data.collieryCode,
          totalLandLimitAcres: new Decimal(data.totalLandLimitAcres),
          totalBudgetCeiling: new Decimal(data.totalBudgetCeiling),
          totalEmploymentQuota: data.totalEmploymentQuota,
          boundary: data.boundary,
          statutoryClearances: data.statutoryClearances,
        },
      })
    }
  }

  async delete(id: string): Promise<void> {
    await db.mstProject.delete({ where: { id } })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.mstProject.count({ where: { id } })
    return count > 0
  }

  async lock(id: string, userId: string): Promise<boolean> {
    const result = await db.mstProject.updateMany({
      where: { id, lockedAt: null },
      data: { lockedAt: new Date() },
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
    const projects = await db.mstProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        landSchedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
        payrolls: true,
        ledgerEntries: true,
      },
    })

    const allPlots = await db.mstPlot.findMany({ include: { mouza: true } })

    return projects.map(p => {
      const totalAcquired = p.ledgerEntries.reduce(
        (s, e) => s.add(new Decimal(e.amountLand.toString())).add(new Decimal(e.amountRnr.toString())),
        new Decimal(0)
      )
      const budgetCeiling = new Decimal(p.totalBudgetCeiling.toString())

      const project = Project.reconstitute({
        id: p.id,
        name: p.name,
        collieryCode: p.collieryCode,
        totalLandLimitAcres: p.totalLandLimitAcres.toString(),
        totalBudgetCeiling: p.totalBudgetCeiling.toString(),
        totalEmploymentQuota: p.totalEmploymentQuota,
        boundary: p.boundary,
        statutoryClearances: p.statutoryClearances,
        lockedAt: p.lockedAt,
        lockedBy: null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })

      return {
        project,
        payrollCount: p.payrolls.length,
        totalDisbursed: totalAcquired,
        budgetUtilization: budgetCeiling.isZero() 
          ? 0 
          : totalAcquired.dividedBy(budgetCeiling).times(100).toNumber(),
        plots: allPlots.map(pl => ({
          id: pl.id,
          plotNumber: pl.plotNumber,
          mouza: pl.mouza.name,
          landType: pl.landType,
          areaAcres: pl.areaAcres.toString(),
          exhaustedAreaForJobs: pl.exhaustedAreaForJobs.toString(),
          remainingJobQuota: pl.remainingJobQuota,
        })),
      }
    })
  }
}
