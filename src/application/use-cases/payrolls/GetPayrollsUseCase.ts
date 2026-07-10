import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IPayrollsRepository } from '@/modules/payrolls/interfaces/IPayrollsRepository'

export class GetPayrollsUseCase implements IUseCase<void, any> {
  constructor(private repo: IPayrollsRepository) {}

  async execute(): Promise<Result<any>> {
    try {
      const payrolls = await this.repo.findAllPayrollsWithDetails()
      const allReviewTasks = await this.repo.findReviewTasksForType('compensation_payroll')
      
      const tasksByPayroll = new Map<string, typeof allReviewTasks>()
      for (const t of allReviewTasks) {
        const arr = tasksByPayroll.get(t.reviewable_id) ?? []
        arr.push(t)
        tasksByPayroll.set(t.reviewable_id, arr)
      }
      
      const result = payrolls.map((p: any) => ({
        id: p.id,
        payroll_code: p.payroll_code,
        project_id: p.project_id,
        projectName: p.project.name,
        multiplication_factor: p.multiplication_factor?.toString() || '0',
        state: p.state,
        landowner_count: p.landowner_count,
        total_award: p.total_award?.toString() || '0',
        lines: p.lines.map((l: any) => ({
          id: l.id,
          landowner_name: l.landowner_name,
          plot_reference: l.plot_reference,
          land_value: l.land_value?.toString() || '0',
          asset_value: l.asset_value?.toString() || '0',
          solatium_amount: l.solatium_amount?.toString() || '0',
          escalation_amount: l.escalation_amount?.toString() || '0',
          total_award: l.total_award?.toString() || '0',
          years_since_notification: l.years_since_notification,
          formula_snapshot: l.formula_snapshot,
        })),
        reviewTasks: (tasksByPayroll.get(p.id) ?? []).map((r: any) => ({
          id: r.id,
          role: r.role,
          status: r.status,
          decided_by: r.decided_by,
          decided_at: r.decided_at ? r.decided_at.toISOString() : null,
          comment: r.comment,
        })),
        entry_ts: p.entry_ts.toISOString(),
      }))
      
      return Ok(result)
    } catch (e) {
      return Fail(e instanceof Error ? e.message : String(e))
    }
  }
}
