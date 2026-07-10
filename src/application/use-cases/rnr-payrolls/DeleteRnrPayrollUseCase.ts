import { IUseCase } from '../../../core/interfaces/UseCase.interface';
import { Result, Ok, Fail } from '../../../core/result/Result';
import { IRnrPayrollRepository } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

export interface DeleteRnrPayrollDto {
  id: string;
}

export class DeleteRnrPayrollUseCase implements IUseCase<DeleteRnrPayrollDto, void> {
  constructor(private rnrPayrollRepo: IRnrPayrollRepository) {}

  async execute(request: DeleteRnrPayrollDto): Promise<Result<void>> {
    const existing = await this.rnrPayrollRepo.findById(request.id);
    if (!existing) {
      return Fail('R&R payroll not found');
    }

    if (existing.state !== 'Drafting') {
      return Fail('Only Drafting payrolls can be deleted');
    }

    await this.rnrPayrollRepo.delete(request.id);
    return Ok(undefined);
  }
}
