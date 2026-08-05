import { useQuery } from '@tanstack/react-query'

export interface MasterOption {
  label: string
  value: string
  data?: Record<string, any>
}

export interface UseMasterLookupProps {
  masterName: string
  dependencies?: Record<string, any>
  enabled?: boolean
}

export function useMasterLookup({ masterName, dependencies, enabled = true }: UseMasterLookupProps) {
  // We only enable the query if all non-null dependencies are actually provided.
  const allDepsReady = dependencies 
    ? Object.values(dependencies).every(val => {
        if (val === null || val === undefined || val === '') return false
        if (Array.isArray(val) && val.length === 0) return false
        return true
      })
    : true

  return useQuery<{ options: MasterOption[] }, Error>({
    queryKey: ['master-lookup', masterName, dependencies],
    queryFn: async () => {
      let url = `/api/master-data/lookup/${masterName}`
      if (dependencies) {
        const params = new URLSearchParams()
        Object.entries(dependencies).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              if (value.length > 0) {
                params.append(key, value.join(','))
              }
            } else {
              params.append(key, String(value))
            }
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
