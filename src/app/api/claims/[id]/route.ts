// PATCH /api/claims/[id] — update a draft claim's wizard step state (spec §1.2.2)
// PUT /api/claims/[id] — full update for inline claim editing
import { ok, badRequest, notFound, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'
import { updateDraftClaimUseCase } from '@/infrastructure/di/Container'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await readJson<any>(req)

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

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await readJson<any>(req)

    const result = await updateDraftClaimUseCase.execute({ id, body: body || {} })

    if (!result.isSuccess) {
      const errMsg = String(result.error)
      if (errMsg === 'Claim not found') return notFound(errMsg)
      return badRequest(errMsg)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to update claim', e instanceof Error ? e.message : String(e))
  }
}
