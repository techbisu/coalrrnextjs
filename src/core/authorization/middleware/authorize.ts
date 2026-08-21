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
export async function authorizeApi(permission: string | string[]) {
  const user = await getCurrentUser()
  if (!user) {
    console.log(`[authorizeApi] Failed: No user found`);
    return { error: unauthorized() }
  }

  const perms = Array.isArray(permission) ? permission : [permission]
  const hasAccess = await authService.canAny(user.id, perms)
  console.log(`[authorizeApi] User: ${user.email}, Checking Permissions: ${perms.join(', ')}, HasAccess: ${hasAccess}`);
  if (!hasAccess) {
    console.log(`[authorizeApi] Permissions array:`, user.permissions);
    console.log(`[authorizeApi] Roles array:`, user.roles);
    return { error: forbidden() }
  }

  return { user }
}

/**
 * Module-aware API authorization that dynamically resolves required permissions
 * from module code and action (e.g. 'view', 'edit', 'sign', 'transition').
 */
export async function authorizeModuleApi(moduleCode: string, action: string = 'view') {
  const user = await getCurrentUser()
  if (!user) {
    return { error: unauthorized() }
  }

  // Super admin override
  if (
    user.permissions?.includes('*') ||
    user.roles?.some(r => {
      const rl = r.toLowerCase().replace(/[^a-z0-9]/g, '')
      return rl.includes('admin') || rl.includes('super')
    })
  ) {
    return { user }
  }

  const { PermissionResolver } = await import('@/core/authorization/services/PermissionResolver')
  const hasAccess = PermissionResolver.hasPermission(user, moduleCode, action)

  if (!hasAccess) {
    return { error: forbidden() }
  }

  return { user }
}
