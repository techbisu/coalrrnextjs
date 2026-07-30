import { NextRequest } from 'next/server'
import { ok, badRequest, serverError, readJson } from '../../_lib'
import { ResetPasswordUseCase } from '@/modules/admin/users/application/use-cases/ResetPasswordUseCase'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ token?: string; newPassword?: string }>(req)
    if (!body?.token || !body?.newPassword) {
      return badRequest('Token and new password are required')
    }

    const useCase = new ResetPasswordUseCase()
    const result = await useCase.execute({ token: body.token, newPassword: body.newPassword })

    if (!result.isSuccess) {
      return badRequest(result.error || 'Failed to reset password')
    }

    return ok({ message: 'Password has been successfully reset. You can now login.' })
  } catch (error) {
    console.error('Reset Password Error:', error)
    return serverError('Failed to reset password', error instanceof Error ? error.message : String(error))
  }
}
