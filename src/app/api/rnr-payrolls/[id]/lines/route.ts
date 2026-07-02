// POST /api/rnr-payrolls/[id]/lines — Add line to R&R payroll
import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError, readJson } from '../../../_lib'
import type { NextRequest } from 'next/server'

const VALID_TYPES = ['homestead', 'shifting_allowance', 'cattle_shed', 'subsistence_grant']

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson<{ beneficiaryName?: string; entitlementType?: string; valuationAmount?: string; pwdRateReference?: string }>(req)
    if (!body?.beneficiaryName || !body?.entitlementType || !body?.valuationAmount) {
      return badRequest('beneficiaryName, entitlementType, and valuationAmount are required')
    }
    if (!VALID_TYPES.includes(body.entitlementType)) {
      return badRequest(`Invalid entitlementType. Must be one of: ${VALID_TYPES.join(', ')}`)
    }

    const payroll = await db.rnrAssetPayroll.findUnique({ where: { id }, include: { lines: true } })
    if (!payroll) return notFound('R&R payroll not found')

    const formulaSnapshot = JSON.stringify({
      calculator: `Rnr${body.entitlementType.charAt(0).toUpperCase()}${body.entitlementType.slice(1).replace(/_./g, (x) => x[1].toUpperCase())}`,
      rate: body.valuationAmount,
      unit: 'per_unit',
      qty: '1',
    })

    const line = await db.rnrAssetPayrollLine.create({
      data: {
        payrollId: id,
        beneficiaryName: body.beneficiaryName,
        entitlementType: body.entitlementType,
        valuationAmount: body.valuationAmount,
        pwdRateReference: body.pwdRateReference ?? null,
        formulaSnapshot,
      },
    })

    // Recompute total
    const allLines = await db.rnrAssetPayrollLine.findMany({ where: { payrollId: id } })
    const total = allLines.reduce((sum, l) => sum + Number(l.valuationAmount), 0)
    await db.rnrAssetPayroll.update({ where: { id }, data: { totalValue: total.toFixed(2) } })

    return ok({ id: line.id, beneficiaryName: line.beneficiaryName, entitlementType: line.entitlementType, valuationAmount: line.valuationAmount, pwdRateReference: line.pwdRateReference, formulaSnapshot: line.formulaSnapshot, createdAt: line.createdAt.toISOString() })
  } catch (e) {
    return serverError('Failed to add R&R line', e instanceof Error ? e.message : String(e))
  }
}