export interface RnrPayrollData {
  id: string;
  project_id: string;
  projectName?: string;
  payroll_code: string;
  state: string;
  total_value: string;
  lineCount?: number;
  entry_ts: string;
  updt_ts: string;
  lines?: RnrPayrollLineData[];
}

export interface RnrPayrollLineData {
  id: string;
  payroll_id: string;
  beneficiary_name: string;
  entitlement_type: string;
  valuation_amount: string;
  pwd_rate_reference: string | null;
  formula_snapshot: string;
  entry_ts: string;
}

export interface IRnrPayrollRepository {
  findAll(): Promise<RnrPayrollData[]>;
  findById(id: string): Promise<RnrPayrollData | null>;
  count(): Promise<number>;
  create(data: { project_id: string; payroll_code: string }): Promise<RnrPayrollData>;
  updateState(id: string, state: string): Promise<RnrPayrollData>;
  delete(id: string): Promise<void>;
  
  addLine(data: Omit<RnrPayrollLineData, 'id' | 'entry_ts' | 'payroll_id'> & { payroll_id: string }): Promise<RnrPayrollLineData>;
  findLineById(lineId: string, payroll_id: string): Promise<RnrPayrollLineData | null>;
  updateLine(lineId: string, data: Partial<Omit<RnrPayrollLineData, 'id' | 'entry_ts' | 'payroll_id'>>): Promise<RnrPayrollLineData>;
  deleteLine(lineId: string): Promise<void>;
  
  recomputeTotal(payroll_id: string): Promise<void>;
}
