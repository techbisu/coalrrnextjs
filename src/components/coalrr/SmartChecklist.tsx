'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, Circle, Clock, AlertCircle, FileText, ChevronRight, Lock,
} from 'lucide-react'

export type ChecklistItemStatus = 'pending' | 'in_progress' | 'complete' | 'skipped'

export interface ChecklistItem {
  key: string
  label: string
  required?: boolean
  status: ChecklistItemStatus
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

      <CardContent className="space-y-1.5 pt-0">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              'flex items-start gap-3 rounded-md border border-transparent px-2.5 py-2 transition',
              item.status === 'complete' && 'bg-emerald-50/50 dark:bg-emerald-950/20',
              item.status === 'in_progress' && 'bg-amber-50/50 dark:bg-amber-950/20',
            )}
          >
            <div className="mt-0.5 shrink-0">{STATUS_ICON[item.status]}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm', item.status === 'complete' ? 'text-foreground line-through decoration-emerald-400/60' : 'text-foreground')}>
                  {item.label}
                </span>
                {item.required && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] uppercase">required</Badge>
                )}
              </div>
              {item.helpText && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.helpText}</p>
              )}
            </div>
            {item.document_id && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => onViewDocument?.(item)}
              >
                <FileText className="h-3 w-3" />
                View
              </Button>
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
