// GET/PATCH/DELETE /api/rnr-payrolls/[id]
import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'

const VALID_TRANSITIONS: Record<string, string[]> = {
  Drafting: ['Submitted', 'Cancelled'],
  Submitted: ['UnderReview', 'Returned', 'Cancelled'],
  UnderReview: ['Approved', 'Rejected', 'Returned', 'Cancelled'],
  Approved: ['Published', 'Returned'],
  Returned: ['Submitted', 'Cancelled'],
  Rejected: [],
  Cancelled: [],
  Published: [],
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const p = await db.rnrAssetPayroll.findUnique({
      where: { id }, include: { project: true, lines: { orderBy: { createdAt: 'asc' } } },
    })
    if (!p) return notFound('R&R payroll not found')
    return ok({
      id: p.id, payrollCode: p.payrollCode, projectId: p.projectId, projectName: p.project.name,
      state: p.state, totalValue: p.totalValue,
      lines: p.lines.map((l) => ({ id: l.id, beneficiaryName: l.beneficiaryName, entitlementType: l.entitlementType, valuationAmount: l.valuationAmount, pwdRateReference: l.pwdRateReference, formulaSnapshot: l.formulaSnapshot, createdAt: l.createdAt.toISOString() })),
      createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
    })
  } catch (e) {
    return serverError('Failed to load R&R payroll', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson<{ state?: string }>(req)
    const existing = await db.rnrAssetPayroll.findUnique({ where: { id } })
    if (!existing) return notFound('R&R payroll not found')

    if (body?.state && body.state !== existing.state) {
      const allowed = VALID_TRANSITIONS[existing.state] ?? []
      if (!allowed.includes(body.state)) return badRequest(`Cannot transition from ${existing.state} to ${body.state}`)
    }

    const updated = await db.rnrAssetPayroll.update({
      where: { id },
      data: body?.state ? { state: body.state } : {},
      include: { project: true, lines: true },
    })
    return ok({ id: updated.id, payrollCode: updated.payrollCode, state: updated.state, totalValue: updated.totalValue, lineCount: updated.lines.length, updatedAt: updated.updatedAt.toISOString() })
  } catch (e) {
    return serverError('Failed to update R&R payroll', e instanceof Error ? e.message : String(e))
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.rnrAssetPayroll.findUnique({ where: { id } })
    if (!existing) return notFound('R&R payroll not found')
    if (existing.state !== 'Drafting') return badRequest('Only Drafting payrolls can be deleted')
    await db.rnrAssetPayrollLine.deleteMany({ where: { payrollId: id } })
    await db.rnrAssetPayroll.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError('Failed to delete R&R payroll', e instanceof Error ? e.message : String(e))
  }
}