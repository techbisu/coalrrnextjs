// GET /api/employment — list employment applications + nominee pool threshold status
import { db } from '@/lib/db'
import { ok, serverError, dec } from '../_lib'
import { NomineePoolThresholdCalculator, AcreageValue, EMPLOYMENT_GATE_ACRES } from '@/lib/engines'
import type { NextRequest } from 'next/server'

const thresholdCalc = new NomineePoolThresholdCalculator()

export async function GET(_req: NextRequest) {
  try {
    const apps = await db.employmentApplication.findMany({
      include: {
        nomineePool: { include: { contributions: { include: { formIClaim: { include: { plot: true } } } } } },
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = apps.map((a) => {
      // Recompute threshold live for display (the persisted formIxBalanceAcres is the frozen snapshot)
      const shares = a.nomineePool.contributions.map((c) => c.shareAcres.toString())
      const liveThreshold = thresholdCalc.calculate(shares)
      return {
        id: a.id,
        applicationCode: a.applicationCode,
        projectName: a.project.name,
        nomineeName: a.nomineePool.nomineeName,
        state: a.state,
        // Frozen-at-approval snapshot (spec §3.1.1 — "NOT live-recomputed after lock")
        formIxBalanceAcres: dec(a.formIxBalanceAcres),
        formXBalanceJobs: a.formXBalanceJobs,
        // Live threshold status (recomputed for UI)
        livePooledAcreage: liveThreshold.pooledAcreage.format(),
        threshold: EMPLOYMENT_GATE_ACRES.toString(),
        hasCrossedThreshold: liveThreshold.hasCrossedThreshold,
        remainingToThreshold: liveThreshold.remainingToThreshold.format(),
        applyButtonUnlocked: a.nomineePool.applyButtonUnlocked,
        exceptionFlags: a.exceptionFlags,
        contributionCount: a.nomineePool.contributions.length,
        contributions: a.nomineePool.contributions.map((c) => ({
          shareAcres: dec(c.shareAcres),
          claimantName: c.formIClaim.claimantName,
          plotNumber: c.formIClaim.plot.plotNumber,
        })),
      }
    })

    return ok(result)
  } catch (e) {
    return serverError('Failed to load employment applications', e instanceof Error ? e.message : String(e))
  }
}
