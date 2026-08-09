'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Separator } from '@/shared/components/ui/separator'
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
  onActorRoleChange?: (role: string) => void
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
  onActorRoleChange,
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
          <CardTitle className="text-base">Actor Role &amp; Approval Chain</CardTitle>
          <StateBadge state={currentState} meta={meta} size="md" />
        </div>
        {meta?.description && (
          <CardDescription className="text-xs">{meta.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground">Authenticated Role:</span>
          {onActorRoleChange ? (
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-semibold text-xs bg-background text-foreground">
                {ROLE_LABELS[actorRole || 'unit_office'] ?? actorRole}
              </Badge>
            </div>
          ) : (
            <Badge variant="outline" className="font-semibold text-xs bg-background">
              {ROLE_LABELS[actorRole || 'unit_office'] ?? actorRole}
            </Badge>
          )}
        </div>
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

        {/* Action buttons — Sequential Display & Prerequisite Enforcement */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Stage Actions</p>
            {availableTransitions.length > 0 && (
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                {availableTransitions.length} {availableTransitions.length === 1 ? 'Action' : 'Sequential Actions'}
              </Badge>
            )}
          </div>

          {availableTransitions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              No transitions available from this state (terminal or awaiting upstream action).
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {availableTransitions.map((t, idx) => {
                const roleMatches = !actorRole || t.role === actorRole
                const blocked = !!t.guardFailed
                const disabled = !roleMatches || blocked
                const variant = transitionButtonVariant(t)
                const itemKey = `${t.name}-${t.role || 'role'}-${idx}`

                const button = (
                  <Button
                    key={itemKey}
                    onClick={() => !disabled && onAction?.(t.name)}
                    disabled={disabled}
                    variant={variant}
                    size="sm"
                    className={cn(
                      "w-full justify-between h-auto py-2.5 px-3 text-xs font-medium transition-all shadow-sm",
                      variant === 'default' && !blocked && 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold',
                      variant === 'outline' && 'border-amber-400 text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950',
                      disabled && "opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 border-slate-200"
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{t.label}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-1" />
                  </Button>
                )

                if (disabled) {
                  return (
                    <TooltipProvider key={itemKey} delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild><div>{button}</div></TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          {blocked ? (
                            <>
                              <p className="flex items-center gap-1.5 font-medium text-rose-600">
                                <ShieldAlert className="h-3.5 w-3.5" /> Prerequisite Incomplete
                              </p>
                              <p className="mt-1 text-xs text-slate-200">{t.guardFailed!.reason}</p>
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
