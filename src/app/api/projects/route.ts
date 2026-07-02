// GET  /api/projects — list projects with GIS boundary + plots
// POST /api/projects — create a new project (draft baseline)
import { db } from '@/lib/db'
import { ok, badRequest, serverError, dec, iso, readJson } from '../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    const projects = await db.mstProject.findMany({
      include: {
        landSchedules: { include: { items: { include: { plot: { include: { mouza: true } } } } } },
        payrolls: true,
        ledgerEntries: true,
      },
    })

    // Fetch all plots (project-scoped via land_schedules)
    const allPlots = await db.mstPlot.findMany({ include: { mouza: true } })

    return ok(projects.map((p) => {
      const totalAcquired = p.ledgerEntries.reduce((s, e) => s + Number(e.amountLand) + Number(e.amountRnr), 0)
      return {
        id: p.id,
        name: p.name,
        collieryCode: p.collieryCode,
        totalLandLimitAcres: dec(p.totalLandLimitAcres),
        totalBudgetCeiling: dec(p.totalBudgetCeiling),
        totalEmploymentQuota: p.totalEmploymentQuota,
        boundary: p.boundary,
        statutoryClearances: p.statutoryClearances,
        lockedAt: iso(p.lockedAt),
        isLocked: p.lockedAt !== null,
        payrollCount: p.payrolls.length,
        totalDisbursed: totalAcquired.toFixed(2),
        budgetUtilization: Number(p.totalBudgetCeiling) > 0
          ? ((totalAcquired / Number(p.totalBudgetCeiling)) * 100).toFixed(1)
          : '0',
        plots: allPlots.map((pl) => ({
          id: pl.id,
          plotNumber: pl.plotNumber,
          mouza: pl.mouza.name,
          landType: pl.landType,
          areaAcres: dec(pl.areaAcres),
          exhaustedAreaForJobs: dec(pl.exhaustedAreaForJobs),
          remainingJobQuota: pl.remainingJobQuota,
        })),
      }
    }))
  } catch (e) {
    return serverError('Failed to load projects', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers can create projects')
    const body = await readJson<{ name?: string; collieryCode?: string; totalLandLimitAcres?: string; totalBudgetCeiling?: string; totalEmploymentQuota?: number; boundary?: string; statutoryClearances?: string }>(req)
    if (!body?.name || !body.collieryCode || !body.totalLandLimitAcres || !body.totalBudgetCeiling) return badRequest('name, collieryCode, totalLandLimitAcres, totalBudgetCeiling required')
    if (Number(body.totalLandLimitAcres) <= 0) return badRequest('Land limit must be > 0')
    if (Number(body.totalBudgetCeiling) <= 0) return badRequest('Budget ceiling must be > 0')
    const project = await db.mstProject.create({
      data: {
        name: body.name, collieryCode: body.collieryCode,
        totalLandLimitAcres: body.totalLandLimitAcres, totalBudgetCeiling: body.totalBudgetCeiling,
        totalEmploymentQuota: body.totalEmploymentQuota ?? 0,
        boundary: body.boundary ?? JSON.stringify({ type: 'MultiPolygon', coordinates: [], color: '#16a34a' }),
        statutoryClearances: body.statutoryClearances ?? null, lockedAt: null,
      },
    })
    return ok({ id: project.id, name: project.name, collieryCode: project.collieryCode, isLocked: false, message: `Project "${project.name}" created as draft.` }, { status: 201 })
  } catch (e) {
    return serverError('Failed to create project', e instanceof Error ? e.message : String(e))
  }
}
