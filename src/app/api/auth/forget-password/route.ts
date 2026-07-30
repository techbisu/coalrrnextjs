import { NextRequest } from 'next/server'
import { ok, badRequest, serverError, readJson } from '../../_lib'
import { GenerateResetTokenUseCase } from '@/modules/admin/users/application/use-cases/GenerateResetTokenUseCase'

// Note: Rate limiting would ideally be placed in middleware or an API gateway.
// In a full production setup, a Redis-based rate limiter should be called here.

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ email?: string }>(req)
    if (!body?.email) {
      return badRequest('Email is required')
    }

    const useCase = new GenerateResetTokenUseCase()
    const result = await useCase.execute({ email: body.email })

    if (!result.isSuccess) {
      return badRequest(result.error || 'Failed to process request')
    }

    return ok({ message: 'If the email is registered, a password reset link has been sent.' })
  } catch (error) {
    console.error('Forget Password Error:', error)
    return serverError('Failed to process request', error instanceof Error ? error.message : String(error))
  }
}
