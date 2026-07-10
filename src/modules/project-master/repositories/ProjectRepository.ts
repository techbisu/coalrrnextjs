import { db } from '@/lib/db'
import { IProjectMasterCreateDTO, IProjectMasterUpdateDTO } from '../types'
import { dec, iso } from '@/app/api/_lib'

export class ProjectRepository {
  static async findAll() {
    const projects = await db.mst_project.findMany({
      orderBy: { entry_ts: 'desc' },
      include: {
        land_schedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
        payrolls: true,
        ledger_entries: true,
      }
    })

    const allPlots = await db.mst_plot.findMany({ include: { mouza: true } })

    return projects.map((p) => {
      const totalAcquired = p.ledger_entries.reduce((s, e) => s + Number(e.amount_land) + Number(e.amount_rnr), 0)
      return {
        id: p.id,
        name: p.name,
        colliery_code: p.colliery_code,
        total_land_limit_acres: dec(p.total_land_limit_acres),
        total_budget_ceiling: dec(p.total_budget_ceiling),
        total_employment_quota: p.total_employment_quota,
        boundary: p.boundary,
        statutory_clearances: p.statutory_clearances,
        locked_at: iso(p.locked_at),
        isLocked: p.locked_at !== null,
        payrollCount: p.payrolls.length,
        totalDisbursed: totalAcquired.toFixed(2),
        budgetUtilization: Number(p.total_budget_ceiling) > 0
          ? ((totalAcquired / Number(p.total_budget_ceiling)) * 100).toFixed(1)
          : '0',
        plots: allPlots.map((pl) => ({
          id: pl.id,
          plot_number: pl.plot_number,
          mouza: pl.mouza.name,
          land_type: pl.land_type,
          area_acres: dec(pl.area_acres),
          exhausted_area_for_jobs: dec(pl.exhausted_area_for_jobs),
          remaining_job_quota: pl.remaining_job_quota,
        })),
      }
    })
  }

  static async findById(id: string) {
    return db.mst_project.findUnique({
      where: { id }
    })
  }

  static async create(data: IProjectMasterCreateDTO) {
    return db.mst_project.create({
      data: {
        name: data.name,
        colliery_code: data.colliery_code,
        total_land_limit_acres: data.total_land_limit_acres,
        total_budget_ceiling: data.total_budget_ceiling,
        total_employment_quota: data.total_employment_quota,
        boundary: data.boundary || JSON.stringify({ type: 'MultiPolygon', coordinates: [], color: '#16a34a' }),
      }
    })
  }

  static async update(id: string, data: IProjectMasterUpdateDTO) {
    return db.mst_project.update({
      where: { id },
      data
    })
  }

  static async lock(id: string) {
    return db.mst_project.update({
      where: { id },
      data: { locked_at: new Date() }
    })
  }
}
