// PATCH /api/claims/[id] — update a draft claim's wizard step state (spec §1.2.2)
// Used for per-step saves so a dropped 3G connection loses nothing.
import { ok, badRequest, notFound, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'
import { updateDraftClaimUseCase } from '@/infrastructure/di/Container'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await readJson<{
      claimant_name?: string
      own_share_acres?: string
      opted_monetary_in_lieu_of_employment?: boolean
      bank_account_number?: string
      bank_ifsc?: string
    }>(req)

    const result = await updateDraftClaimUseCase.execute({ id, body: body || {} })

    if (!result.isSuccess) {
      const errMsg = String(result.error)
      if (errMsg === 'Claim not found') return notFound(errMsg)
      return badRequest(errMsg)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to save claim step', e instanceof Error ? e.message : String(e))
  }
}
