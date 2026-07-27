import { db } from '@/lib/db'
import { IDashboardRepository, DashboardStats } from '@/domain/repositories/IDashboardRepository'
import Decimal from 'decimal.js'

export class PrismaDashboardRepository implements IDashboardRepository {
  async getSystemDashboardStats(): Promise<DashboardStats> {
    const [
      projectsData,
      scheduleCountsData,
      payrollCountsData,
      plots,
      claims,
      payrolls,
      ledger_entries,
      nomineePools,
      employmentApps,
      grievances,
      reviewTasks,
    ] = await Promise.all([
      db.project.findMany(),
      db.land_schedule.groupBy({ by: ['project_id'], _count: { id: true } }),
      db.compensation_payroll.groupBy({ by: ['project_id'], _count: { id: true } }),
      db.mst_plot.findMany({ include: { mouza: true } }),
      db.form_i_claim.findMany({ include: { mst_plot: true } }),
      db.compensation_payroll.findMany({ include: { compensation_payroll_line: true } }), // removed invalid mst_project include
      db.form_d_ledger_entry.findMany({ orderBy: { paid_at: 'desc' } }),
      db.nominee_pool.findMany({ include: { nominee_pool_contribution: { include: { form_i_claim: true } } } }),
      db.employment_application.findMany(),
      db.grievance.findMany({ orderBy: { sla_due_at: 'asc' } }),
      db.workflow_review_task.findMany({ orderBy: { entry_ts: 'desc' } }),
    ])

    const scheduleCounts = new Map(scheduleCountsData.map(c => [c.project_id, c._count.id]))
    const payrollProjectCounts = new Map(payrollCountsData.map(c => [c.project_id, c._count.id]))
    const projectNameMap = new Map(projectsData.map(p => [p.projCd, p.projNm]))

    // Attach counts to projects
    const projects = projectsData.map(p => ({
      ...p,
      _count: {
        land_schedule: scheduleCounts.get(p.projCd) || 0,
        compensation_payroll: payrollProjectCounts.get(p.projCd) || 0
      }
    }))

    // Attach project names to payrolls (since we couldn't include project directly)
    const enrichedPayrolls = payrolls.map(p => ({
      ...p,
      mst_project: { name: projectNameMap.get(p.project_id) || 'Unknown Project' }
    }))

    return {
      projects,
      plots,
      claims,
      payrolls: enrichedPayrolls,
      ledger_entries,
      nomineePools,
      employmentApps,
      grievances,
      reviewTasks
    }
  }
}
