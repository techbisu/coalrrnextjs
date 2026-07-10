// GET /api/paf — List PAF census records with optional filters
// POST /api/paf — Create a new PAF record
import { ok, badRequest, serverError, readJson } from '../_lib'
import type { NextRequest } from 'next/server'
import { listPafRecordsUseCase, createPafRecordUseCase } from '@/infrastructure/di/Container'
import { ListPafRecordsUseCase } from '@/application/use-cases/paf/ListPafRecordsUseCase'
import { CreatePafRecordUseCase } from '@/application/use-cases/paf/CreatePafRecordUseCase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category_of_entitlement = searchParams.get('category_of_entitlement') ?? undefined
    const sc_st_obc_category = searchParams.get('sc_st_obc_category') ?? undefined

    const useCase = listPafRecordsUseCase
    const result = await useCase.execute({ category_of_entitlement, sc_st_obc_category })

    if (result.isFailure) {
      return serverError('Failed to load PAF records', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load PAF records', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      claimant_name?: string
      category_of_entitlement?: string
      sc_st_obc_category?: string
      plot_id?: string
    }>(req)
    
    if (!body?.claimant_name || !body?.category_of_entitlement) {
      return badRequest('claimant_name and category_of_entitlement are required')
    }

    const useCase = createPafRecordUseCase
    const result = await useCase.execute(body)

    if (result.isFailure) {
      return serverError('Failed to create PAF record', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to create PAF record', e instanceof Error ? e.message : String(e))
  }
}
