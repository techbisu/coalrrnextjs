// GET /api/ledger — list Form-D ledger entries (immutable, hash-chained)
// POST /api/ledger — add a new ledger entry (computes hash chain; spec §3.2.4)
import { ok, badRequest, serverError, readJson } from '../_lib'
import type { NextRequest } from 'next/server'
import { listLedgerEntriesUseCase, appendLedgerEntryUseCase } from '@/infrastructure/di/Container'

export async function GET() {
  try {
    const result = await listLedgerEntriesUseCase.execute()
    
    if (result.isFailure) {
      return serverError('Failed to load ledger', String(result.error))
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load ledger', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      project_id?: string
      plot_id?: string
      amount_land?: string
      amount_rnr?: string
      payee_name?: string
      rtgs_utr_reference?: string
    }>(req)

    if (!body) {
      return badRequest('Invalid request body')
    }

    const result = await appendLedgerEntryUseCase.execute(body)

    if (result.isFailure) {
      return badRequest(String(result.error))
    }

    return ok(result.value, { status: 201 })
  } catch (e) {
    return serverError('Failed to append ledger entry', e instanceof Error ? e.message : String(e))
  }
}
