'use client'

import * as React from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Clock, CheckCircle2, Circle, ArrowRight, Paperclip, Download, MessageSquare,
  GitBranch, User, MapPin, Building2, Phone, Mail, ChevronDown, ChevronUp, History, Sparkles, Check, Lightbulb, AlertTriangle
} from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/lib/utils'

import { useWorkflowSnapshot } from '@/shared/hooks/useWorkflowSnapshot'
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'

import { UserInfoBadge } from './UserInfoBadge'

export interface StageStep {
  code: string
  label: string
  status: 'done' | 'current' | 'pending' | 'skipped'
  order?: number
}

export interface UnifiedWorkflowTimelineProps {
  moduleCode: string
  entityId: string
  entityType?: string
  userRole?: string
  stages?: StageStep[]
  maxHeight?: number | string
  defaultOpen?: boolean
  className?: string
  onExecuteTransition?: (transition: any) => void
  onSelectTab?: (tab: 'checklist' | 'plots' | 'milestones') => void
}

export interface WorkflowHistoryItem {
  wah_id: string
  action: string
  from_state: string
  to_state: string
  user_id?: number
  user_name_label?: string
  user_role_label?: string
  target_recipient_label?: string
  comments?: string
  recommendations_json?: any
  annexure_notes?: string
  entry_ts: string
  user?: {
    id: number
    name: string
    designation?: string
    mobile?: string
    email?: string
    area_name?: string
    colliery_name?: string
  }
  attachment?: {
    id: string
    original_name: string
    status: string
  } | null
}

export interface ParallelReviewTask {
  review_task_id: string
  role: string
  status: string
  entry_ts: string
}

function formatDateHeader(dateStr?: string | Date): string {
  if (!dateStr) return 'Current Active Stage'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return String(dateStr)
  }
}

function formatTimeLabel(dateStr?: string | Date): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

