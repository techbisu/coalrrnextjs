// DELETE /api/payrolls/[id]/lines/[lineId] — remove a payroll line (only in Drafting)
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError } from '../../../_lib'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string; lineId: string }> }

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id, lineId } = await ctx.params
    const payroll = await db.compensationPayroll.findUnique({ where: { id } })
    if (!payroll) return notFound('Payroll not found')
    if (payroll.state !== 'Drafting') return badRequest(`Cannot delete line from payroll in state ${payroll.state}`)

    await db.compensationPayrollLine.delete({ where: { id: lineId } })

    const remaining = await db.compensationPayrollLine.findMany({ where: { payrollId: id } })
    const batchTotal = remaining.reduce((s, l) => s + Number(l.totalAward), 0)
    await db.compensationPayroll.update({
      where: { id },
      data: { landownerCount: remaining.length, totalAward: batchTotal.toFixed(2) },
    })

    return ok({ deleted: true, lineCount: remaining.length, batchTotal: batchTotal.toFixed(2) })
  } catch (e) {
    return serverError('Failed to delete line', e instanceof Error ? e.message : String(e))
  }
}
