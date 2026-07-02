// PATCH /api/claims/[id] — update a draft claim's wizard step state (spec §1.2.2)
// Used for per-step saves so a dropped 3G connection loses nothing.
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await readJson<{
      claimantName?: string
      ownShareAcres?: string
      optedMonetaryInLieuOfEmployment?: boolean
      bankAccountNumber?: string
      bankIfsc?: string
    }>(req)
    if (!body) return badRequest('Invalid body')

    const claim = await db.formIClaim.findUnique({ where: { id } })
    if (!claim) return notFound('Claim not found')
    if (claim.state !== 'Drafting') return badRequest(`Cannot edit claim in state ${claim.state}`)

    const updated = await db.formIClaim.update({
      where: { id },
      data: {
        ...(body.claimantName !== undefined && { claimantName: body.claimantName }),
        ...(body.ownShareAcres !== undefined && { ownShareAcres: body.ownShareAcres }),
        ...(body.optedMonetaryInLieuOfEmployment !== undefined && { optedMonetaryInLieuOfEmployment: body.optedMonetaryInLieuOfEmployment }),
        ...(body.bankAccountNumber !== undefined && { bankAccountNumber: body.bankAccountNumber }),
        ...(body.bankIfsc !== undefined && { bankIfsc: body.bankIfsc }),
      },
    })
    return ok({ id: updated.id, savedAt: new Date().toISOString() })
  } catch (e) {
    return serverError('Failed to save claim step', e instanceof Error ? e.message : String(e))
  }
}
