'use client'

import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, Circle, Clock, Snowflake, AlertTriangle, ChevronRight,
} from 'lucide-react'

export interface TimelineNode {
  state: string
  label: string
  status: 'done' | 'current' | 'pending' | 'skipped' | 'frozen'
  timestamp?: string
  actor?: string
  note?: string
  isBranch?: boolean
}

export interface StatusTimelineProps {
  nodes: TimelineNode[]
  className?: string
  maxheight?: number
}

export function StatusTimeline({ nodes, className, maxheight = 480 }: StatusTimelineProps) {
  return (
    <ScrollArea className={cn('pr-3', className)} style={{ maxHeight: maxheight }}>
      <ol className="relative space-y-1">
        {/* vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
        {nodes.map((node, i) => {
          const Icon = NODE_ICON[node.status]
          const isLast = i === nodes.length - 1
          return (
            <li
              key={`${node.state}-${i}`}
              className={cn(
                'relative flex gap-3 rounded-md px-1 py-2 transition',
                node.status === 'current' && 'bg-amber-50/60 dark:bg-amber-950/20',
                node.status === 'frozen' && 'bg-sky-50/40 dark:bg-sky-950/20',
              )}
            >
              <div className={cn(
                'z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background',
                NODE_RING[node.status],
                node.status === 'current' && 'ring-4 ring-amber-100 dark:ring-amber-950',
              )}>
                <Icon className={cn('h-4 w-4', NODE_ICON_COLOR[node.status])} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm font-medium',
                      node.status === 'pending' && 'text-muted-foreground',
                      node.status === 'done' && 'text-foreground',
                      node.status === 'current' && 'text-foreground',
                    )}>
                      {node.label}
                    </span>
                    {node.isBranch && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        <AlertTriangle className="h-2.5 w-2.5" /> branch
                      </span>
                    )}
                    {node.status === 'frozen' && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        <Snowflake className="h-2.5 w-2.5" /> frozen
                      </span>
                    )}
                  </div>
                  {node.timestamp && (
                    <span className="text-[11px] tabular-nums text-muted-foreground">{node.timestamp}</span>
                  )}
                </div>
                {node.actor && (
                  <p className="text-xs text-muted-foreground">by {node.actor}</p>
                )}
                {node.note && (
                  <p className="mt-0.5 text-xs italic text-muted-foreground/80">{node.note}</p>
                )}
                {node.status === 'current' && !isLast && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                    <Clock className="h-3 w-3" /> In progress
                    <ChevronRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </ScrollArea>
  )
}

const NODE_ICON = {
  done: CheckCircle2,
  current: Clock,
  pending: Circle,
  skipped: AlertTriangle,
  frozen: Snowflake,
} as const

const NODE_RING = {
  done: 'border-emerald-400',
  current: 'border-amber-500',
  pending: 'border-border',
  skipped: 'border-slate-300',
  frozen: 'border-sky-400',
} as const

const NODE_ICON_COLOR = {
  done: 'text-emerald-600',
  current: 'text-amber-600',
  pending: 'text-muted-foreground/50',
  skipped: 'text-slate-400',
  frozen: 'text-sky-600',
} as const
