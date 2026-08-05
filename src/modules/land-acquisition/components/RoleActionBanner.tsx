'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { ScheduleDetail } from '../types'

export function RoleActionBanner({ schedule, onAction }: { schedule: ScheduleDetail, onAction?: (actionName: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['proposal-transitions', schedule.id],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${schedule.id}/transition`)
      if (!res.ok) return { availableTransitions: [] }
      return res.json() as Promise<{
        availableTransitions: Array<{
          transition_name: string;
          label: string;
          required_role: string;
        }>;
      }>
    },
    // Don't refetch too aggressively
    staleTime: 5 * 60 * 1000
  })

  // We only show actions that the current user has access to.
  // The API already filters this based on session (in an ideal implementation), 
  // but if it returns all transitions for the state, we might need client side filtering.
  // Assuming the backend handles filtering by role or returning a flag if allowed.
  // For the sake of UI, we will render whatever is returned.
  const transitions = data?.availableTransitions || []

  if (isLoading || transitions.length === 0) return null

  return (
    <Alert className="border-blue-400 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-sm font-bold flex items-center justify-between">
        Required Workflow Actions
      </AlertTitle>
      <AlertDescription className="text-xs mt-2">
        <p className="mb-3">The following actions are available for the current stage: <strong>{schedule.state}</strong></p>
        <div className="flex flex-wrap gap-2">
          {transitions.map(t => (
            <Button 
              key={t.transition_name}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => onAction?.(t.transition_name)}
            >
              {t.label} <ArrowRight className="ml-2 w-3 h-3" />
            </Button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}
