/**
 * ConfigCacheService — Two-tiered (L1 Process Memory + L2 Redis) Caching Layer
 * for low-churn, high-read database configuration tables:
 * - master.checklist_requirement_rule
 * - public.workflow_transitions
 * - public.workflow_states
 * - public.sys_config
 *
 * Prevents redundant DB queries on every HTTP request and checklist render.
 * Client-safe: Imports DB only when running on server side ('server-only').
 */
import 'server-only'
import { db } from '@/lib/db'
import Redis from 'ioredis'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export class ConfigCacheService {
  private static l1Cache = new Map<string, CacheEntry<any>>()
  private static redisClient: Redis | null = null
  private static readonly TTL_MS = 300_000 // 5 Minutes TTL

  /**
   * Safe getter for Redis client in production environment
   */
  private static getRedis(): Redis | null {
    if (process.env.NODE_ENV === 'production' && !this.redisClient && process.env.REDIS_URL) {
      try {
        this.redisClient = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 2,
          enableOfflineQueue: false,
        })
      } catch (err) {
        console.warn('[ConfigCacheService] Redis initialization failed, falling back to L1 cache:', err)
      }
    }
    return this.redisClient
  }

  /**
   * Retrieve cached checklist requirement rules by module code
   */
  static async getChecklistRules(moduleCode: string) {
    const cacheKey = `config:checklist_rules:${moduleCode}`
    return this.fetchWithCache(cacheKey, async () => {
      return (db as any).checklist_requirement_rule.findMany({
        where: { module_code: moduleCode, is_active: true },
        orderBy: { display_order: 'asc' },
      })
    })
  }

  /**
   * Retrieve cached workflow transitions by workflow code
   */
  static async getWorkflowTransitions(workflowCode: string) {
    const cacheKey = `config:workflow_transitions:${workflowCode}`
    return this.fetchWithCache(cacheKey, async () => {
      let rows = await (db as any).workflow_transitions.findMany({
        where: { workflow_code: workflowCode, is_active: true },
        orderBy: { sort_order: 'asc' },
      })

      // Mode fallback: if mode-specific code returns no rows, fall back to base
      if (rows.length === 0 && workflowCode.includes('_')) {
        const baseCode = workflowCode.substring(0, workflowCode.indexOf('_'))
        rows = await (db as any).workflow_transitions.findMany({
          where: { workflow_code: baseCode, is_active: true },
          orderBy: { sort_order: 'asc' },
        })
      }

      return rows
    })
  }

  /**
   * Retrieve cached workflow states by workflow code.
   * Returns ordered state metadata (label, color, icon, step_order, is_terminal).
   */
  static async getWorkflowStates(workflowCode: string) {
    const cacheKey = `config:workflow_states:${workflowCode}`
    return this.fetchWithCache(cacheKey, async () => {
      let rows = await (db as any).workflow_states.findMany({
        where: { workflow_code: workflowCode, is_active: true },
        orderBy: { step_order: 'asc' },
      })

      // Fallback: if mode-specific code returns no rows, try base code
      if (rows.length === 0 && workflowCode.includes('_')) {
        const baseCode = workflowCode.substring(0, workflowCode.indexOf('_'))
        rows = await (db as any).workflow_states.findMany({
          where: { workflow_code: baseCode, is_active: true },
          orderBy: { step_order: 'asc' },
        })
      }

      return rows
    })
  }


  /**
   * Generic Multi-Tiered Fetch (L1 Memory -> L2 Redis -> DB Fallback)
   */
  private static async fetchWithCache<T>(key: string, dbFallback: () => Promise<T>): Promise<T> {
    const now = Date.now()
    
    // Check L1 In-Memory Cache
    const l1 = this.l1Cache.get(key)
    if (l1 && now < l1.expiresAt) {
      return l1.data as T
    }

    // Check L2 Redis Cache (if production & connected)
    const redis = this.getRedis()
    if (redis) {
      try {
        const cached = await redis.get(key)
        if (cached) {
          const parsed = JSON.parse(cached) as T
          this.l1Cache.set(key, { data: parsed, expiresAt: now + this.TTL_MS })
          return parsed
        }
      } catch (err) {
        console.warn(`[ConfigCacheService] Redis get failed for key ${key}:`, err)
      }
    }

    // Database Fallback
    const freshData = await dbFallback()
    
    // Write back to L1
    this.l1Cache.set(key, { data: freshData, expiresAt: now + this.TTL_MS })

    // Write back to L2 Redis asynchronously
    if (redis) {
      try {
        await redis.set(key, JSON.stringify(freshData), 'EX', Math.floor(this.TTL_MS / 1000))
      } catch (err) {
        console.warn(`[ConfigCacheService] Redis set failed for key ${key}:`, err)
      }
    }

    return freshData
  }

  /**
   * Invalidate cached config key or pattern (call when admin mutates rules/transitions)
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    // Flush matching entries from L1
    for (const key of Array.from(this.l1Cache.keys())) {
      if (key.includes(pattern)) {
        this.l1Cache.delete(key)
      }
    }

    // Flush from L2 Redis
    const redis = this.getRedis()
    if (redis) {
      try {
        const keys = await redis.keys(`config:*${pattern}*`)
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } catch (err) {
        console.warn(`[ConfigCacheService] Redis invalidation failed for pattern ${pattern}:`, err)
      }
    }
  }

  /** Clear all cached configuration entries */
  static clearAll(): void {
    this.l1Cache.clear()
  }
}
