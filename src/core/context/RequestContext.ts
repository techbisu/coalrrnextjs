/**
 * RequestContext — Propagates HTTP request metadata across async call chains
 * using Node.js AsyncLocalStorage, completely decoupled from Next.js headers().
 *
 * How it works:
 *   API route calls `withRequestContext(req, fn)` ONCE at the HTTP boundary.
 *   Everything downstream (Use Cases, repositories, Prisma extension) reads
 *   `getRequestContext()` — no Next.js import, no serverless/job crash.
 */
import { AsyncLocalStorage } from 'async_hooks'

export interface RequestContextPayload {
  userId?: string
  ipAddress?: string
  userAgent?: string
}

const SYSTEM_CONTEXT: RequestContextPayload = { userId: undefined }

/** Module-level singleton — safe across hot-reloads and serverless cold starts. */
export const RequestContext = new AsyncLocalStorage<RequestContextPayload>()

/**
 * Read the active request context.
 * Falls back to SYSTEM_CONTEXT when called outside an HTTP request
 * (BullMQ worker, cron job, seed script, unit test) — never throws.
 */
export function getRequestContext(): RequestContextPayload {
  return RequestContext.getStore() ?? SYSTEM_CONTEXT
}

/**
 * Bind a RequestContext to all async operations inside `fn`.
 * Call this once at the API route boundary, before any db.* calls.
 */
export function runWithRequestContext<T>(
  ctx: RequestContextPayload,
  fn: () => T
): T {
  return RequestContext.run(ctx, fn)
}

// --- Legacy shim (backwards compat with existing getUserIdFromContext calls) ---
export function getUserIdFromContext(): string | undefined {
  return RequestContext.getStore()?.userId
}
