import { IUseCase } from '../../../core/interfaces/UseCase.interface';
import { Result, Ok, Fail } from '../../../core/result/Result';
import { IRnrPayrollRepository, RnrPayrollData } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

export interface GetRnrPayrollDto {
  id: string;
}

export class GetRnrPayrollUseCase implements IUseCase<GetRnrPayrollDto, RnrPayrollData> {
  constructor(private rnrPayrollRepo: IRnrPayrollRepository) {}

  async execute(request: GetRnrPayrollDto): Promise<Result<RnrPayrollData>> {
    const payroll = await this.rnrPayrollRepo.findById(request.id);
    if (!payroll) {
      return Fail('R&R payroll not found');
    }
    return Ok(payroll);
  }
}
