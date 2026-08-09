'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  User, Clock, FileText, CheckCircle2, AlertCircle, ArrowRight,
  Download, Paperclip, MessageSquare, ChevronRight, ShieldCheck, GitBranch, Layers
} from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

export interface WorkflowTimelineFeedProps {
  moduleCode: string;       // e.g. 'LAND_SCHEDULE', 'COMPENSATION_PAYROLL', 'EMPLOYMENT_APP'
  entityId: string;         // e.g. proposalId, claimId
  maxHeight?: number | string;
  className?: string;
  showParallelTasks?: boolean;
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

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
    return `${dateFormatted}, ${timeFormatted}`
  } catch {
    return dateStr
  }
}

function getRoleLabel(roleName?: string): string {
  if (!roleName) return 'Officer'
  const map: Record<string, string> = {
    unit_office: 'Unit Officer',
    adjacent_colliery: 'Adjacent Colliery Officer',
    area_office: 'Area Officer',
    gm_planning: 'GM Planning',
    gm_safety: 'GM Safety',
    gm_finance: 'GM Finance',
    hod_legal: 'HOD Legal',
    gm_lre: 'GM (LRE)',
    board: 'Board Member',
  }
  return map[roleName] ?? roleName
}

export function WorkflowTimelineFeed({
  moduleCode,
  entityId,
  maxHeight = 520,
  className = '',
  showParallelTasks = true,
}: WorkflowTimelineFeedProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['workflow', 'history', moduleCode, entityId],
    queryFn: async () => {
      const res = await fetch(`/api/workflow/${moduleCode}/${entityId}/history`)
      if (!res.ok) throw new Error('Failed to load workflow history')
      const json = await res.json()
      return json as {
        history: WorkflowHistoryItem[]
        parallelTasks: ParallelReviewTask[]
      }
    },
    enabled: Boolean(moduleCode && entityId),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
        Failed to load workflow timeline feed.
      </div>
    )
  }

  const { history = [], parallelTasks = [] } = data

  return (
    <Card className={`border shadow-sm bg-white overflow-hidden ${className}`}>
      <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Workflow Audit Timeline Feed
        </CardTitle>
        <Badge variant="outline" className="text-xs font-mono bg-slate-100 text-slate-700">
          {moduleCode}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-6 overflow-y-auto" style={{ maxHeight }}>
        {/* Parallel Tasks Overview (if active) */}
        {showParallelTasks && parallelTasks.length > 0 && (
          <div className="p-3 rounded-md bg-purple-50/80 border border-purple-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-purple-900">
              <GitBranch className="w-3.5 h-3.5 text-purple-600" />
              HQ Parallel Department Clearance Status:
            </div>
            <div className="flex flex-wrap gap-2">
              {parallelTasks.map((task) => (
                <span
                  key={task.review_task_id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                    task.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : task.status === 'rejected'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <span className="font-semibold">{getRoleLabel(task.role)}:</span>
                  <span className="capitalize">{task.status === 'approved' ? 'Recommended' : task.status === 'pending' ? 'Awaiting' : task.status}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Feed Stream */}
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm italic">
            No history recorded yet for this record.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((item) => {
              const actorName = item.user?.name || item.user_name_label || 'Authorized User'
              const actorDesignation = item.user?.designation || item.user_role_label || 'Officer'
              const formattedTime = formatDateLabel(item.entry_ts)

              return (
                <div key={item.wah_id} className="relative group">
                  {/* Icon Node Badge */}
                  <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full border-2 border-white bg-emerald-600 shadow-sm flex items-center justify-center ring-2 ring-emerald-100" />

                  <div className="space-y-1.5 text-xs">
                    {/* Header Row: Date - Actor */}
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span className="text-slate-500 font-normal">{formattedTime}</span>
                      <span>—</span>
                      <span className="font-semibold text-slate-900">{actorName}</span>
                      <span className="text-slate-500">({actorDesignation})</span>
                    </div>

                    {/* Action & Target Recipient */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.action.replace(/_/g, ' ')}
                      </span>
                      {item.target_recipient_label && (
                        <span className="text-slate-600 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          {item.target_recipient_label}
                        </span>
                      )}
                    </div>

                    {/* Annexure Notes (if present) */}
                    {item.annexure_notes && (
                      <div className="p-2 rounded bg-amber-50/90 border border-amber-200 text-amber-900 font-mono text-[11px] leading-relaxed">
                        <span className="font-semibold text-amber-950">Annexure:</span> {item.annexure_notes}
                      </div>
                    )}

                    {/* Justification Text Area */}
                    {item.comments && (
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed italic flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold not-italic text-slate-900 mr-1">Justification:</span>
                          &ldquo;{item.comments}&rdquo;
                        </div>
                      </div>
                    )}

                    {/* Recommendations Checklist Choices */}
                    {item.recommendations_json && Array.isArray(item.recommendations_json) && item.recommendations_json.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.recommendations_json.map((rec: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] font-normal">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-sky-600 inline" />
                            {typeof rec === 'string' ? rec : rec.label || JSON.stringify(rec)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Attached Supporting Documents */}
                    {item.attachment && (
                      <div className="pt-1">
                        <a
                          href={`/api/documents/${item.attachment.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors font-medium text-[11px]"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Docs: [{item.attachment.original_name}]</span>
                          <Download className="w-3 h-3 ml-1 text-emerald-600" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