function getInitials(name?: string): string {
  if (!name) return 'OFF'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function UnifiedWorkflowTimeline({
  moduleCode,
  entityId,
  entityType = CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
  userRole = 'unit_office',
  stages = [],
  maxHeight = 650,
  defaultOpen = true,
  className = '',
  onExecuteTransition,
  onSelectTab,
}: UnifiedWorkflowTimelineProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const { data: snapshot } = useWorkflowSnapshot(
    moduleCode,
    entityType,
    entityId,
    userRole
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: ['workflow', 'history', moduleCode, entityId],
    queryFn: async () => {
      const res = await fetch(`/api/workflow/${moduleCode}/${entityId}/history`)
      if (!res.ok) throw new Error('Failed to load workflow history')
      return res.json() as Promise<{
        history: WorkflowHistoryItem[]
        parallelTasks: ParallelReviewTask[]
      }>
    },
    enabled: Boolean(moduleCode && entityId),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 border border-border/80 rounded-xl bg-card">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm dark:bg-red-950/40 dark:text-red-300">
        Failed to load workflow timeline feed.
      </div>
    )
  }

  const { history = [], parallelTasks = [] } = data
  const currentIndex = Math.max(stages.findIndex((s) => s.status === 'current'), 0)
  const currentStageObj = stages[currentIndex]
  const pendingActions = snapshot?.currentAssignment?.pendingActions || []
  const availableTransitions = snapshot?.availableTransitions || []

  // Group history items by date
  const groupedHistory = history.reduce((acc, item) => {
    const header = formatDateHeader(item.entry_ts)
    if (!acc[header]) acc[header] = []
    acc[header].push(item)
    return acc
  }, {} as Record<string, WorkflowHistoryItem[]>)

  const currentDateHeader = formatDateHeader(new Date())

  return (
    <div className={cn('rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-200 overflow-hidden', className)}>
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-900/60 dark:hover:bg-slate-900 cursor-pointer transition-colors select-none border-b border-border/60"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground truncate">Workflow Stage Progress &amp; Audit Timeline</span>
              <Badge variant="outline" className="text-[10px] font-mono bg-background">
                {moduleCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {history.length} Completed Action Event{history.length === 1 ? '' : 's'} &bull; {pendingActions.length} Pending Action{pendingActions.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-muted-foreground">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="sr-only">Toggle Workflow Timeline</span>
        </Button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-6 animate-in fade-in-50 duration-200" style={{ maxHeight, overflowY: 'auto' }}>
          {/* Executive Pipeline Stage Stepper Track */}
          {stages.length > 0 && (
            <div className="p-4 rounded-xl border border-border/80 bg-gradient-to-br from-card via-muted/10 to-card shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-bold text-foreground">Pipeline Stage Progress</span>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  Stage {currentIndex + 1} of {stages.length}: {currentStageObj?.label || 'Drafting'}
                </Badge>
              </div>

              {/* Numbered Stepper Track */}
              <div className="relative flex items-center justify-between px-2 pt-1 pb-2">
                <div className="absolute left-6 right-6 top-4 h-1 bg-muted rounded-full -z-0" />
                <div
                  className="absolute left-6 top-4 h-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all duration-500 -z-0"
                  style={{
                    width: `${(currentIndex / Math.max(stages.length - 1, 1)) * 88}%`,
                  }}
                />

                {stages.map((step, idx) => {
                  const isDone = step.status === 'done'
                  const isCurrent = step.status === 'current'
                  const stepNum = idx + 1

                  return (
                    <div key={`${step.code}-${idx}`} className="flex flex-col items-center relative z-10 group">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 shadow-xs cursor-pointer',
                          isDone && 'bg-emerald-600 text-white ring-2 ring-emerald-200 dark:ring-emerald-900',
                          isCurrent && 'bg-sky-600 text-white ring-4 ring-sky-200 dark:ring-sky-900 scale-110 shadow-md',
                          !isDone && !isCurrent && 'bg-card text-muted-foreground border border-border/80'
                        )}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : stepNum}
                      </div>

                      <span
                        className={cn(
                          'mt-2 text-[11px] font-semibold text-center truncate max-w-[65px] sm:max-w-[85px] transition-colors',
                          isCurrent && 'text-sky-700 dark:text-sky-400 font-bold',
                          isDone && 'text-foreground font-medium',
                          !isDone && !isCurrent && 'text-muted-foreground'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* HQ Parallel Review Clearance Status */}
          {parallelTasks.length > 0 && (
            <div className="p-3 rounded-lg bg-violet-50/70 border border-violet-200 dark:bg-violet-950/30 dark:border-violet-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-violet-900 dark:text-violet-200">
                <GitBranch className="w-3.5 h-3.5 text-violet-600" />
                HQ Parallel Vetting Clearance Status:
              </div>
              <div className="flex flex-wrap gap-2">
                {parallelTasks.map((task) => (
                  <span
                    key={task.review_task_id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                      task.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : task.status === 'rejected'
                        ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    <span className="font-semibold">{task.role.replace(/_/g, ' ')}:</span>
                    <span className="capitalize">{task.status === 'approved' ? 'Cleared' : task.status}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clean Executive Vertical Timeline */}
          <div className="space-y-8">
            {/* CURRENT ACTIVE STAGE NODE */}
            <div className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider font-mono">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>{currentDateHeader}</span>
                <span className="text-muted-foreground text-[10px]">&bull; Active Stage</span>
              </div>

              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-sky-300 dark:before:bg-sky-800">
                <div className="absolute -left-[3px] top-1.5 w-3 h-3 rounded-full bg-sky-600 ring-4 ring-sky-100 dark:ring-sky-950" />

                {/* Stage Title & Description */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-foreground">
                      Stage {currentIndex + 1}: {currentStageObj?.label || 'Active Stage'}
                    </span>
                    <Badge variant="default" className="bg-sky-600 text-white text-[10px] uppercase font-bold px-2 py-0.5">
                      Current Stage
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Initial proposal drafting, title clearance verification, and compliance assembly in progress.
                  </p>
                </div>

                {/* Assigned Official Profile */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 text-xs flex items-center gap-2.5">
                  <span className="text-muted-foreground font-medium">Assigned Official / Role: </span>
                  <UserInfoBadge
                    user={snapshot?.assignments?.[currentIndex]?.assignedUser || snapshot?.assignments?.[0]?.assignedUser}
                    role={snapshot?.assignments?.[currentIndex]?.assignedRole || userRole}
                  />
                </div>

                {/* Simple Pending / Completed Work List */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pending Work &amp; Action Items ({pendingActions.length})</span>
                  </div>

                  {pendingActions.length === 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All active stage prerequisites complete! You may execute available workflow transitions.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingActions.map((pending: any) => {
                        const isPlot = pending.code === 'ADD_PLOT_SCHEDULE'
                        const isChecklist = pending.code === 'INITIAL_CHECKLIST'
                        const targetTab = pending.metadata?.targetTab || (isPlot ? 'plots' : 'checklist')
                        const isDone = pending.status === 'COMPLETED'

                        return (
                          <div
                            key={pending.id}
                            className={cn(
                              'p-3 rounded-lg border flex items-center justify-between gap-3 text-xs transition-colors',
                              isDone
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : 'bg-card border-border hover:border-muted-foreground/40'
                            )}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                {isDone ? (
                                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2">
                                    ✓ COMPLETED
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold px-1.5 py-0.2">
                                    PENDING
                                  </Badge>
                                )}
                                <span className="truncate">{pending.label}</span>
                              </div>
                              {pending.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1">{pending.description}</p>
                              )}
                            </div>

                            {!isDone && onSelectTab && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2.5 shrink-0 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                                onClick={() => onSelectTab(targetTab)}
                              >
                                {isPlot ? 'Add Plots' : isChecklist ? 'View Rules' : 'Open Workspace'}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Available Transition Action Buttons */}
                {availableTransitions.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                      Available Workflow Transition Actions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableTransitions.map((t: any) => (
                        <Button
                          key={t.transitionId || t.name}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3 shadow-xs gap-1.5"
                          onClick={() => onExecuteTransition && onExecuteTransition(t)}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COMPLETED HISTORY NODES BY DATE */}
            {Object.keys(groupedHistory).length > 0 && (
              <div className="space-y-6 pt-4 border-t border-border/60">
                {Object.entries(groupedHistory).map(([dateGroup, items]) => (
                  <div key={dateGroup} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dateGroup}</span>
                    </div>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-emerald-300 dark:before:bg-emerald-800">
                      {items.map((item) => {
                        const actorName = item.user?.name || item.user_name_label || 'Authorized Officer'
                        const actorDesignation = item.user?.designation || item.user_role_label || 'Officer'
                        const formattedTime = formatTimeLabel(item.entry_ts)
                        const isReturn = item.action.toLowerCase().includes('return') || item.action.toLowerCase().includes('reject')
                        const initials = getInitials(actorName)

                        return (
                          <div key={item.wah_id} className="relative space-y-2">
                            <div className="absolute -left-[3px] top-1.5 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950" />

                            {/* Action Header & Officer */}
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  isReturn
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                }`}>
                                  {item.action.replace(/_/g, ' ')}
                                </span>
                                {item.from_state && item.to_state && (
                                  <span className="text-xs text-muted-foreground">
                                    {item.from_state} &rarr; <strong className="text-foreground">{item.to_state}</strong>
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground">{formattedTime}</span>
                            </div>

                            {/* Officer Profile */}
                            <div className="p-2 rounded bg-muted/20 border border-border/50 text-xs flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[10px] font-bold bg-sky-100 text-sky-900">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="font-semibold text-foreground">{actorName}</span>
                                  <span className="text-muted-foreground text-[11px]"> ({actorDesignation})</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                                ✓ COMPLETED
                              </Badge>
                            </div>

                            {/* FORWARD ACTION DETAILS */}
                            {/* 1. Justification / Remarks */}
                            {item.comments && (
                              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-xs space-y-1">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Justification / Review Remarks</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 italic pl-5">
                                  &ldquo;{item.comments}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* 2. Attached Files */}
                            {item.attachment && (
                              <div className="pt-1">
                                <a
                                  href={`/api/documents/${item.attachment.id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition-colors font-medium text-xs dark:bg-sky-950/40 dark:text-sky-300"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Attached Document: [{item.attachment.original_name}]</span>
                                  <Download className="w-3.5 h-3.5 ml-1 text-sky-600" />
                                </a>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
