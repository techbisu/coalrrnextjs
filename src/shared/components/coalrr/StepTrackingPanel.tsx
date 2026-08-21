'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'

export interface StepTrackingPanelProps {
  entityType: string
  entityId: string
  stepGroup: string
  groupLabel?: string
  onStepComplete?: () => void
  readOnly?: boolean
}

export interface StepItem {
  id: string
  step_group: string
  step_key: string
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED'
  remarks: string | null
  completed_by: number | null
  completed_at: string | null
}

export function StepTrackingPanel({
  entityType,
  entityId,
  stepGroup,
  groupLabel,
  onStepComplete,
  readOnly = false,
}: StepTrackingPanelProps) {
  const [loading, setLoading] = useState(true)
  const [submittingStepKey, setSubmittingStepKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<StepItem[]>([])
  const [stats, setStats] = useState({ total: 0, completed: 0, percentage: 0 })

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(
        `/api/workflow/steps/status?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&stepGroup=${encodeURIComponent(stepGroup)}`
      )
      const json = await res.json()
      if (json.ok && json.data) {
        const stepList: StepItem[] = json.data.steps ?? []
        setSteps(stepList)
        const total = stepList.length
        const completed = stepList.filter((s) => s.status === 'COMPLETED').length
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
        setStats({ total, completed, percentage })
      } else {
        setError(json.error ?? 'Failed to load step tracking data')
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error fetching step status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (entityType && entityId && stepGroup) {
      fetchStatus()
    }
  }, [entityType, entityId, stepGroup])

  const handleCompleteStep = async (stepKey: string) => {
    try {
      setSubmittingStepKey(stepKey)
      const res = await fetch('/api/workflow/steps/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          stepGroup,
          stepKey,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        await fetchStatus()
        if (onStepComplete) onStepComplete()
      } else {
        alert(json.error ?? 'Failed to complete step')
      }
    } catch (e: any) {
      alert(e.message ?? 'Error completing step')
    } finally {
      setSubmittingStepKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 border rounded-lg bg-card text-card-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" />
        <span className="text-sm font-medium">Loading step progress...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">{groupLabel ?? `Step Group: ${stepGroup}`}</h4>
          <p className="text-xs text-muted-foreground">
            {stats.completed} of {stats.total} micro-steps / signatures verified ({stats.percentage}%)
          </p>
        </div>
        <Badge variant={stats.percentage === 100 ? 'default' : 'outline'}>
          {stats.percentage === 100 ? 'Fully Satisfied' : 'In Progress'}
        </Badge>
      </div>

      <Progress value={stats.percentage} className="h-2" />

      <div className="space-y-2 pt-2">
        {steps.map((step) => {
          const isDone = step.status === 'COMPLETED'
          const isSubmitting = submittingStepKey === step.step_key

          return (
            <div
              key={step.id || step.step_key}
              className={`flex items-center justify-between p-2.5 rounded-md border text-sm transition-colors ${
                isDone ? 'bg-muted/40 border-muted' : 'bg-background border-border'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className={isDone ? 'line-through text-muted-foreground' : 'font-medium'}>
                  {step.step_key.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              <div>
                {isDone ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Verified
                  </span>
                ) : !readOnly ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => handleCompleteStep(step.step_key)}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Verify & Sign'
                    )}
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
