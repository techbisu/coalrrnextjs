import { db } from '@/lib/db';
import { IPayrollsRepository } from '@/modules/payrolls/interfaces/IPayrollsRepository';

export class PrismaPayrollsRepository implements IPayrollsRepository {
  async findAllPayrollsWithDetails(): Promise<any[]> {
    const payrolls = await db.compensation_payroll.findMany({
      include: { compensation_payroll_line: true },
      orderBy: { entry_ts: 'desc' },
    });
    
    // Fetch projects for all payrolls
    const projectIds = [...new Set(payrolls.map(p => p.project_id))];
    const projects = await db.project.findMany({ where: { projCd: { in: projectIds } } });
    const projectMap = new Map(projects.map(p => [p.projCd, p]));
    
    return payrolls.map(p => ({
      ...p,
      mst_project: projectMap.get(p.project_id) || null
    }));
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
    return db.project.findUnique({ where: { projCd: id } });
  }

  async createPayroll(data: any): Promise<any> {
    return db.compensation_payroll.create({ data });
  }

  async findPayrollByIdWithDetails(id: string): Promise<any | null> {
    const payroll = await db.compensation_payroll.findUnique({
      where: { id },
      include: {
        compensation_payroll_line: { orderBy: { entry_ts: 'asc' } },
      },
    });
    
    if (!payroll) return null;
    const project = await db.project.findUnique({ where: { projCd: payroll.project_id } });
    
    return {
      ...payroll,
      mst_project: project || null
    };
  }

  async findPayrollById(id: string): Promise<any | null> {
    const payroll = await db.compensation_payroll.findUnique({
      where: { id },
    });
    
    if (!payroll) return null;
    const project = await db.project.findUnique({ where: { projCd: payroll.project_id } });
    
    return {
      ...payroll,
      mst_project: project || null
    };
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
