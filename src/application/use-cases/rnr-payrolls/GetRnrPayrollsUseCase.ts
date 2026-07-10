import { IUseCase } from '../../../core/interfaces/UseCase.interface';
import { Result, Ok, Fail } from '../../../core/result/Result';
import { IRnrPayrollRepository, RnrPayrollData } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

export class GetRnrPayrollsUseCase implements IUseCase<void, RnrPayrollData[]> {
  constructor(private rnrPayrollRepo: IRnrPayrollRepository) {}

  async execute(): Promise<Result<RnrPayrollData[]>> {
    const payrolls = await this.rnrPayrollRepo.findAll();
    return Ok(payrolls);
  }
}
