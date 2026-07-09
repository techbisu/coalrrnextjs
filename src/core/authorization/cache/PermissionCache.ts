import { CachedPermissions } from '../types'

/**
 * In-memory cache for user permissions and roles.
 * Designed to be swappable with Redis in the future.
 */
class PermissionCacheService {
  private cache = new Map<string, { data: CachedPermissions; expiresAt: number }>()
  private TTL_MS = 15 * 60 * 1000 // 15 minutes

  async get(userId: string): Promise<CachedPermissions | null> {
    const entry = this.cache.get(userId)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId)
      return null
    }

    return entry.data
  }

  async set(userId: string, data: CachedPermissions): Promise<void> {
    this.cache.set(userId, {
      data,
      expiresAt: Date.now() + this.TTL_MS,
    })
  }

  async invalidate(userId: string): Promise<void> {
    this.cache.delete(userId)
  }

  async invalidateAll(): Promise<void> {
    this.cache.clear()
  }
}

export const PermissionCache = new PermissionCacheService()
