'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { MasterIDBCache } from '../cache/MasterIDBCache'
import { masterQueryKey } from '../hooks/useMasterQuery'

/**
 * Root-level master tables (no cascade dependencies) — safe to prefetch on app load.
 * Cascaded tables (district, block, mouza, village) depend on user selections
 * so they are fetched lazily when the dropdown mounts with known dependencies.
 */
const ROOT_MASTERS = [
  'state',
  'caste',
  'owner_type',
  'landclass',
  'landtype',
  'acqu_mode',
  'area',
  'mine',
] as const

/**
 * MasterDataPrefetcher
 *
 * Placed once in the app layout (inside QueryProvider). Renders nothing.
 * On mount it:
 *   1. Checks the server version against the locally stored IDB version.
 *   2. If version changed → invalidates ALL IndexedDB master cache entries
 *      + invalidates React Query cache so stale data isn't served.
 *   3. Prefetches all root master tables into React Query + IndexedDB.
 *      Data from IDB is served instantly; API is called only on a cache miss
 *      or version mismatch.
 *   4. Re-checks version every 5 minutes and on window focus to auto-sync
 *      when an admin updates master data.
 */
export function MasterDataPrefetcher() {
  const queryClient = useQueryClient()
  const hasRunRef = React.useRef(false)

  const checkVersionAndPrefetch = React.useCallback(async () => {
    try {
      // 1. Fetch current server version (browser/CDN cached for 60s)
      const res = await fetch('/api/master-data/version')
      if (!res.ok) return
      const { version } = (await res.json()) as { version: string }

      const storedVersion = await MasterIDBCache.getVersion()

      if (storedVersion !== version) {
        // 2. Version mismatch — wipe all cached master data
        await MasterIDBCache.invalidateAll()
        await MasterIDBCache.setVersion(version)

        // Invalidate React Query cache so all active queries refetch
        queryClient.invalidateQueries({ queryKey: ['master-lookup'] })
      }

      // 3. Prefetch root masters that aren't already in the React Query cache
      await Promise.allSettled(
        ROOT_MASTERS.map(async master => {
          const qKey = masterQueryKey(master, undefined, true)

          // Already in RQ memory cache — skip
          if (queryClient.getQueryData(qKey)) return

          // Check IndexedDB — seed RQ cache instantly if valid
          const cached = await MasterIDBCache.get(master, undefined)
          if (cached && cached.version === version) {
            queryClient.setQueryData(qKey, { options: cached.options })
            return
          }

          // Cache miss or stale — fetch from API and persist to IDB
          return queryClient.prefetchQuery({
            queryKey: qKey,
            queryFn: async () => {
              const r = await fetch(
                `/api/master-data/lookup/${master}?activeOnly=true`
              )
              if (!r.ok) throw new Error(`Prefetch failed: ${master}`)
              const data = await r.json()
              await MasterIDBCache.set(master, undefined, data.options, version)
              return data
            },
            staleTime: 1000 * 60 * 60, // 1 hour
          })
        })
      )
    } catch {
      // Prefetch failures are non-critical — dropdowns fetch on demand as fallback
    }
  }, [queryClient])

  React.useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    // Run immediately on app mount
    checkVersionAndPrefetch()

    // Re-check every 5 minutes
    const intervalId = setInterval(checkVersionAndPrefetch, 1000 * 60 * 5)

    // Re-check when user returns to the tab (catches admin changes while away)
    window.addEventListener('focus', checkVersionAndPrefetch)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', checkVersionAndPrefetch)
    }
  }, [checkVersionAndPrefetch])

  return null
}
