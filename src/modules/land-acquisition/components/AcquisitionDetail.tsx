import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, Layers, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StateBadge } from '@/components/coalrr'
import { formatNumber } from '@/lib/utils/formatters'
import { MODE_META, ScheduleDetail } from '../types'
import { AcquisitionDetailTabs } from './AcquisitionDetailTabs'

function MetaItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function AcquisitionDetail({ schedule }: { schedule: ScheduleDetail }) {
  const mode = MODE_META[schedule.acquisition_mode] ?? {
    label: schedule.acquisition_mode, checklistCode: 'CL-1', color: 'border-slate-300 bg-slate-50 text-slate-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="sm" asChild className="mt-0.5">
            <Link href="/proposals">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{schedule.proposal_title}</h2>
              <StateBadge state={schedule.state} size="md" />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{schedule.schedule_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-mono text-xs ${mode.color}`}>
            {mode.checklistCode} · {mode.label}
          </Badge>
        </div>
      </div>

      {/* Proposal meta strip */}
      <div className="grid gap-3 rounded-lg border border-border/60 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem icon={Building2} label="Project" value={schedule.projectName} />
        <MetaItem icon={MapPin} label="Area Office / Colliery" value={`${schedule.area_office || '—'} · ${schedule.colliery_code || '—'}`} />
        <MetaItem icon={Calendar} label="Notification Date" value={schedule.notification_date ? new Date(schedule.notification_date).toLocaleDateString('en-IN') : '—'} />
        <MetaItem icon={Layers} label="Total Area" value={`${formatNumber(schedule.total_area_acres, 4)} acres`} />
      </div>

      {/* Interactive Client Leaf containing the Tabs */}
      <AcquisitionDetailTabs schedule={schedule} />
    </div>
  )
}
