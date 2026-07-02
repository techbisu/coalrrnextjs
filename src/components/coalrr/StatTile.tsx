'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export type Accent = 'amber' | 'emerald' | 'rose' | 'slate' | 'violet' | 'teal'

const ACCENT_STYLES: Record<Accent, { bg: string; text: string; ring: string }> = {
  amber:   { bg: 'bg-amber-100 dark:bg-amber-950/60',    text: 'text-amber-700 dark:text-amber-300',    ring: 'ring-amber-200 dark:ring-amber-900' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-950/60',text: 'text-emerald-700 dark:text-emerald-300',ring: 'ring-emerald-200 dark:ring-emerald-900' },
  rose:    { bg: 'bg-rose-100 dark:bg-rose-950/60',      text: 'text-rose-700 dark:text-rose-300',      ring: 'ring-rose-200 dark:ring-rose-900' },
  slate:   { bg: 'bg-slate-100 dark:bg-slate-800/60',    text: 'text-slate-700 dark:text-slate-300',    ring: 'ring-slate-200 dark:ring-slate-700' },
  violet:  { bg: 'bg-violet-100 dark:bg-violet-950/60',  text: 'text-violet-700 dark:text-violet-300',  ring: 'ring-violet-200 dark:ring-violet-900' },
  teal:    { bg: 'bg-teal-100 dark:bg-teal-950/60',      text: 'text-teal-700 dark:text-teal-300',      ring: 'ring-teal-200 dark:ring-teal-900' },
}

export interface StatTileProps {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: Accent
  trend?: { value: string; direction: 'up' | 'down' }
  sublabel?: string
}

export function StatTile({ label, value, icon: Icon, accent = 'slate', trend, sublabel }: StatTileProps) {
  const a = ACCENT_STYLES[accent]
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
          {trend && (
            <div className={cn('mt-2 inline-flex items-center gap-1 text-xs font-medium',
              trend.direction === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
              {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1', a.bg, a.text, a.ring)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
