import { IUseCase } from '../../../core/interfaces/UseCase.interface';
import { Result, Ok, Fail } from '../../../core/result/Result';
import { IRnrPayrollRepository, RnrPayrollData } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

const VALID_TRANSITIONS: Record<string, string[]> = {
  Drafting: ['Submitted', 'Cancelled'],
  Submitted: ['UnderReview', 'Returned', 'Cancelled'],
  UnderReview: ['Approved', 'Rejected', 'Returned', 'Cancelled'],
  Approved: ['Published', 'Returned'],
  Returned: ['Submitted', 'Cancelled'],
  Rejected: [],
  Cancelled: [],
  Published: [],
};

export interface UpdateRnrPayrollStateDto {
  id: string;
  state?: string;
}

export class UpdateRnrPayrollStateUseCase implements IUseCase<UpdateRnrPayrollStateDto, RnrPayrollData> {
  constructor(private rnrPayrollRepo: IRnrPayrollRepository) {}

  async execute(request: UpdateRnrPayrollStateDto): Promise<Result<RnrPayrollData>> {
    const existing = await this.rnrPayrollRepo.findById(request.id);
    if (!existing) {
      return Fail('R&R payroll not found');
    }

    if (request.state && request.state !== existing.state) {
      const allowed = VALID_TRANSITIONS[existing.state] ?? [];
      if (!allowed.includes(request.state)) {
        return Fail(`Cannot transition from ${existing.state} to ${request.state}`);
      }
      
      const updated = await this.rnrPayrollRepo.updateState(request.id, request.state);
      return Ok(updated);
    }

    return Ok(existing);
  }
}
