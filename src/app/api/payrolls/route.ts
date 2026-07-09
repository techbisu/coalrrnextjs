// GET /api/payrolls — list all payrolls with lines
// POST /api/payrolls — create a new payroll (draft)
import { db } from '@/lib/db'
import { ok, badRequest, serverError, dec, iso, readJson } from '../_lib'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const payrolls = await db.compensationPayroll.findMany({
      include: { project: true, lines: true },
      orderBy: { createdAt: 'desc' },
    })
    // Polymorphic review tasks — fetch separately (no FK relation per spec §3.1)
    const allReviewTasks = await db.workflowReviewTask.findMany({
      where: { reviewableType: 'CompensationPayroll' },
      orderBy: { createdAt: 'asc' },
    })
    const tasksByPayroll = new Map<string, typeof allReviewTasks>()
    for (const t of allReviewTasks) {
      const arr = tasksByPayroll.get(t.reviewableId) ?? []
      arr.push(t)
      tasksByPayroll.set(t.reviewableId, arr)
    }
    return ok(payrolls.map((p) => ({
      id: p.id,
      payrollCode: p.payrollCode,
      projectId: p.projectId,
      projectName: p.project.name,
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
      })),
      reviewTasks: (tasksByPayroll.get(p.id) ?? []).map((r) => ({
        id: r.id,
        role: r.role,
        status: r.status,
        decidedBy: r.decidedBy,
        decidedAt: iso(r.decidedAt),
        comment: r.comment,
      })),
      createdAt: p.createdAt.toISOString(),
    })))
  } catch (e) {
    return serverError('Failed to load payrolls', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ projectId?: string; payrollCode?: string; multiplicationFactor?: string }>(req)
    if (!body?.projectId) return badRequest('projectId required')
    const project = await db.mstProject.findUnique({ where: { id: body.projectId } })
    if (!project) return badRequest('Project not found')

    const payroll = await db.compensationPayroll.create({
      data: {
        projectId: body.projectId,
        payrollCode: body.payrollCode ?? `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        multiplicationFactor: body.multiplicationFactor ?? '1.0000',
        state: 'Drafting',
        landownerCount: 0,
        totalAward: '0.00',
      },
    })
    return ok(payroll, { status: 201 })
  } catch (e) {
    return serverError('Failed to create payroll', e instanceof Error ? e.message : String(e))
  }
}
