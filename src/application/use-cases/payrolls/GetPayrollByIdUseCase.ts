import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IPayrollsRepository } from '@/modules/payrolls/interfaces/IPayrollsRepository'

export class GetPayrollByIdUseCase implements IUseCase<string, any> {
  constructor(private repo: IPayrollsRepository) {}

  async execute(id: string): Promise<Result<any>> {
    try {
      const p = await this.repo.findPayrollByIdWithDetails(id)
      if (!p) return Fail('Payroll not found')

      const reviewTasks = await this.repo.findReviewTasksForType('compensation_payroll', id)

      const result = {
        id: p.id,
        payroll_code: p.payroll_code,
        project_id: p.project_id,
        projectName: p.project.name,
        projectBudgetCeiling: p.project.total_budget_ceiling?.toString() || '0',
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
          entry_ts: l.entry_ts.toISOString(),
        })),
        reviewTasks: reviewTasks.map((r: any) => ({
          id: r.id,
          role: r.role,
          status: r.status,
          decided_by: r.decided_by,
          decided_at: r.decided_at ? r.decided_at.toISOString() : null,
          comment: r.comment,
          entry_ts: r.entry_ts.toISOString(),
        })),
        entry_ts: p.entry_ts.toISOString(),
      }

      return Ok(result)
    } catch (e) {
      return Fail(e instanceof Error ? e.message : String(e))
    }
  }
}
