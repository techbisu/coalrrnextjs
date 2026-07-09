// PATCH /api/schedules/[id]/checklist — update a CL-1 checklist item status
import { ProposalService } from '@/modules/land-acquisition/services/ProposalService'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, readJson } from '../../../_lib'
import type { NextRequest } from 'next/server'

const service = new ProposalService()
type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('proposal.edit')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await readJson<{ itemKey: string; status: 'pending' | 'in_progress' | 'complete' | 'skipped' }>(req)
    if (!body?.itemKey || !body.status) return badRequest('itemKey and status required')

    const result = await service.updateChecklistItem(id, body.itemKey, body.status)
    return ok(result)
  } catch (e) {
    return serverError('Failed to update checklist', e instanceof Error ? e.message : String(e))
  }
}
