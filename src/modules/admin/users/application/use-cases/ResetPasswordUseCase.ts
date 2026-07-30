import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { db } from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

export class ResetPasswordUseCase implements IUseCase<{ token: string; newPassword: string }, void> {
  async execute(req?: { token: string; newPassword: string }): Promise<Result<void>> {
    if (!req?.token || !req?.newPassword) return Fail('Token and new password are required')
    if (req.newPassword.length < 8) return Fail('Password must be at least 8 characters long')
    
    const tokenHash = crypto.createHash('sha256').update(req.token).digest('hex')

    const resetRecord = await db.auth_reset_token.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true }
    })

    if (!resetRecord) return Fail('Invalid or expired reset token')
    if (resetRecord.is_used) return Fail('Reset token has already been used')
    if (resetRecord.expires_at < new Date()) return Fail('Reset token has expired')

    const newPasswordHash = await bcrypt.hash(req.newPassword, 12)

    await db.$transaction([
      db.user.update({
        where: { id: resetRecord.user_id },
        data: { password_hash: newPasswordHash },
      }),
      db.auth_reset_token.update({
        where: { token_hash: tokenHash },
        data: { is_used: true },
      }),
      // Invalidate all existing sessions for this user
      db.auth_session.deleteMany({
        where: { user_id: resetRecord.user_id },
      })
    ])

    return Ok(undefined)
  }
}
