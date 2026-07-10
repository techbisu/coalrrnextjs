import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IPayrollsRepository } from '@/modules/payrolls/interfaces/IPayrollsRepository'

export interface UpdatePayrollFactorDTO {
  id: string
  multiplication_factor?: string
}

export class UpdatePayrollFactorUseCase implements IUseCase<UpdatePayrollFactorDTO, any> {
  constructor(private repo: IPayrollsRepository) {}

  async execute(request: UpdatePayrollFactorDTO): Promise<Result<any>> {
    try {
      const payroll = await this.repo.findPayrollById(request.id)
      if (!payroll) return Fail('Payroll not found')
      if (payroll.state !== 'Drafting') return Fail(`Cannot modify payroll in state ${payroll.state}`)

      if (!request.multiplication_factor) return Fail('multiplication_factor required')

      const updated = await this.repo.updatePayrollFactor(request.id, request.multiplication_factor)
      
      return Ok({ multiplication_factor: updated.multiplication_factor?.toString() || '0' })
    } catch (e) {
      return Fail(e instanceof Error ? e.message : String(e))
    }
  }
}
