// POST /api/claims/[id]/approve-claim — Update overall ECL claim approval status in form_i_claim table
import { ok, badRequest, serverError } from '../../../_lib'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params

    if (!id) {
      return badRequest('Claim ID is required')
    }

    // Ensure columns exist in DB
    await db.$executeRawUnsafe(`
      ALTER TABLE public.form_i_claim 
      ADD COLUMN IF NOT EXISTS ecl_approval_status VARCHAR(50) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS ecl_approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS ecl_approved_by VARCHAR(64);
    `).catch(() => {})

    // Check all plots associated with this claim
    const plots = await db.form_i_claim_plot.findMany({
      where: { form_i_claim_id: id },
    })

    const unapprovedPlots = plots.filter((p) => p.title_approval_status !== 'APPROVED')
    if (unapprovedPlots.length > 0) {
      return badRequest(`Cannot approve claim: ${unapprovedPlots.length} plot(s) are not yet title-approved.`)
    }

    // Update form_i_claim overall status
    await db.$executeRawUnsafe(`
      UPDATE public.form_i_claim 
      SET 
        ecl_approval_status = 'APPROVED', 
        ecl_approved_at = NOW(),
        ecl_approved_by = 'ECL_LEGAL_LAWYER',
        state = 'APPROVED',
        updt_ts = NOW()
      WHERE id = $1;
    `, id)

    return ok({ success: true, claim_id: id, ecl_approval_status: 'APPROVED' })
  } catch (e) {
    return serverError('Failed to approve Form-I claim', e instanceof Error ? e.message : String(e))
  }
}
