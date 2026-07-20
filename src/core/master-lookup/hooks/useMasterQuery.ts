import { useQuery } from '@tanstack/react-query'
import { MasterOption, LookupConfig } from '../types'

export function useMasterQuery({
  master,
  dependsOn,
  searchQuery,
  activeOnly = true,
  selectedValues,
}: LookupConfig, enabled: boolean = true) {
  // Normalize all dependsOn values to strings for stable query keys and URL params
  // This avoids BigInt serialization issues and ensures cache hits across type variants
  const normalizedDeps = dependsOn
    ? Object.fromEntries(
        Object.entries(dependsOn)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    : undefined

  // Wait to fetch until all dependencies have concrete values (not null/undefined)
  const allDepsReady = dependsOn
    ? Object.values(dependsOn).every(val => val !== null && val !== undefined && val !== '')
    : true

  return useQuery<{ options: MasterOption[] }, Error>({
    queryKey: ['master-lookup', master, normalizedDeps, searchQuery, activeOnly, selectedValues],
    queryFn: async () => {
      let url = `/api/master-data/lookup/${master}`
      const params = new URLSearchParams()

      if (normalizedDeps) {
        Object.entries(normalizedDeps).forEach(([key, value]) => {
          params.append(key, value)
        })
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (activeOnly) {
        params.append('activeOnly', 'true')
      }
      if (selectedValues && selectedValues.length > 0) {
        params.append('values', selectedValues.join(','))
      }

      const qs = params.toString()
      if (qs) {
        url += `?${qs}`
      }

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch master data: ${master}`)
      }
      return res.json()
    },
    enabled: enabled && allDepsReady,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  })
}
