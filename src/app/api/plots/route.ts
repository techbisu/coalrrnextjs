// GET /api/plots — list all plots
import { ok, serverError } from '../_lib'
import type { NextRequest } from 'next/server'
import { getPlotsUseCase } from '@/infrastructure/di/Container'
import { getCurrentUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return serverError('Unauthorized', 'UNAUTHORIZED')
    }
    const result = await getPlotsUseCase.execute({ userId: user.id, scope: user.scope })
    
    if (result.isFailure) {
      return serverError('Failed to load plots', result.error)
    }
    
    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load plots', e instanceof Error ? e.message : String(e))
  }
}
