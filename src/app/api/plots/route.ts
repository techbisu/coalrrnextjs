// GET /api/plots — list all plots
import { db } from '@/lib/db'
import { ok, serverError, dec } from '../_lib'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    const plots = await db.mstPlot.findMany({
      include: { mouza: true, formIClaims: true },
      orderBy: [{ mouza: { name: 'asc' } }, { plotNumber: 'asc' }],
    })
    return ok(plots.map((p) => ({
      id: p.id,
      plotNumber: p.plotNumber,
      khataNumber: p.khataNumber,
      mouza: p.mouza.name,
      district: p.mouza.district,
      state: p.mouza.state,
      landType: p.landType,
      areaAcres: dec(p.areaAcres),
      exhaustedAreaForJobs: dec(p.exhaustedAreaForJobs),
      remainingJobQuota: p.remainingJobQuota,
      claimCount: p.formIClaims.length,
    })))
  } catch (e) {
    return serverError('Failed to load plots', e instanceof Error ? e.message : String(e))
  }
}
