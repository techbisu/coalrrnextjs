import { IUseCase } from '../../../core/interfaces/UseCase.interface';
import { Result, Ok, Fail } from '../../../core/result/Result';
import { IRnrPayrollRepository, RnrPayrollData } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

export interface CreateRnrPayrollDto {
  project_id?: string;
}

export class CreateRnrPayrollUseCase implements IUseCase<CreateRnrPayrollDto, RnrPayrollData> {
  constructor(private rnrPayrollRepo: IRnrPayrollRepository) {}

  async execute(request: CreateRnrPayrollDto): Promise<Result<RnrPayrollData>> {
    if (!request.project_id) {
      return Fail('project_id is required');
    }

    const count = await this.rnrPayrollRepo.count();
    const payroll_code = `RNR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payroll = await this.rnrPayrollRepo.create({
      project_id: request.project_id,
      payroll_code,
    });

    return Ok(payroll);
  }
}
