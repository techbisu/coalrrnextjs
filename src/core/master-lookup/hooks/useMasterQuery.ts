import { useQuery } from '@tanstack/react-query'
import { MasterOption, LookupConfig } from '../types'
import { MasterIDBCache } from '../cache/MasterIDBCache'

export function masterQueryKey(
  master: string,
  deps?: Record<string, string>,
  activeOnly = true
) {
  return ['master-lookup', master, deps, activeOnly]
}

export function useMasterQuery(
  {
    master,
    dependsOn,
    activeOnly = true,
    selectedValues,
  }: Omit<LookupConfig, 'searchQuery'>,
  enabled: boolean = true
) {
  // Normalize all dependsOn values to strings for stable query keys and URL params
  const normalizedDeps = dependsOn
    ? Object.fromEntries(
        Object.entries(dependsOn)
          .filter(
            ([, v]) =>
              v !== null &&
              v !== undefined &&
              v !== '' &&
              !(Array.isArray(v) && v.length === 0)
          )
          .map(([k, v]) => [k, String(v)])
      )
    : undefined

  // Wait to fetch until all dependencies have concrete values
  const allDepsReady = dependsOn
    ? Object.values(dependsOn).every(
        (val) =>
          val !== null &&
          val !== undefined &&
          val !== '' &&
          !(Array.isArray(val) && val.length === 0)
      )
    : true

  return useQuery<{ options: MasterOption[] }, Error>({
    /**
     * Search is intentionally excluded from the query key.
     * Full dataset is fetched once per dependency set and filtered client-side.
     */
    queryKey: masterQueryKey(master, normalizedDeps, activeOnly),

    queryFn: async () => {
      /**
       * Cache-first strategy:
       *
       * 1. Check IndexedDB — if data is present AND version matches the server
       *    version stored in IDB, return immediately without hitting the API.
       *    This covers the case where React Query's 1hr staleTime has expired
       *    but IDB still holds valid data (24hr TTL).
       *
       * 2. Only fall through to the API when:
       *    - IDB has no entry for this master+deps combination (first load)
       *    - IDB entry has a different version (master data changed on server)
       *    - IDB entry has exceeded its 24hr hard TTL
       */
      const storedVersion = await MasterIDBCache.getVersion()
      const cached = await MasterIDBCache.get(master, normalizedDeps)

      if (cached && storedVersion && cached.version === storedVersion) {
        // IDB hit — return without any network request
        return { options: cached.options as MasterOption[] }
      }

      // IDB miss or stale — fetch from API
      const url = buildUrl(master, normalizedDeps, activeOnly, selectedValues)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch master data: ${master}`)
      const data: { options: MasterOption[] } = await res.json()

      // Persist fresh data to IDB for next RQ stale cycle
      const version = storedVersion ?? String(Date.now())
      await MasterIDBCache.set(master, normalizedDeps, data.options as any, version)

      return data
    },

    /**
     * 1 hour staleTime — React Query will not re-run queryFn until this expires.
     * After expiry, queryFn runs but checks IDB first (cache-first above),
     * so a network request only happens when IDB is also stale/missing.
     */
    staleTime: 1000 * 60 * 60,

    enabled: enabled && allDepsReady,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUrl(
  master: string,
  normalizedDeps?: Record<string, string>,
  activeOnly?: boolean,
  selectedValues?: string[]
): string {
  const params = new URLSearchParams()

  if (normalizedDeps) {
    Object.entries(normalizedDeps).forEach(([key, value]) => {
      params.append(key, value)
    })
  }
  if (activeOnly) {
    params.append('activeOnly', 'true')
  }
  if (selectedValues && selectedValues.length > 0) {
    params.append('values', selectedValues.join(','))
  }

  const qs = params.toString()
  return qs
    ? `/api/master-data/lookup/${master}?${qs}`
    : `/api/master-data/lookup/${master}`
}
