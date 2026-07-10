import { IUseCase } from '../../../core/interfaces/UseCase.interface';
import { Result, Ok, Fail } from '../../../core/result/Result';
import { IRnrPayrollRepository, RnrPayrollLineData } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

export interface UpdateRnrPayrollLineDto {
  payroll_id: string;
  lineId: string;
  beneficiary_name?: string;
  entitlement_type?: string;
  valuation_amount?: string;
  pwd_rate_reference?: string | null;
  formula_snapshot?: string;
}

export class UpdateRnrPayrollLineUseCase implements IUseCase<UpdateRnrPayrollLineDto, RnrPayrollLineData> {
  constructor(private rnrPayrollRepo: IRnrPayrollRepository) {}

  async execute(request: UpdateRnrPayrollLineDto): Promise<Result<RnrPayrollLineData>> {
    const line = await this.rnrPayrollRepo.findLineById(request.lineId, request.payroll_id);
    if (!line) {
      return Fail('Line not found');
    }

    const updated = await this.rnrPayrollRepo.updateLine(request.lineId, {
      beneficiary_name: request.beneficiary_name,
      entitlement_type: request.entitlement_type,
      valuation_amount: request.valuation_amount,
      pwd_rate_reference: request.pwd_rate_reference,
      formula_snapshot: request.formula_snapshot,
    });

    await this.rnrPayrollRepo.recomputeTotal(request.payroll_id);

    return Ok(updated);
  }
}
