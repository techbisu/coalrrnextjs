// GET /api/employment — list employment applications + nominee pool threshold status
import { db } from '@/lib/db'
import { ok, serverError, dec } from '../_lib'
import { NomineePoolThresholdCalculator, AcreageValue, EMPLOYMENT_GATE_ACRES } from '@/lib/engines'
import type { NextRequest } from 'next/server'

const thresholdCalc = new NomineePoolThresholdCalculator()

export async function GET(_req: NextRequest) {
  try {
    const apps = await db.employment_application.findMany({
      include: {
        nominee_pool: { include: { contributions: { include: { form_i_claim: { include: { mst_plot: true } } } } } },
        mst_project: true,
      },
      orderBy: { entry_ts: 'desc' },
    })

    const result = apps.map((a) => {
      // Recompute threshold live for display (the persisted form_ix_balance_acres is the frozen snapshot)
      const shares = a.nominee_pool.contributions.map((c) => c.share_acres.toString())
      const liveThreshold = thresholdCalc.calculate(shares)
      return {
        id: a.id,
        application_code: a.application_code,
        projectName: a.mst_project.name,
        nominee_name: a.nominee_pool.nominee_name,
        state: a.state,
        // Frozen-at-approval snapshot (spec §3.1.1 — "NOT live-recomputed after lock")
        form_ix_balance_acres: dec(a.form_ix_balance_acres),
        form_x_balance_jobs: a.form_x_balance_jobs,
        // Live threshold status (recomputed for UI)
        livePooledAcreage: liveThreshold.pooled_acreage.format(),
        threshold: EMPLOYMENT_GATE_ACRES.toString(),
        hasCrossedThreshold: liveThreshold.hasCrossedThreshold,
        remainingToThreshold: liveThreshold.remainingToThreshold.format(),
        apply_button_unlocked: a.nominee_pool.apply_button_unlocked,
        exception_flags: a.exception_flags,
        contributionCount: a.nominee_pool.contributions.length,
        contributions: a.nominee_pool.contributions.map((c) => ({
          share_acres: dec(c.share_acres),
          claimant_name: c.form_i_claim.claimant_name,
          plot_number: c.form_i_claim.mst_plot.plot_number,
        })),
      }
    })

    return ok(result)
  } catch (e) {
    return serverError('Failed to load employment applications', e instanceof Error ? e.message : String(e))
  }
}
