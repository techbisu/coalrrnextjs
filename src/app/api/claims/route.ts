// GET /api/claims — list Form-I claims
// POST /api/claims — submit a new Form-I claim (wizard final submit; spec §1.2.2 Journey B)
import { ok, badRequest, serverError, readJson } from '../_lib'
import type { NextRequest } from 'next/server'
import { getClaimsUseCase, submitClaimUseCase } from '@/infrastructure/di/Container'

export async function GET() {
  try {
    const result = await getClaimsUseCase.execute()
    
    if (!result.isSuccess) {
      return serverError('Failed to load claims', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load claims', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      aadhaarNumber?: string
      claimant_name?: string
      plot_id?: string
      own_share_acres?: string
      opted_monetary_in_lieu_of_employment?: boolean
      bank_account_number?: string
      bank_ifsc?: string
    }>(req)

    const result = await submitClaimUseCase.execute(body || {})

    if (!result.isSuccess) {
      return badRequest(String(result.error))
    }

    return ok(result.value, { status: 201 })
  } catch (e) {
    return serverError('Failed to submit claim', e instanceof Error ? e.message : String(e))
  }
}
