import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IPayrollsRepository } from '@/modules/payrolls/interfaces/IPayrollsRepository'

export interface CreatePayrollDTO {
  project_id?: string
  payroll_code?: string
  multiplication_factor?: string
}

export class CreatePayrollUseCase implements IUseCase<CreatePayrollDTO, any> {
  constructor(private repo: IPayrollsRepository) {}

  async execute(request: CreatePayrollDTO): Promise<Result<any>> {
    try {
      if (!request.project_id) return Fail('project_id required')
      
      const project = await this.repo.findProjectById(request.project_id)
      if (!project) return Fail('Project not found')

      const payroll = await this.repo.createPayroll({
        project_id: request.project_id,
        payroll_code: request.payroll_code ?? `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        multiplication_factor: request.multiplication_factor ?? '1.0000',
        state: 'Drafting',
        landowner_count: 0,
        total_award: '0.00',
      })
      
      return Ok(payroll)
    } catch (e) {
      return Fail(e instanceof Error ? e.message : String(e))
    }
  }
}
