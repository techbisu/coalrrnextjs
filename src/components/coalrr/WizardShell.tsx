'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface WizardStep {
  key: string
  title: string
  description?: string
  icon?: LucideIcon
}

export type StepState = 'pending' | 'active' | 'complete' | 'error'

export interface WizardShellProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange?: (step: number) => void
  stepStates?: StepState[]
  onSubmit?: () => void
  submitting?: boolean
  submitLabel?: string
  nextLabel?: string
  backLabel?: string
  /** Visited step indices the user can jump back to */
  maxVisitedStep?: number
  children: React.ReactNode
  footer?: React.ReactNode
  /** Auto-save hint shown top-right */
  autoSaved?: boolean
}

export function WizardShell({
  steps,
  currentStep,
  onStepChange,
  stepStates,
  onSubmit,
  submitting,
  submitLabel = 'Submit Claim',
  nextLabel = 'Next',
  backLabel = 'Back',
  maxVisitedStep = 0,
  children,
  footer,
  autoSaved = true,
}: WizardShellProps) {
  const safeCurrent = Math.max(0, Math.min(steps.length - 1, currentStep))
  const isLast = safeCurrent === steps.length - 1
  const canBack = safeCurrent > 0
  const canNext = safeCurrent < maxVisitedStep + 1 && safeCurrent < steps.length - 1

  const stateOf = (i: number): StepState => {
    if (stepStates?.[i]) return stepStates[i]
    if (i < safeCurrent) return 'complete'
    if (i === safeCurrent) return 'active'
    return 'pending'
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, i) => {
            const st = stateOf(i)
            const Icon = s.icon
            const clickable = i <= maxVisitedStep && onStepChange
            return (
              <React.Fragment key={s.key}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepChange?.(i)}
                  className={cn(
                    'group flex flex-1 flex-col items-center gap-1.5 text-center transition',
                    clickable ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition',
                      st === 'complete' && 'border-emerald-500 bg-emerald-500 text-white',
                      st === 'active' && 'border-amber-500 bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950',
                      st === 'error' && 'border-rose-500 bg-rose-500 text-white',
                      st === 'pending' && 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {st === 'complete' ? <Check className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cn(
                    'hidden text-xs font-medium sm:block',
                    st === 'active' ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {s.title}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1 rounded-full transition',
                    i < safeCurrent ? 'bg-emerald-400' : 'bg-border',
                  )} />
                )}
              </React.Fragment>
            )
          })}
        </div>
        {/* Mobile: current step title */}
        <div className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
          Step {safeCurrent + 1} of {steps.length}: <span className="font-medium text-foreground">{steps[safeCurrent].title}</span>
        </div>
        {autoSaved && (
          <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-emerald-600">
            <Check className="h-3 w-3" /> Step auto-saved
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-h-[280px]">{children}</div>

      {/* Footer */}
      {footer ?? (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onStepChange?.(safeCurrent - 1)}
            disabled={!canBack}
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          <div className="text-xs text-muted-foreground">
            {safeCurrent + 1} / {steps.length}
          </div>
          {isLast ? (
            <Button type="button" onClick={onSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          ) : (
            <Button type="button" onClick={() => onStepChange?.(safeCurrent + 1)} disabled={!canNext}>
              {nextLabel}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
