import { IUseCase } from '../../../core/interfaces/UseCase.interface';
import { Ok, Fail, Result } from '../../../core/result/Result';
import { IRnrPayrollRepository, RnrPayrollLineData } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

export interface AddRnrPayrollLineDto {
  payroll_id: string;
  beneficiary_name?: string;
  entitlement_type?: string;
  valuation_amount?: string;
  pwd_rate_reference?: string;
}

const VALID_TYPES = ['homestead', 'shifting_allowance', 'cattle_shed', 'subsistence_grant'];

export class AddRnrPayrollLineUseCase implements IUseCase<AddRnrPayrollLineDto, RnrPayrollLineData> {
  constructor(private rnrPayrollRepo: IRnrPayrollRepository) {}

  async execute(request: AddRnrPayrollLineDto): Promise<Result<RnrPayrollLineData>> {
    if (!request.beneficiary_name || !request.entitlement_type || !request.valuation_amount) {
      return Fail('beneficiary_name, entitlement_type, and valuation_amount are required');
    }
    
    if (!VALID_TYPES.includes(request.entitlement_type)) {
      return Fail(`Invalid entitlement_type. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    const payroll = await this.rnrPayrollRepo.findById(request.payroll_id);
    if (!payroll) {
      return Fail('R&R payroll not found');
    }

    const formula_snapshot = JSON.stringify({
      calculator: `Rnr${request.entitlement_type.charAt(0).toUpperCase()}${request.entitlement_type.slice(1).replace(/_./g, (x) => x[1].toUpperCase())}`,
      rate: request.valuation_amount,
      unit: 'per_unit',
      qty: '1',
    });

    const line = await this.rnrPayrollRepo.addLine({
      payroll_id: request.payroll_id,
      beneficiary_name: request.beneficiary_name,
      entitlement_type: request.entitlement_type,
      valuation_amount: request.valuation_amount,
      pwd_rate_reference: request.pwd_rate_reference ?? null,
      formula_snapshot,
    });

    await this.rnrPayrollRepo.recomputeTotal(request.payroll_id);

    return Ok(line);
  }
}
