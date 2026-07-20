import { db } from '@/lib/db';
import { IRnrPayrollRepository, RnrPayrollData, RnrPayrollLineData } from '../../../modules/rnr-payrolls/interfaces/IRnrPayrollRepository';

export class PrismaRnrPayrollRepository implements IRnrPayrollRepository {
  async findAll(): Promise<RnrPayrollData[]> {
    const payrolls = await db.rnr_asset_payroll.findMany({
      include: { mst_project: true, rnr_asset_payroll_line: true },
      orderBy: { entry_ts: 'desc' },
    });
    return payrolls.map(p => ({
      id: p.id.toString(),
      project_id: p.project_id.toString(),
      projectName: p.mst_project?.name,
      payroll_code: p.payroll_code,
      state: p.state,
      total_value: p.total_value.toString(),
      lineCount: p.rnr_asset_payroll_line.length,
      entry_ts: p.entry_ts?.toISOString() ?? new Date().toISOString(),
      updt_ts: p.updt_ts?.toISOString() ?? new Date().toISOString(),
    }));
  }

  async findById(id: string): Promise<RnrPayrollData | null> {
    const p = await db.rnr_asset_payroll.findUnique({
      where: { id: id },
      include: { mst_project: true, rnr_asset_payroll_line: { orderBy: { entry_ts: 'asc' } } },
    });
    if (!p) return null;
    return {
      id: p.id.toString(),
      project_id: p.project_id.toString(),
      projectName: p.mst_project?.name,
      payroll_code: p.payroll_code,
      state: p.state,
      total_value: p.total_value.toString(),
      entry_ts: p.entry_ts?.toISOString() ?? new Date().toISOString(),
      updt_ts: p.updt_ts?.toISOString() ?? new Date().toISOString(),
      lines: p.rnr_asset_payroll_line.map((l: any) => ({
        id: l.id.toString(),
        payroll_id: l.payroll_id.toString(),
        beneficiary_name: l.beneficiary_name,
        entitlement_type: l.entitlement_type,
        valuation_amount: l.valuation_amount.toString(),
        pwd_rate_reference: l.pwd_rate_reference,
        formula_snapshot: l.formula_snapshot,
        entry_ts: l.entry_ts?.toISOString() ?? new Date().toISOString(),
      })),
    };
  }

  async count(): Promise<number> {
    return db.rnr_asset_payroll.count();
  }

  async create(data: { project_id: string; payroll_code: string }): Promise<RnrPayrollData> {
    const payroll = await db.rnr_asset_payroll.create({
      data: {
        project_id: data.project_id,
        payroll_code: data.payroll_code,
        state: 'Drafting',
        total_value: '0.00',
      },
      include: { mst_project: true, rnr_asset_payroll_line: true },
    });
    return {
      id: payroll.id.toString(),
      project_id: payroll.project_id.toString(),
      projectName: payroll.mst_project?.name,
      payroll_code: payroll.payroll_code,
      state: payroll.state,
      total_value: payroll.total_value.toString(),
      lineCount: payroll.rnr_asset_payroll_line ? payroll.rnr_asset_payroll_line.length : 0,
      entry_ts: payroll.entry_ts?.toISOString() ?? new Date().toISOString(),
      updt_ts: payroll.updt_ts?.toISOString() ?? new Date().toISOString(),
    };
  }

  async updateState(id: string, state: string): Promise<RnrPayrollData> {
    const updated = await db.rnr_asset_payroll.update({
      where: { id: id },
      data: { state },
      include: { mst_project: true, rnr_asset_payroll_line: true },
    });
    return {
      id: updated.id.toString(),
      project_id: updated.project_id.toString(),
      payroll_code: updated.payroll_code,
      state: updated.state,
      total_value: updated.total_value.toString(),
      lineCount: updated.rnr_asset_payroll_line.length,
      entry_ts: updated.entry_ts?.toISOString() ?? new Date().toISOString(),
      updt_ts: updated.updt_ts?.toISOString() ?? new Date().toISOString(),
    };
  }

