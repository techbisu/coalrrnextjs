import { IUseCase } from '../../../core/interfaces/UseCase.interface';
import { Result, Ok, Fail } from '../../../core/result/Result';
import { IRnrPayrollRepository } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

export interface DeleteRnrPayrollLineDto {
  payroll_id: string;
  lineId: string;
}

export class DeleteRnrPayrollLineUseCase implements IUseCase<DeleteRnrPayrollLineDto, void> {
  constructor(private rnrPayrollRepo: IRnrPayrollRepository) {}

  async execute(request: DeleteRnrPayrollLineDto): Promise<Result<void>> {
    const line = await this.rnrPayrollRepo.findLineById(request.lineId, request.payroll_id);
    if (!line) {
      return Fail('Line not found');
    }

    await this.rnrPayrollRepo.deleteLine(request.lineId);
    await this.rnrPayrollRepo.recomputeTotal(request.payroll_id);

    return Ok(undefined);
  }
}
