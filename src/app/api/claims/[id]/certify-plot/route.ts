// POST /api/claims/[id]/certify-plot — Update Title Certification status & Legal Searching Certificate for plot(s)
import { ok, badRequest, serverError, readJson } from '../../../_lib'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await readJson<any>(req)

    const { plot_ids, plot_id, title_approval_status, legal_searching_doc_id, scrutiny_remarks } = body || {}

    const targetPlotIds: string[] = Array.isArray(plot_ids) && plot_ids.length > 0
      ? plot_ids
      : plot_id
      ? [plot_id]
      : []

    if (targetPlotIds.length === 0) {
      return badRequest('At least one plot ID or plot_ids array is required')
    }

    if (!title_approval_status) {
      return badRequest('title_approval_status (APPROVED | MODIFY_REQUIRED | REJECTED) is required')
    }

    // Update form_i_claim_plot entries
    await db.form_i_claim_plot.updateMany({
      where: {
        form_i_claim_id: id,
        id: { in: targetPlotIds },
      },
      data: {
        title_approval_status,
        ...(legal_searching_doc_id ? { legal_searching_doc_id } : {}),
        ...(scrutiny_remarks !== undefined ? { scrutiny_remarks } : {}),
        updt_ts: new Date(),
      },
    })

    return ok({ success: true, count: targetPlotIds.length })
  } catch (e) {
    return serverError('Failed to update plot certification', e instanceof Error ? e.message : String(e))
  }
}