  async delete(id: string): Promise<void> {
    await db.rnr_asset_payroll_line.deleteMany({ where: { payroll_id: id } });
    await db.rnr_asset_payroll.delete({ where: { id: id } });
  }

  async addLine(data: Omit<RnrPayrollLineData, 'id' | 'entry_ts'>): Promise<RnrPayrollLineData> {
    const line = await db.rnr_asset_payroll_line.create({
      data: {
        payroll_id: data.payroll_id,
        beneficiary_name: data.beneficiary_name,
        entitlement_type: data.entitlement_type,
        valuation_amount: data.valuation_amount,
        pwd_rate_reference: data.pwd_rate_reference ?? null,
        formula_snapshot: data.formula_snapshot,
      },
    });
    return {
      id: line.id.toString(),
      payroll_id: line.payroll_id.toString(),
      beneficiary_name: line.beneficiary_name,
      entitlement_type: line.entitlement_type,
      valuation_amount: line.valuation_amount.toString(),
      pwd_rate_reference: line.pwd_rate_reference,
      formula_snapshot: line.formula_snapshot,
      entry_ts: line.entry_ts?.toISOString() ?? new Date().toISOString(),
    };
  }

  async findLineById(lineId: string, payroll_id: string): Promise<RnrPayrollLineData | null> {
    const line = await db.rnr_asset_payroll_line.findFirst({
      where: { id: lineId, payroll_id: payroll_id },
    });
    if (!line) return null;
    return {
      id: line.id.toString(),
      payroll_id: line.payroll_id.toString(),
      beneficiary_name: line.beneficiary_name,
      entitlement_type: line.entitlement_type,
      valuation_amount: line.valuation_amount.toString(),
      pwd_rate_reference: line.pwd_rate_reference,
      formula_snapshot: line.formula_snapshot,
      entry_ts: line.entry_ts?.toISOString() ?? new Date().toISOString(),
    };
  }

  async updateLine(lineId: string, data: Partial<Omit<RnrPayrollLineData, 'id' | 'entry_ts' | 'payroll_id'>>): Promise<RnrPayrollLineData> {
    const updated = await db.rnr_asset_payroll_line.update({
      where: { id: lineId },
      data: {
        ...(data.beneficiary_name !== undefined && { beneficiary_name: data.beneficiary_name }),
        ...(data.entitlement_type !== undefined && { entitlement_type: data.entitlement_type }),
        ...(data.valuation_amount !== undefined && { valuation_amount: data.valuation_amount }),
        ...(data.pwd_rate_reference !== undefined && { pwd_rate_reference: data.pwd_rate_reference }),
        ...(data.formula_snapshot !== undefined && { formula_snapshot: data.formula_snapshot }),
      },
    });
    return {
      id: updated.id.toString(),
      payroll_id: updated.payroll_id.toString(),
      beneficiary_name: updated.beneficiary_name,
      entitlement_type: updated.entitlement_type,
      valuation_amount: updated.valuation_amount.toString(),
      pwd_rate_reference: updated.pwd_rate_reference,
      formula_snapshot: updated.formula_snapshot,
      entry_ts: updated.entry_ts?.toISOString() ?? new Date().toISOString(),
    };
  }

  async deleteLine(lineId: string): Promise<void> {
    await db.rnr_asset_payroll_line.delete({ where: { id: lineId } });
  }

  async recomputeTotal(payroll_id: string): Promise<void> {
    const allLines = await db.rnr_asset_payroll_line.findMany({ where: { payroll_id: payroll_id } });
    const total = allLines.reduce((sum, l) => sum + Number(l.valuation_amount), 0);
    await db.rnr_asset_payroll.update({
      where: { id: payroll_id },
      data: { total_value: total.toFixed(2) },
    });
  }
}
