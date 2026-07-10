import { ok, notFound, serverError } from '../../_lib'
import type { NextRequest } from 'next/server'
import { getNomineePoolDetailUseCase } from '@/infrastructure/di/Container'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await getNomineePoolDetailUseCase.execute({ id })

    if (!result.isSuccess) {
      const errMsg = String(result.error)
      if (errMsg === 'Nominee pool not found') return notFound(errMsg)
      return serverError('Failed to load pool detail', errMsg)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load pool detail', e instanceof Error ? e.message : String(e))
  }
}
