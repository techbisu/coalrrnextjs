'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, Clock, XCircle, GitBranch, ShieldAlert, Lock, ArrowRight, AlertTriangle,
} from 'lucide-react'
import { StateBadge, DEFAULT_STATE_META } from './StateBadge'

export interface ReviewTaskView {
  role: string
  status: 'pending' | 'approved' | 'rejected'
  decided_by?: string
  decided_at?: string
  comment?: string
}

export interface AvailableTransition {
  name: string
  label: string
  role: string
  guardFailed?: { reason: string } | null
}

export interface ApprovalPanelProps {
  currentState: string
  stateMeta?: { label: string; description?: string; color?: string; icon?: string }
  reviewTasks?: ReviewTaskView[]
  availableTransitions: AvailableTransition[]
  actorRole?: string
  onAction?: (transitionName: string) => void
  className?: string
}

const ROLE_LABELS: Record<string, string> = {
  unit_office: 'Unit Office',
  area_office: 'Area Office',
  gm_planning: 'GM (Planning)',
  gm_finance: 'GM (Finance)',
  gm_safety: 'GM (Safety)',
  director: 'Director',
  cmd: 'CMD',
  board: 'Board of Directors',
}

const REVIEW_STATUS = {
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  pending:  { label: 'Pending',  icon: Clock,        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  rejected: { label: 'Rejected', icon: XCircle,      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
} as const

export function ApprovalPanel({
  currentState,
  stateMeta,
  reviewTasks = [],
  availableTransitions,
  actorRole,
  onAction,
  className,
}: ApprovalPanelProps) {
  const meta = stateMeta ?? DEFAULT_STATE_META[currentState]
  const isParallel = currentState === 'HqParallelVetting'
  const approvedCount = reviewTasks.filter((t) => t.status === 'approved').length
  const allApproved = reviewTasks.length > 0 && approvedCount === reviewTasks.length

  const transitionButtonVariant = (t: AvailableTransition) => {
    if (t.label.toLowerCase().includes('reject')) return 'destructive'
    if (t.label.toLowerCase().includes('escalat')) return 'outline'
    return 'default'
  }

  return (
    <Card className={cn('border-border/60 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Approval Chain</CardTitle>
          <StateBadge state={currentState} meta={meta} size="md" />
        </div>
        {meta?.description && (
          <CardDescription className="text-xs">{meta.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Parallel review fan-out */}
        {isParallel && reviewTasks.length > 0 && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900 dark:bg-violet-950/20">
            <div className="mb-2 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-900 dark:text-violet-200">Parallel Vetting — {approvedCount}/{reviewTasks.length} approved</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {reviewTasks.map((task) => {
                const st = REVIEW_STATUS[task.status]
                const Icon = st.icon
                return (
                  <div key={task.role} className="flex items-start gap-2 rounded-md border border-violet-200/60 bg-background p-2 dark:border-violet-900/60">
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', st.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{ROLE_LABELS[task.role] ?? task.role}</span>
                      </div>
                      {task.decided_by && (
                        <p className="text-[11px] text-muted-foreground">
                          by {task.decided_by}{task.decided_at ? ` · ${task.decided_at}` : ''}
                        </p>
                      )}
                      {task.comment && <p className="mt-0.5 text-[11px] italic text-muted-foreground">"{task.comment}"</p>}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-violet-700 dark:text-violet-300">
              <AlertTriangle className="h-3 w-3" />
              Advances only when all required reviews complete.
            </p>
          </div>
        )}

        {/* Non-parallel review task summary (single role) */}
        {!isParallel && reviewTasks.length > 0 && (
          <div className="space-y-1.5">
            {reviewTasks.map((task) => {
              const st = REVIEW_STATUS[task.status]
              const Icon = st.icon
              return (
                <div key={task.role} className="flex items-center gap-2 text-sm">
                  <Icon className={cn('h-4 w-4', st.color.split(' ')[0])} />
                  <span className="font-medium">{ROLE_LABELS[task.role] ?? task.role}</span>
                  <Badge variant="outline" className="ml-auto text-xs">{st.label}</Badge>
                </div>
              )
            })}
          </div>
        )}

        <Separator />

        {/* Action buttons */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Available Actions</p>
          {availableTransitions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              No transitions available from this state (terminal or awaiting upstream action).
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((t) => {
                const roleMatches = !actorRole || t.role === actorRole
                const blocked = !!t.guardFailed
                const disabled = !roleMatches || blocked
                const variant = transitionButtonVariant(t)
                const button = (
                  <Button
                    key={t.name}
                    onClick={() => !disabled && onAction?.(t.name)}
                    disabled={disabled}
                    variant={variant}
                    size="sm"
                    className={cn(
                      variant === 'default' && !blocked && 'bg-emerald-600 hover:bg-emerald-700',
                      variant === 'outline' && 'border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950',
                    )}
                  >
                    {t.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )
                if (disabled) {
                  return (
                    <TooltipProvider key={t.name} delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild><span>{button}</span></TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          {blocked ? (
                            <>
                              <p className="flex items-center gap-1.5 font-medium text-rose-600">
                                <ShieldAlert className="h-3.5 w-3.5" /> Guard failed
                              </p>
                              <p className="mt-1 text-xs">{t.guardFailed!.reason}</p>
                            </>
                          ) : (
                            <p className="text-xs">Requires role: <span className="font-medium">{ROLE_LABELS[t.role] ?? t.role}</span></p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                }
                return button
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
