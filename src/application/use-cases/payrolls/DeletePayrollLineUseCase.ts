import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IPayrollsRepository } from '@/modules/payrolls/interfaces/IPayrollsRepository'

export interface DeletePayrollLineDTO {
  id: string
  lineId: string
}

export class DeletePayrollLineUseCase implements IUseCase<DeletePayrollLineDTO, any> {
  constructor(private repo: IPayrollsRepository) {}

  async execute(request: DeletePayrollLineDTO): Promise<Result<any>> {
    try {
      const payroll = await this.repo.findPayrollById(request.id)
      if (!payroll) return Fail('Payroll not found')
      if (payroll.state !== 'Drafting') return Fail(`Cannot delete line from payroll in state ${payroll.state}`)

      await this.repo.deletePayrollLine(request.lineId)

      const remaining = await this.repo.findPayrollLines(request.id)
      const batchTotal = remaining.reduce((s: number, l: any) => s + Number(l.total_award), 0)
      
      await this.repo.updatePayrollTotals(request.id, remaining.length, batchTotal.toFixed(2))

      return Ok({ deleted: true, lineCount: remaining.length, batchTotal: batchTotal.toFixed(2) })
    } catch (e) {
      return Fail(e instanceof Error ? e.message : String(e))
    }
  }
}
