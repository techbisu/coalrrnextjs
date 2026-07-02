// PATCH/DELETE /api/rnr-payrolls/[id]/lines/[lineId]
import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError, readJson } from '../../../../_lib'
import type { NextRequest } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  try {
    const { id, lineId } = await params
    const body = await readJson<Record<string, unknown>>(req)
    if (!body) return badRequest('Invalid body')

    const line = await db.rnrAssetPayrollLine.findFirst({ where: { id: lineId, payrollId: id } })
    if (!line) return notFound('Line not found')

    const updated = await db.rnrAssetPayrollLine.update({
      where: { id: lineId },
      data: {
        ...(body.beneficiaryName && { beneficiaryName: String(body.beneficiaryName) }),
        ...(body.entitlementType && { entitlementType: String(body.entitlementType) }),
        ...(body.valuationAmount && { valuationAmount: String(body.valuationAmount) }),
        ...(body.pwdRateReference !== undefined && { pwdRateReference: body.pwdRateReference ? String(body.pwdRateReference) : null }),
        ...(body.formulaSnapshot && { formulaSnapshot: String(body.formulaSnapshot) }),
      },
    })

    // Recompute total
    const allLines = await db.rnrAssetPayrollLine.findMany({ where: { payrollId: id } })
    const total = allLines.reduce((sum, l) => sum + Number(l.valuationAmount), 0)
    await db.rnrAssetPayroll.update({ where: { id }, data: { totalValue: total.toFixed(2) } })

    return ok({ id: updated.id, beneficiaryName: updated.beneficiaryName, entitlementType: updated.entitlementType, valuationAmount: updated.valuationAmount })
  } catch (e) {
    return serverError('Failed to update line', e instanceof Error ? e.message : String(e))
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  try {
    const { id, lineId } = await params
    const line = await db.rnrAssetPayrollLine.findFirst({ where: { id: lineId, payrollId: id } })
    if (!line) return notFound('Line not found')

    await db.rnrAssetPayrollLine.delete({ where: { id: lineId } })
    const allLines = await db.rnrAssetPayrollLine.findMany({ where: { payrollId: id } })
    const total = allLines.reduce((sum, l) => sum + Number(l.valuationAmount), 0)
    await db.rnrAssetPayroll.update({ where: { id }, data: { totalValue: total.toFixed(2) } })

    return ok({ deleted: true })
  } catch (e) {
    return serverError('Failed to delete line', e instanceof Error ? e.message : String(e))
  }
}