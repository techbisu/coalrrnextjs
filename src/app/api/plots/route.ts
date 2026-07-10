// GET /api/plots — list all plots
import { ok, serverError } from '../_lib'
import type { NextRequest } from 'next/server'
import { getPlotsUseCase } from '@/infrastructure/di/Container'

export async function GET(_req: NextRequest) {
  try {
    const result = await getPlotsUseCase.execute()
    
    if (result.isFailure) {
      return serverError('Failed to load plots', result.error)
    }
    
    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load plots', e instanceof Error ? e.message : String(e))
  }
}
