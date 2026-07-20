import { CachedPermissions } from '../types'

/**
 * In-memory cache for user permissions and roles.
 * Designed to be swappable with Redis in the future.
 */
class PermissionCacheService {
  private cache = new Map<string, { data: CachedPermissions; expires_at: number }>()
  private TTL_MS = 15 * 60 * 1000 // 15 minutes

  async get(user_id: string): Promise<CachedPermissions | null> {
    const entry = this.cache.get(user_id)
    if (!entry) return null

    if (Date.now() > entry.expires_at) {
      this.cache.delete(user_id)
      return null
    }

    return entry.data
  }

  async set(user_id: string, data: CachedPermissions): Promise<void> {
    this.cache.set(user_id, {
      data,
      expires_at: Date.now() + this.TTL_MS,
    })
  }

  async invalidate(user_id: string): Promise<void> {
    this.cache.delete(user_id)
  }

  async invalidateAll(): Promise<void> {
    this.cache.clear()
  }
}

export const PermissionCache = new PermissionCacheService()

// trigger hot reload again 2
