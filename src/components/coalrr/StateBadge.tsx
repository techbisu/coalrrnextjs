'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FileEdit, Send, ShieldCheck, GitBranch, UserCheck, Award, CheckCircle2, AlertTriangle, Circle } from 'lucide-react'

export interface StateMeta {
  label: string
  color?: string
  icon?: string
  description?: string
}

export const DEFAULT_STATE_META: Record<string, StateMeta> = {
  Drafting:             { label: 'Drafting',             color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300', icon: 'FileEdit' },
  UnitSubmitted:        { label: 'Unit Submitted',       color: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300',         icon: 'Send' },
  AreaVetting:          { label: 'Area Vetting',         color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300', icon: 'ShieldCheck' },
  HqParallelVetting:    { label: 'HQ Parallel Vetting',  color: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950 dark:text-violet-300', icon: 'GitBranch' },
  DirectorConsent:      { label: 'Director Consent',     color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-950 dark:text-fuchsia-300', icon: 'UserCheck' },
  CmdApproved:          { label: 'CMD Approved',         color: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300',     icon: 'Award' },
  Published:            { label: 'Published',            color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300', icon: 'CheckCircle2' },
  BoardEscalation:      { label: 'Board Escalation',     color: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300',     icon: 'AlertTriangle' },
  TitleScrutiny:        { label: 'Title Scrutiny',       color: 'bg-amber-100 text-amber-700 border-amber-300', icon: 'ShieldCheck' },
  TransparencyWindow:   { label: 'Transparency Window',  color: 'bg-sky-100 text-sky-700 border-sky-300', icon: 'Clock' },
  Cl4Checklist:         { label: 'CL-4 Checklist',       color: 'bg-amber-100 text-amber-700 border-amber-300', icon: 'ListChecks' },
  pending:              { label: 'Pending',              color: 'bg-slate-100 text-slate-700 border-slate-300', icon: 'Circle' },
  approved:             { label: 'Approved',             color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: 'CheckCircle2' },
  rejected:             { label: 'Rejected',             color: 'bg-rose-100 text-rose-700 border-rose-300', icon: 'X' },
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileEdit, Send, ShieldCheck, GitBranch, UserCheck, Award, CheckCircle2, AlertTriangle, Circle,
  Clock: ShieldCheck, ListChecks: ShieldCheck, X: AlertTriangle,
}

export interface StateBadgeProps {
  state: string
  meta?: StateMeta
  size?: 'sm' | 'md'
  className?: string
}

export function StateBadge({ state, meta, size = 'sm', className }: StateBadgeProps) {
  const m = meta ?? DEFAULT_STATE_META[state] ?? { label: state, color: 'bg-slate-100 text-slate-700 border-slate-300' }
  const Icon = ICONS[m.icon ?? ''] ?? Circle
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border',
        m.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {m.label}
    </Badge>
  )
}
