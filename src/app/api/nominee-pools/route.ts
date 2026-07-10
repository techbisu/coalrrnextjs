import { ok, serverError } from '../_lib'
import { getNomineePoolsUseCase } from '@/infrastructure/di/Container'

export async function GET() {
  try {
    const result = await getNomineePoolsUseCase.execute()
    
    if (!result.isSuccess) {
      return serverError('Failed to load nominee pools', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load nominee pools', e instanceof Error ? e.message : String(e))
  }
}
