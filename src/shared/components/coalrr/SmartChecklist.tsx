'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, Circle, Clock, AlertCircle, FileText, ChevronRight, Lock, PenTool, Edit3, ShieldCheck, ExternalLink,
} from 'lucide-react'

export type ChecklistItemStatus = 'pending' | 'in_progress' | 'complete' | 'skipped'

export interface StepDetail {
  type: 'GENERATE' | 'ADDITIONAL_INFO' | 'REVIEW' | 'SIGN'
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'LOCKED'
  permission?: string
  label: string
}

export interface NextActionInfo {
  type: 'GENERATE' | 'ADDITIONAL_INFO' | 'REVIEW' | 'SIGN'
  permission?: string
  label: string
  canCurrentUserAct?: boolean
}

export interface ChecklistItem {
  key: string
  ruleId?: string
  label: string
  required?: boolean
  status: ChecklistItemStatus
  type?: string
  generatedDocInfo?: {
    instanceId?: string
    templateCode: string
    status: 'PENDING' | 'DRAFT' | 'INCOMPLETE' | 'COMPLETED'
    generatedDocId?: string
    stepDetails?: StepDetail[]
    nextAction?: NextActionInfo
  }
  document_id?: string
  helpText?: string
}

export interface SmartChecklistProps {
  items: ChecklistItem[]
  code?: string
  title?: string
  description?: string
  /** "Forward" button label, shown when enabled */
  forwardLabel?: string
  onForward?: () => void
  /** Hide the forward button entirely (read-only mode) */
  hideForward?: boolean
  onViewDocument?: (item: ChecklistItem) => void
  onGenerateDocument?: (item: ChecklistItem) => void
  onRegenerateDocument?: (item: ChecklistItem) => void
  onContinueDraft?: (item: ChecklistItem) => void
  onOpenWorkspace?: (item: ChecklistItem) => void
  onReviewDocument?: (item: ChecklistItem) => void
  onSignDocument?: (item: ChecklistItem) => void
  onFillAdditionalInfo?: (item: ChecklistItem) => void
  className?: string
}

const STATUS_ICON: Record<ChecklistItemStatus, React.ReactNode> = {
  complete: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  in_progress: <Clock className="h-5 w-5 text-amber-600" />,
  pending: <Circle className="h-5 w-5 text-muted-foreground/60" />,
  skipped: <AlertCircle className="h-5 w-5 text-slate-400" />,
}

