/**
 * Rate Limiter - In-memory rate limiting for API endpoints.
 * For production, replace with Redis-backed rate limiter.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  keyGenerator?: (identifier: string) => string
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private config: RateLimitConfig) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if a request should be allowed.
   * Returns true if allowed, false if rate limited.
   */
  check(identifier: string): {
    allowed: boolean
    remaining: number
    resetAt: number
    retryAfter?: number
  } {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier
    
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || entry.resetAt <= now) {
      // New window
      const resetAt = now + this.config.windowMs
      this.store.set(key, { count: 1, resetAt })
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt,
      }
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limited
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      }
    }

    // Increment count
    entry.count++
    this.store.set(key, entry)

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    }
  }

  /**
   * Reset rate limit for an identifier.
   */
  reset(identifier: string): void {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier
    this.store.delete(key)
  }

  /**
   * Clean up expired entries.
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Stop the cleanup interval.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Pre-configured rate limiters

/**
 * General API rate limiter - 100 requests per minute.
 */
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
})

/**
 * Authentication rate limiter - 5 requests per minute.
 * More strict to prevent brute force attacks.
 */
export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
})

/**
 * File upload rate limiter - 10 uploads per minute.
 */
export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
})

/**
 * Get client identifier from request.
 * Uses X-Forwarded-For header if behind a proxy, falls back to IP.
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  // In Next.js, we might not have direct access to IP
  // This would typically be handled by middleware or edge functions
  return 'unknown'
}