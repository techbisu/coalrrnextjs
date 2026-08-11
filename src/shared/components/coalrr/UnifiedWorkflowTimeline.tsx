'use client'

import * as React from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Clock, CheckCircle2, Circle, ArrowRight, Paperclip, Download, MessageSquare,
  GitBranch, User, MapPin, Building2, Phone, Mail, ChevronDown, ChevronUp, History, Sparkles, Check
} from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/lib/utils'

export interface StageStep {
  code: string
  label: string
  status: 'done' | 'current' | 'pending' | 'skipped'
  order?: number
}

export interface UnifiedWorkflowTimelineProps {
  moduleCode: string
  entityId: string
  stages?: StageStep[]
  maxHeight?: number | string
  defaultOpen?: boolean
  className?: string
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

function formatDateTimeLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const dateFormatted = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeFormatted = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${dateFormatted}, ${timeFormatted}`
  } catch {
    return dateStr
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
  stages = [],
  maxHeight = 550,
  defaultOpen = true,
  className = '',
}: UnifiedWorkflowTimelineProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

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

  return (
    <div className={cn('rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-200 overflow-hidden', className)}>
      {/* Header Bar with Collapsible Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3.5 bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors select-none border-b border-border/60"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground truncate">Workflow Stage Progress &amp; Audit Feed</span>
              <Badge variant="outline" className="text-[10px] font-mono bg-background">
                {moduleCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {history.length} Action Event{history.length === 1 ? '' : 's'} Recorded
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-muted-foreground">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="sr-only">Toggle Workflow Timeline</span>
        </Button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-5 animate-in fade-in-50 duration-200" style={{ maxHeight, overflowY: 'auto' }}>
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

              {/* Numbered Stepper Track with Connected Progress Bar */}
              <div className="relative flex items-center justify-between px-2 pt-1 pb-2">
                {/* Background Connecting Line */}
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

          {/* Unified Timeline Action Feed */}
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/10 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 mx-auto dark:bg-sky-950 dark:text-sky-300">
                <History className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No Action History Recorded Yet</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Initial proposal drafting is in progress. As actions, recommendations, and statutory clearances are completed, they will appear here chronologically.
              </p>
            </div>
          ) : (
            <div className="relative pl-7 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {history.map((item) => {
                const actorName = item.user?.name || item.user_name_label || 'Authorized Officer'
                const actorDesignation = item.user?.designation || item.user_role_label || 'Officer'
                const formattedTime = formatDateTimeLabel(item.entry_ts)
                const isReturn = item.action.toLowerCase().includes('return') || item.action.toLowerCase().includes('reject')
                const initials = getInitials(actorName)

                return (
                  <div key={item.wah_id} className="relative group animate-in fade-in-50 duration-300">
                    {/* Interactive User Avatar Popover Tooltip */}
                    <div className="absolute -left-[29px] top-0 shrink-0">
                      <Popover>
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <button className="focus:outline-none ring-offset-background transition-transform active:scale-95 cursor-pointer">
                                  <Avatar className="h-6 w-6 border-2 border-background shadow-xs ring-1 ring-border">
                                    <AvatarFallback className="text-[10px] font-bold bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                </button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">
                              Click to view {actorName} details
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <PopoverContent side="right" className="w-72 p-3 text-xs space-y-2 border border-border shadow-xl">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs font-bold bg-sky-600 text-white">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-foreground text-sm leading-tight">{actorName}</p>
                              <p className="text-muted-foreground text-[11px] font-medium">{actorDesignation}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-muted-foreground pt-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                              <span>Area Office: <strong className="text-foreground">{item.user?.area_name || 'ECL HQ / Area Office'}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                              <span>Mine / Unit: <strong className="text-foreground">{item.user?.colliery_name || 'Colliery Office'}</strong></span>
                            </div>
                            {item.user?.mobile && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                <span>Mobile: <strong className="text-foreground">{item.user.mobile}</strong></span>
                              </div>
                            )}
                            {item.user?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                                <span className="truncate">{item.user.email}</span>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Main Action Feed Details */}
                    <div className="space-y-1.5 text-xs bg-card p-3 rounded-lg border border-border/60 hover:border-border transition-all">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <span className="font-semibold">{actorName}</span>
                          <span className="text-muted-foreground">({actorDesignation})</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">{formattedTime}</span>
                      </div>

                      {/* Action Pill & Transition Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          isReturn
                            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}>
                          {item.action.replace(/_/g, ' ')}
                        </span>

                        {item.from_state && item.to_state && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border">
                            <span>{item.from_state}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{item.to_state}</span>
                          </div>
                        )}

                        {item.target_recipient_label && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded border border-border">
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            {item.target_recipient_label}
                          </span>
                        )}
                      </div>

                      {/* Justification Comment */}
                      {item.comments && (
                        <div className="p-2 rounded bg-muted/30 border border-border/60 text-foreground leading-relaxed italic flex items-start gap-1.5 mt-1">
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold not-italic text-foreground mr-1">Comment:</span>
                            &ldquo;{item.comments}&rdquo;
                          </div>
                        </div>
                      )}

                      {/* Attached File */}
                      {item.attachment && (
                        <div className="pt-1">
                          <a
                            href={`/api/documents/${item.attachment.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition-colors font-medium text-[11px] dark:bg-sky-950/40 dark:text-sky-300"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                            <span>Attachment: [{item.attachment.original_name}]</span>
                            <Download className="w-3 h-3 ml-1 text-sky-600" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
