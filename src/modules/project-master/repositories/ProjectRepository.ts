import { db } from '@/lib/db'
import { IProjectMasterCreateDTO, IProjectMasterUpdateDTO } from '../types'
import { dec, iso } from '@/app/api/_lib'

export class ProjectRepository {
  static async findAll() {
    const projects = await db.mstProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        landSchedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
        payrolls: true,
        ledgerEntries: true,
      }
    })

    const allPlots = await db.mstPlot.findMany({ include: { mouza: true } })

    return projects.map((p) => {
      const totalAcquired = p.ledgerEntries.reduce((s, e) => s + Number(e.amountLand) + Number(e.amountRnr), 0)
      return {
        id: p.id,
        name: p.name,
        collieryCode: p.collieryCode,
        totalLandLimitAcres: dec(p.totalLandLimitAcres),
        totalBudgetCeiling: dec(p.totalBudgetCeiling),
        totalEmploymentQuota: p.totalEmploymentQuota,
        boundary: p.boundary,
        statutoryClearances: p.statutoryClearances,
        lockedAt: iso(p.lockedAt),
        isLocked: p.lockedAt !== null,
        payrollCount: p.payrolls.length,
        totalDisbursed: totalAcquired.toFixed(2),
        budgetUtilization: Number(p.totalBudgetCeiling) > 0
          ? ((totalAcquired / Number(p.totalBudgetCeiling)) * 100).toFixed(1)
          : '0',
        plots: allPlots.map((pl) => ({
          id: pl.id,
          plotNumber: pl.plotNumber,
          mouza: pl.mouza.name,
          landType: pl.landType,
          areaAcres: dec(pl.areaAcres),
          exhaustedAreaForJobs: dec(pl.exhaustedAreaForJobs),
          remainingJobQuota: pl.remainingJobQuota,
        })),
      }
    })
  }

  static async findById(id: string) {
    return db.mstProject.findUnique({
      where: { id }
    })
  }

  static async create(data: IProjectMasterCreateDTO) {
    return db.mstProject.create({
      data: {
        name: data.name,
        collieryCode: data.collieryCode,
        totalLandLimitAcres: data.totalLandLimitAcres,
        totalBudgetCeiling: data.totalBudgetCeiling,
        totalEmploymentQuota: data.totalEmploymentQuota,
        boundary: data.boundary || JSON.stringify({ type: 'MultiPolygon', coordinates: [], color: '#16a34a' }),
      }
    })
  }

  static async update(id: string, data: IProjectMasterUpdateDTO) {
    return db.mstProject.update({
      where: { id },
      data
    })
  }

  static async lock(id: string) {
    return db.mstProject.update({
      where: { id },
      data: { lockedAt: new Date() }
    })
  }
}
