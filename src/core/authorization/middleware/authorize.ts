import { authService } from '@/infrastructure/di/Container'
import { getCurrentUser } from '@/lib/auth'
import { unauthorized, forbidden } from '@/app/api/_lib'

/**
 * Route protection middleware for API route handlers and Server Actions.
 * Throws an error or returns a Next.js response.
 */
export async function authorize(permission: string, providedUserId?: string) {
  const user_id = providedUserId || (await getCurrentUser())?.id
  if (!user_id) {
    throw new Error('Unauthorized')
  }

  const hasAccess = await authService.can(user_id, permission)
  if (!hasAccess) {
    throw new Error(`Forbidden: requires permission ${permission}`)
  }
}

/**
 * API-friendly version that returns a Next.js Response if unauthorized,
 * or returns the user if authorized.
 */
export async function authorizeApi(permission: string) {
  const user = await getCurrentUser()
  if (!user) return { error: unauthorized() }

  const hasAccess = await authService.can(user.id, permission)
  if (!hasAccess) return { error: forbidden() }

  return { user }
}
