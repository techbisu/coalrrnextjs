'use client'

import * as React from 'react'
import { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, ArrowRight, ShieldAlert, FileSignature, Check, Lock, GitBranch, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { StateBadge } from './StateBadge'

export interface AvailableTransition {
  name: string
  label: string
  role: string
  guardFailed?: { reason: string } | null
}

export interface ProcessActionCenterProps {
  entityId: string
  entityCode: string
  entityTypeLabel?: string
  currentStage: string
  userRole?: string
  checklistSummary?: {
    total: number
    completed: number
    isComplete: boolean
  }
  availableTransitions?: AvailableTransition[]
  pendingSignatureForm?: string
  onAction?: (transitionName: string) => void
  onOpenDocumentWorkspace?: (templateCode: string) => void
  className?: string
}

export function ProcessActionCenter({
  entityId,
  entityCode,
  entityTypeLabel = 'Land Schedule',
  currentStage,
  userRole = 'user',
  checklistSummary,
  availableTransitions = [],
  pendingSignatureForm,
  onAction,
  onOpenDocumentWorkspace,
  className,
}: ProcessActionCenterProps) {
  const [justCompleted, setJustCompleted] = useState(false)

  // Primary action decision logic
  let actionTitle = 'Review Details'
  let actionDescription = 'Awaiting stage action or verification.'
  let actionCta = 'Review Details'
  let actionIcon = <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  let isActionUrgent = false

  if (pendingSignatureForm) {
    actionTitle = `Signature Required: ${pendingSignatureForm}`
    actionDescription = `Official sign-off as ${userRole.replace(/_/g, ' ')} is pending.`
    actionCta = `Sign ${pendingSignatureForm}`
    actionIcon = <FileSignature className="h-4 w-4 text-rose-600 dark:text-rose-400 animate-bounce" />
    isActionUrgent = true
  } else if (checklistSummary && !checklistSummary.isComplete) {
    const missing = checklistSummary.total - checklistSummary.completed
    actionTitle = `Complete Checklist (${missing} Pending)`
    actionDescription = `${checklistSummary.completed} of ${checklistSummary.total} items completed. Mandatory checklist clearance required.`
    actionCta = 'View Checklist'
    actionIcon = <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  } else if (availableTransitions.length > 0) {
    const firstAllowed = availableTransitions.find(t => !t.guardFailed)
    if (firstAllowed) {
      actionTitle = `Ready to Advance: ${firstAllowed.label}`
      actionDescription = 'All mandatory requirements satisfied. Click below to transition state.'
      actionCta = firstAllowed.label
      actionIcon = <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    }
  }

  const handleCtaClick = () => {
    if (pendingSignatureForm && onOpenDocumentWorkspace) {
      onOpenDocumentWorkspace(pendingSignatureForm)
    } else if (availableTransitions.length > 0) {
      const firstAllowed = availableTransitions.find(t => !t.guardFailed)
      if (firstAllowed && onAction) {
        onAction(firstAllowed.name)
        triggerCheckmarkAnimation()
      }
    }
  }

  const triggerCheckmarkAnimation = () => {
    setJustCompleted(true)
    setTimeout(() => setJustCompleted(false), 2000)
  }

  return (
    <div className={cn('rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-4 transition-all duration-300', className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Action Command Center
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StateBadge state={currentStage} size="sm" />
          <Badge variant="secondary" className="text-[10px] font-mono capitalize">
            {userRole.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* Main Pending Action Card with Micro-Animation */}
      <div className={cn(
        'rounded-lg border p-3.5 transition-all duration-300 relative overflow-hidden',
        justCompleted 
          ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 ring-2 ring-emerald-400/50 scale-[1.01]' 
          : isActionUrgent 
          ? 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50' 
          : 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/40'
      )}>
        {justCompleted && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-emerald-700 font-bold text-xs animate-in zoom-in-50">
            <Check className="h-4 w-4 bg-emerald-600 text-white rounded-full p-0.5" /> Action Completed!
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            {actionIcon}
            <span>{actionTitle}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{actionDescription}</p>
        </div>

        <Button 
          size="sm" 
          onClick={handleCtaClick} 
          className={cn(
            'mt-3 w-full text-xs font-semibold h-8 transition-transform active:scale-95 cursor-pointer shadow-sm',
            isActionUrgent 
              ? 'bg-rose-600 hover:bg-rose-700 text-white' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          )}
        >
          <span>{actionCta}</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {/* Available Transition Actions */}
      <div className="space-y-2 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-sky-600" /> Stage Transition Actions
          </span>
          <span className="text-[10px] text-muted-foreground">({availableTransitions.length})</span>
        </div>

        <div className="space-y-1.5">
          {availableTransitions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" /> No actions available for your role at this stage.
            </div>
          ) : (
            availableTransitions.map((t, idx) => {
              const blocked = !!t.guardFailed
              const isReturn = t.name.toLowerCase().includes('return') || t.name.toLowerCase().includes('reject')

              const btn = (
                <Button
                  key={`${t.name}-${idx}`}
                  size="sm"
                  disabled={blocked}
                  onClick={() => {
                    if (!blocked && onAction) {
                      onAction(t.name)
                      triggerCheckmarkAnimation()
                    }
                  }}
                  variant={isReturn ? 'outline' : 'default'}
                  className={cn(
                    'w-full justify-between text-xs h-8 font-medium transition-all duration-150 cursor-pointer',
                    !blocked && !isReturn && 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs',
                    isReturn && 'hover:bg-amber-50 text-amber-800 border-amber-300 dark:hover:bg-amber-950/40',
                    blocked && 'opacity-60 cursor-not-allowed bg-slate-100 text-slate-500'
                  )}
                >
                  <span className="truncate">{t.label}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 ml-1" />
                </Button>
              )

              if (blocked) {
                return (
                  <TooltipProvider key={`${t.name}-${idx}`} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild><div>{btn}</div></TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs text-xs p-2.5 shadow-lg border-rose-200">
                        <p className="font-semibold text-rose-600 flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> Prerequisite Blocked
                        </p>
                        <p className="mt-1 text-slate-200 leading-tight">{t.guardFailed!.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }

              return btn
            })
          )}
        </div>
      </div>
    </div>
  )
}
