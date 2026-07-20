import { db } from '@/lib/db';
import { IPayrollsRepository } from '@/modules/payrolls/interfaces/IPayrollsRepository';

export class PrismaPayrollsRepository implements IPayrollsRepository {
  async findAllPayrollsWithDetails(): Promise<any[]> {
    return db.compensation_payroll.findMany({
      include: { mst_project: true, compensation_payroll_line: true },
      orderBy: { entry_ts: 'desc' },
    });
  }

  async findReviewTasksForType(type: string, id?: string): Promise<any[]> {
    const where: any = { reviewable_type: type };
    if (id) {
      where.reviewable_id = id;
    }
    return db.workflow_review_task.findMany({
      where,
      orderBy: { entry_ts: 'asc' },
    });
  }

  async findProjectById(id: string): Promise<any | null> {
    return db.mst_project.findUnique({ where: { id } });
  }

  async createPayroll(data: any): Promise<any> {
    return db.compensation_payroll.create({ data });
  }

  async findPayrollByIdWithDetails(id: string): Promise<any | null> {
    return db.compensation_payroll.findUnique({
      where: { id },
      include: {
        mst_project: true,
        compensation_payroll_line: { orderBy: { entry_ts: 'asc' } },
      },
    });
  }

  async findPayrollById(id: string): Promise<any | null> {
    return db.compensation_payroll.findUnique({
      where: { id },
      include: { mst_project: true },
    });
  }

  async updatePayrollFactor(id: string, factor: string): Promise<any> {
    return db.compensation_payroll.update({
      where: { id },
      data: { multiplication_factor: factor },
    });
  }

  async createPayrollLine(data: any): Promise<any> {
    return db.compensation_payroll_line.create({ data });
  }

  async findPayrollLines(payroll_id: string): Promise<any[]> {
    return db.compensation_payroll_line.findMany({ where: { payroll_id } });
  }

  async updatePayrollTotals(id: string, count: number, total: string): Promise<any> {
    return db.compensation_payroll.update({
      where: { id },
      data: { landowner_count: count, total_award: total },
    });
  }

  async deletePayrollLine(lineId: string): Promise<void> {
    await db.compensation_payroll_line.delete({ where: { id: lineId } });
  }
}
