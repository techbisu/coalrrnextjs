export interface IPayrollsRepository {
  findAllPayrollsWithDetails(): Promise<any[]>;
  findReviewTasksForType(type: string, id?: string): Promise<any[]>;
  findProjectById(id: string): Promise<any | null>;
  createPayroll(data: any): Promise<any>;
  findPayrollByIdWithDetails(id: string): Promise<any | null>;
  findPayrollById(id: string): Promise<any | null>;
  updatePayrollFactor(id: string, factor: string): Promise<any>;
  createPayrollLine(data: any): Promise<any>;
  findPayrollLines(payroll_id: string): Promise<any[]>;
  updatePayrollTotals(id: string, count: number, total: string): Promise<any>;
  deletePayrollLine(lineId: string): Promise<void>;
}
