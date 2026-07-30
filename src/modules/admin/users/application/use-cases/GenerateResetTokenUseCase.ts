import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { Container } from '@/infrastructure/di/Container'

export class GenerateResetTokenUseCase implements IUseCase<{ email: string }, void> {
  async execute(req?: { email: string }): Promise<Result<void>> {
    if (!req?.email) return Fail('Email is required')
    
    const user = await db.user.findUnique({ where: { email: req.email } })
    if (!user) {
      // Return Ok to prevent email enumeration attacks
      return Ok(undefined)
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Create reset record
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 60)

    await db.auth_reset_token.create({
      data: {
        token_hash: tokenHash,
        user_id: user.id,
        expires_at: expiresAt,
        is_used: false,
      }
    })

    // Dispatch notification job
    // The notification service will handle sending the email.
    // Ensure you construct the reset URL properly depending on the environment.
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

    if (Container.jobDispatcher) {
      await Container.jobDispatcher.dispatch('dispatchNotification', {
        type: 'PASSWORD_RESET',
        userId: user.id,
        email: user.email,
        data: {
          resetUrl,
          name: user.name,
        }
      })
    } else {
      console.warn('JobDispatcherService not available to send reset email')
    }

    return Ok(undefined)
  }
}
