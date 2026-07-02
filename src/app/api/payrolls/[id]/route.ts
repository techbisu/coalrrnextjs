// GET  /api/payrolls/[id] — fetch one payroll with lines + review tasks
// PATCH /api/payrolls/[id] — add a payroll line (with Math Engine calculation) or update factor
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, dec, iso, readJson } from '../../_lib'
import {
  CompensationInput, MoneyValue, LandCompensationEngine,
} from '@/lib/engines'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const p = await db.compensationPayroll.findUnique({
      where: { id },
      include: {
        project: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!p) return notFound('Payroll not found')
    // Polymorphic review tasks — fetched separately (no FK relation per spec §3.1)
    const reviewTasks = await db.workflowReviewTask.findMany({
      where: { reviewableType: 'CompensationPayroll', reviewableId: id },
      orderBy: { createdAt: 'asc' },
    })

    return ok({
      id: p.id,
      payrollCode: p.payrollCode,
      projectId: p.projectId,
      projectName: p.project.name,
      projectBudgetCeiling: dec(p.project.totalBudgetCeiling),
      multiplicationFactor: dec(p.multiplicationFactor),
      state: p.state,
      landownerCount: p.landownerCount,
      totalAward: dec(p.totalAward),
      lines: p.lines.map((l) => ({
        id: l.id,
        landownerName: l.landownerName,
        plotReference: l.plotReference,
        landValue: dec(l.landValue),
        assetValue: dec(l.assetValue),
        solatiumAmount: dec(l.solatiumAmount),
        escalationAmount: dec(l.escalationAmount),
        totalAward: dec(l.totalAward),
        yearsSinceNotification: l.yearsSinceNotification,
        formulaSnapshot: l.formulaSnapshot,
        createdAt: l.createdAt.toISOString(),
      })),
      reviewTasks: reviewTasks.map((r) => ({
        id: r.id,
        role: r.role,
        status: r.status,
        decidedBy: r.decidedBy,
        decidedAt: iso(r.decidedAt),
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      createdAt: p.createdAt.toISOString(),
    })
  } catch (e) {
    return serverError('Failed to load payroll', e instanceof Error ? e.message : String(e))
  }
}

// Add a line — runs the Math Engine server-side (per spec §1.3.3 authoritative layer)
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await readJson<{
      action: 'add_line' | 'update_factor'
      landownerName?: string
      plotReference?: string
      landValue?: string
      assetValue?: string
      yearsSinceNotification?: number
      multiplicationFactor?: string
    }>(req)
    if (!body) return badRequest('Invalid body')

    const payroll = await db.compensationPayroll.findUnique({ where: { id }, include: { project: true } })
    if (!payroll) return notFound('Payroll not found')
    if (payroll.state !== 'Drafting') return badRequest(`Cannot modify payroll in state ${payroll.state}`)

    if (body.action === 'update_factor') {
      if (!body.multiplicationFactor) return badRequest('multiplicationFactor required')
      const updated = await db.compensationPayroll.update({
        where: { id },
        data: { multiplicationFactor: body.multiplicationFactor },
      })
      return ok({ multiplicationFactor: dec(updated.multiplicationFactor) })
    }

    if (body.action === 'add_line') {
      if (!body.landownerName || !body.landValue || !body.assetValue) {
        return badRequest('landownerName, landValue, assetValue required')
      }

      // Run Math Engine — authoritative calculation (per spec §1.3.3 / §2.1)
      const input = new CompensationInput({
        landValue: MoneyValue.from(body.landValue),
        assetValue: MoneyValue.from(body.assetValue),
        yearsSinceNotification: body.yearsSinceNotification ?? 0,
        multiplicationFactor: payroll.multiplicationFactor.toString(),
      })
      const result = new LandCompensationEngine().calculate(input)

      // Baseline guard (spec §1.3.3 WithinProjectBaseline)
      const totalStr = result.total.format().replace(/[^0-9.-]/g, '')
      const newTotal = Number(payroll.totalAward) + Number(totalStr)
      const ceiling = Number(payroll.project.totalBudgetCeiling)
      if (newTotal > ceiling) {
        return badRequest(
          `Baseline breach: payroll total ₹${newTotal.toFixed(2)} would exceed project ceiling ₹${ceiling.toFixed(2)}. Escalate to Board.`,
        )
      }

      const line = await db.compensationPayrollLine.create({
        data: {
          payrollId: id,
          landownerName: body.landownerName,
          plotReference: body.plotReference ?? '',
          landValue: body.landValue,
          assetValue: body.assetValue,
          solatiumAmount: result.solatium.amount.format(),
          escalationAmount: result.escalation.amount.format(),
          totalAward: result.total.format(),
          yearsSinceNotification: body.yearsSinceNotification ?? 0,
          formulaSnapshot: JSON.stringify({
            calculator: 'LandCompensationEngine',
            version: '1.0',
            inputs: {
              landValue: body.landValue,
              assetValue: body.assetValue,
              yearsSinceNotification: body.yearsSinceNotification ?? 0,
              multiplicationFactor: payroll.multiplicationFactor.toString(),
            },
            breakdown: {
              base: input.landValue.add(input.assetValue).format(),
              solatium: result.solatium.amount.format(),
              escalation: result.escalation.amount.format(),
            },
            output: result.total.format(),
          }),
        },
      })

      // Recompute batch totals
      const allLines = await db.compensationPayrollLine.findMany({ where: { payrollId: id } })
      const batchTotal = allLines.reduce((s, l) => s + Number(l.totalAward), 0)
      await db.compensationPayroll.update({
        where: { id },
        data: { landownerCount: allLines.length, totalAward: batchTotal.toFixed(2) },
      })

      return ok({
        line: {
          id: line.id,
          landownerName: line.landownerName,
          plotReference: line.plotReference,
          landValue: dec(line.landValue),
          assetValue: dec(line.assetValue),
          solatiumAmount: dec(line.solatiumAmount),
          escalationAmount: dec(line.escalationAmount),
          totalAward: dec(line.totalAward),
          yearsSinceNotification: line.yearsSinceNotification,
          formulaSnapshot: line.formulaSnapshot,
        },
        batchTotal: batchTotal.toFixed(2),
        lineCount: allLines.length,
      }, { status: 201 })
    }

    return badRequest('Unknown action')
  } catch (e) {
    return serverError('Failed to update payroll', e instanceof Error ? e.message : String(e))
  }
}
