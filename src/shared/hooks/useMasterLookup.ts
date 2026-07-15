import { useQuery } from '@tanstack/react-query'

export interface MasterOption {
  label: string
  value: string
}

export interface UseMasterLookupProps {
  masterName: string
  dependencies?: Record<string, string | number | null | undefined>
  enabled?: boolean
}

export function useMasterLookup({ masterName, dependencies, enabled = true }: UseMasterLookupProps) {
  // We only enable the query if all non-null dependencies are actually provided.
  // E.g., if a District dropdown depends on state_lgd, and state_lgd is null, we shouldn't fetch Districts yet.
  const allDepsReady = dependencies 
    ? Object.values(dependencies).every(val => val !== null && val !== undefined && val !== '')
    : true

  return useQuery<{ options: MasterOption[] }, Error>({
    queryKey: ['master-lookup', masterName, dependencies],
    queryFn: async () => {
      let url = `/api/master-data/lookup/${masterName}`
      if (dependencies) {
        const params = new URLSearchParams()
        Object.entries(dependencies).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params.append(key, String(value))
          }
        })
        const qs = params.toString()
        if (qs) {
          url += `?${qs}`
        }
      }

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch ${masterName}`)
      }
      return res.json()
    },
    enabled: enabled && allDepsReady,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since master data changes rarely
  })
}
