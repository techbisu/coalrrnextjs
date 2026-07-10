import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IPayrollsRepository } from '@/modules/payrolls/interfaces/IPayrollsRepository'
import { CompensationInput, MoneyValue, LandCompensationEngine } from '@/lib/engines'

export interface AddPayrollLineDTO {
  id: string
  landowner_name?: string
  plot_reference?: string
  land_value?: string
  asset_value?: string
  years_since_notification?: number
}

export class AddPayrollLineUseCase implements IUseCase<AddPayrollLineDTO, any> {
  constructor(private repo: IPayrollsRepository) {}

  async execute(request: AddPayrollLineDTO): Promise<Result<any>> {
    try {
      const payroll = await this.repo.findPayrollById(request.id)
      if (!payroll) return Fail('Payroll not found')
      if (payroll.state !== 'Drafting') return Fail(`Cannot modify payroll in state ${payroll.state}`)

      if (!request.landowner_name || !request.land_value || !request.asset_value) {
        return Fail('landowner_name, land_value, asset_value required')
      }

      const input = new CompensationInput({
        land_value: MoneyValue.from(request.land_value),
        asset_value: MoneyValue.from(request.asset_value),
        years_since_notification: request.years_since_notification ?? 0,
        multiplication_factor: payroll.multiplication_factor.toString(),
      })
      const result = new LandCompensationEngine().calculate(input)

      const totalStr = result.total.toString()
      const newTotal = Number(payroll.total_award) + Number(totalStr)
      const ceiling = Number(payroll.project.total_budget_ceiling)
      if (newTotal > ceiling) {
        return Fail(
          `Baseline breach: payroll total ₹${newTotal.toFixed(2)} would exceed project ceiling ₹${ceiling.toFixed(2)}. Escalate to Board.`
        )
      }

      const line = await this.repo.createPayrollLine({
        payroll_id: request.id,
        landowner_name: request.landowner_name,
        plot_reference: request.plot_reference ?? '',
        land_value: request.land_value,
        asset_value: request.asset_value,
        solatium_amount: result.solatium.amount.toString(),
        escalation_amount: result.escalation.amount.toString(),
        total_award: result.total.toString(),
        years_since_notification: request.years_since_notification ?? 0,
        formula_snapshot: JSON.stringify({
          calculator: 'LandCompensationEngine',
          version: '1.0',
          inputs: {
            land_value: request.land_value,
            asset_value: request.asset_value,
            years_since_notification: request.years_since_notification ?? 0,
            multiplication_factor: payroll.multiplication_factor.toString(),
          },
          breakdown: {
            base: input.land_value.add(input.asset_value).format(),
            solatium: result.solatium.amount.format(),
            escalation: result.escalation.amount.format(),
          },
          output: result.total.format(),
        }),
      })

      const allLines = await this.repo.findPayrollLines(request.id)
      const batchTotal = allLines.reduce((s: number, l: any) => s + Number(l.total_award), 0)
      
      await this.repo.updatePayrollTotals(request.id, allLines.length, batchTotal.toFixed(2))

      return Ok({
        line: {
          id: line.id,
          landowner_name: line.landowner_name,
          plot_reference: line.plot_reference,
          land_value: line.land_value?.toString() || '0',
          asset_value: line.asset_value?.toString() || '0',
          solatium_amount: line.solatium_amount?.toString() || '0',
          escalation_amount: line.escalation_amount?.toString() || '0',
          total_award: line.total_award?.toString() || '0',
          years_since_notification: line.years_since_notification,
          formula_snapshot: line.formula_snapshot,
        },
        batchTotal: batchTotal.toFixed(2),
        lineCount: allLines.length,
      })
    } catch (e) {
      return Fail(e instanceof Error ? e.message : String(e))
    }
  }
}