export function SmartChecklist({
  items,
  code,
  title = 'Checklist',
  description,
  forwardLabel = 'Forward',
  onForward,
  hideForward,
  onViewDocument,
  onGenerateDocument,
  onRegenerateDocument,
  onContinueDraft,
  onOpenWorkspace,
  onReviewDocument,
  onSignDocument,
  onFillAdditionalInfo,
  className,
}: SmartChecklistProps) {
  const requiredItems = items.filter((i) => i.required)
  const completedRequired = requiredItems.filter((i) => i.status === 'complete').length
  const allRequiredDone = completedRequired === requiredItems.length
  const totalComplete = items.filter((i) => i.status === 'complete').length
  const percent = items.length === 0 ? 0 : Math.round((totalComplete / items.length) * 100)

  const missingLabels = requiredItems
    .filter((i) => i.status !== 'complete')
    .map((i) => i.label)

  return (
    <Card className={cn('border-border/60 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {code && <Badge variant="outline" className="font-mono text-xs">{code}</Badge>}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums">
              {completedRequired} / {requiredItems.length} <span className="text-xs font-normal text-muted-foreground">required</span>
            </div>
            <div className="text-xs text-muted-foreground">{percent}% overall</div>
          </div>
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <Progress value={percent} className="mt-2 h-1.5" indicatorClassName={allRequiredDone ? 'bg-emerald-500' : 'bg-amber-500'} />
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2.5 transition',
              item.status === 'complete' && 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100',
              item.status === 'in_progress' && 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-100',
            )}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="mt-0.5 shrink-0">{STATUS_ICON[item.status]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-sm font-medium', item.status === 'complete' ? 'text-foreground line-through decoration-emerald-400/60' : 'text-foreground')}>
                    {item.label}
                  </span>
                  {item.required && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] uppercase">required</Badge>
                  )}
                </div>

                {/* Step Progress Pills for generated_document */}
                {item.type === 'generated_document' && item.generatedDocInfo?.stepDetails && (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {item.generatedDocInfo.stepDetails.map((st, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0 font-normal h-4 gap-1',
                          st.status === 'COMPLETED' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          st.status === 'PENDING' && 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
                          st.status === 'LOCKED' && 'bg-slate-100 text-slate-400 border-slate-200',
                        )}
                      >
                        {st.status === 'COMPLETED' ? '✓' : st.status === 'LOCKED' ? '🔒' : '⏳'} {st.type}
                      </Badge>
                    ))}
                  </div>
                )}

                {item.helpText && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.helpText}</p>
                )}
              </div>
            </div>

            {/* Direct Action Buttons Surface */}
            {item.type === 'generated_document' && item.generatedDocInfo ? (
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                {/* Next Action Direct Execution */}
                {item.generatedDocInfo.nextAction ? (
                  item.generatedDocInfo.nextAction.canCurrentUserAct !== false ? (
                    item.generatedDocInfo.nextAction.type === 'GENERATE' && (onGenerateDocument || onContinueDraft) ? (
                      <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 shadow-sm" onClick={() => (onGenerateDocument || onContinueDraft)!(item)}>
                        <PenTool className="h-3.5 w-3.5" /> Generate
                      </Button>
                    ) : item.generatedDocInfo.nextAction.type === 'ADDITIONAL_INFO' && (onFillAdditionalInfo || onOpenWorkspace) ? (
                      <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 shadow-sm bg-blue-600 hover:bg-blue-700" onClick={() => (onFillAdditionalInfo || onOpenWorkspace)!(item)}>
                        <Edit3 className="h-3.5 w-3.5" /> Fill Info
                      </Button>
                    ) : item.generatedDocInfo.nextAction.type === 'REVIEW' && (onReviewDocument || onOpenWorkspace) ? (
                      <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 shadow-sm bg-purple-600 hover:bg-purple-700" onClick={() => (onReviewDocument || onOpenWorkspace)!(item)}>
                        <ShieldCheck className="h-3.5 w-3.5" /> Review
                      </Button>
                    ) : item.generatedDocInfo.nextAction.type === 'SIGN' && (onSignDocument || onOpenWorkspace) ? (
                      <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700" onClick={() => (onSignDocument || onOpenWorkspace)!(item)}>
                        <PenTool className="h-3.5 w-3.5" /> Sign
                      </Button>
                    ) : null
                  ) : (
                    <Badge variant="outline" className="text-[11px] text-amber-700 bg-amber-50 border-amber-200 py-1">
                      Awaiting Authorized {item.generatedDocInfo.nextAction.type === 'REVIEW' ? 'Reviewer' : 'Signer'}
                    </Badge>
                  )
                ) : null}

                {/* Workspace Modal Trigger (Hybrid Surface) */}
                {(onOpenWorkspace || onContinueDraft) && (
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => (onOpenWorkspace || onContinueDraft)!(item)}>
                    <ExternalLink className="h-3.5 w-3.5" /> Workspace
                  </Button>
                )}

                {item.generatedDocInfo.status === 'COMPLETED' && onViewDocument && (
                  <Button variant="secondary" size="sm" className="h-8 text-xs gap-1" onClick={() => onViewDocument(item)}>
                    <FileText className="h-3.5 w-3.5" /> View
                  </Button>
                )}
              </div>
            ) : (
              item.document_id && onViewDocument && (
                <Button variant="secondary" size="sm" onClick={() => onViewDocument(item)} className="shrink-0 h-8 text-xs">
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> View
                </Button>
              )
            )}
          </div>
        ))}

        {!hideForward && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              {allRequiredDone
                ? 'All required items satisfied — ready to proceed.'
                : `Awaiting: ${missingLabels.slice(0, 2).join(', ')}${missingLabels.length > 2 ? '…' : ''}`}
            </p>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={onForward}
                      disabled={!allRequiredDone}
                      className={cn(allRequiredDone && 'bg-emerald-600 hover:bg-emerald-700')}
                    >
                      {forwardLabel}
                      {allRequiredDone ? <ChevronRight className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!allRequiredDone && (
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">Cannot proceed</p>
                    <p className="mt-1 text-xs">Complete all required items first:</p>
                    <ul className="mt-1 list-disc pl-4 text-xs">
                      {missingLabels.map((l) => <li key={l}>{l}</li>)}
                    </ul>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
