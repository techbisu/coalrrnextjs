// GET /api/rnr-payrolls — List R&R asset payrolls
// POST /api/rnr-payrolls — Create new R&R payroll
import { db } from '@/lib/db'
import { ok, badRequest, serverError, readJson } from '../_lib'

export async function GET() {
  try {
    const payrolls = await db.rnrAssetPayroll.findMany({
      include: { project: true, lines: true },
      orderBy: { createdAt: 'desc' },
    })
    return ok(payrolls.map((p) => ({
      id: p.id, payrollCode: p.payrollCode, projectId: p.projectId,
      projectName: p.project.name, state: p.state, totalValue: p.totalValue,
      lineCount: p.lines.length, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
    })))
  } catch (e) {
    return serverError('Failed to load R&R payrolls', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson<{ projectId?: string; entitlementType?: string; pafIds?: string[] }>(req)
    if (!body?.projectId) return badRequest('projectId is required')

    const count = await db.rnrAssetPayroll.count()
    const payrollCode = `RNR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    const payroll = await db.rnrAssetPayroll.create({
      data: { projectId: body.projectId, payrollCode, state: 'Drafting', totalValue: '0.00' },
      include: { project: true, lines: true },
    })
    return ok({ id: payroll.id, payrollCode: payroll.payrollCode, projectId: payroll.projectId, projectName: payroll.project.name, state: payroll.state, totalValue: payroll.totalValue, lineCount: 0, createdAt: payroll.createdAt.toISOString() })
  } catch (e) {
    return serverError('Failed to create R&R payroll', e instanceof Error ? e.message : String(e))
  }
}