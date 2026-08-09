/**
 * Server-only API helpers.
 *
 * This file imports next/headers, auth, and other server-only APIs.
 * Import from here ONLY in API route handlers (src/app/api/**\/route.ts).
 * NEVER import from client components, shared utils, or _lib.ts.
 *
 * The 'server-only' package makes Next.js throw a build error if this
 * file is accidentally imported inside a Client Component bundle.
 */
import 'server-only'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/lib/auth'
import { getRealIp } from '@/core/audit/utils/getRealIp'
import { runWithRequestContext } from '@/core/context/RequestContext'

/**
 * Wraps a route handler inside a bound RequestContext.
 *
 * This is the ONE place where `headers()` and `getCurrentUser()` are called
 * for audit context. The Prisma extension reads via AsyncLocalStorage —
 * no Next.js API is called inside the DB layer.
 *
 * Usage in any API route:
 *   import { withRequestContext } from '@/app/api/_server'
 *
 *   export async function POST(req: NextRequest) {
 *     return withRequestContext(req, async () => {
 *       const auth = await authorizeApi('project.create')
 *       if (auth.error) return auth.error
 *       // ... all db calls here carry userId / IP / UA automatically
 *     })
 *   }
 */
export async function withRequestContext<T>(
  _req: Request,
  fn: () => Promise<T>
): Promise<T> {
  const h = await headers()
  const user = await getCurrentUser().catch(() => null)
  const ipAddress = await getRealIp().catch(() => undefined)
  return runWithRequestContext(
    {
      userId: user?.id ? String(user.id) : undefined,
      ipAddress: ipAddress ?? undefined,
      userAgent: h.get('user-agent') ?? undefined,
    },
    fn
  )
}
