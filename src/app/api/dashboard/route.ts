// GET /api/dashboard — aggregate KPI data for the main dashboard
import { ok, serverError } from '../_lib'
import type { NextRequest } from 'next/server'
import * as Container from '@/infrastructure/di/Container'

export async function GET(_req: NextRequest) {
  try {
    const result = await Container.getSystemDashboardUseCase.execute()
    
    if (result.isFailure) {
      return serverError('Failed to load dashboard', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load dashboard', e instanceof Error ? e.message : String(e))
  }
}
