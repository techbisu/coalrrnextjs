'use client'

import * as React from 'react'
import Link from 'next/link'
import { Building2, Calendar, Layers, MapPin, Info } from 'lucide-react'
import { BackButton } from '@/shared/components/ui/back-button'
import { Badge } from '@/shared/components/ui/badge'
import { StateBadge, CollapsibleSectionCard, EntityFileManagerTrigger } from '@/shared/components/coalrr'
import { ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'
import { formatNumber } from '@/lib/utils/formatters'
import { MODE_META, ScheduleDetail } from '../../types'

function MetaItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/20 border border-border/40">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="truncate text-xs font-semibold text-foreground">{value}</div>
      </div>
    </div>
  )
}

export interface ProposalHeaderBarProps {
  schedule: ScheduleDetail
}

export function ProposalHeaderBar({ schedule }: ProposalHeaderBarProps) {
  const mode = MODE_META[schedule.acq_mode_id] ?? {
    label: schedule.acq_mode_id.toString(),
    checklistCode: 'CL-1',
    color: 'border-slate-300 bg-slate-50 text-slate-700',
  }

  return (
    <div className="space-y-4">
      {/* Clean Seamless Top Page Header (No Outer Card Box) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <BackButton variant="outline" className="shrink-0" />
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">{schedule.proposal_title}</h1>
              <StateBadge state={schedule.state} size="md" />
              <Badge variant="outline" className={`font-mono text-xs font-semibold ${mode.color}`}>
                {mode.checklistCode} · {mode.label}
              </Badge>
            </div>
            {schedule.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-4xl">{schedule.description}</p>
            )}
          </div>
        </div>

        {/* Repository File Trigger */}
        <div className="shrink-0">
          <EntityFileManagerTrigger
            entityType={ACQ_LAND_SCHEDULE}
            entityId={schedule.id}
            label="Proposal Document Files & Tags"
            size="sm"
          />
        </div>
      </div>

      {/* Expandable Collapsible Metadata Details */}
      <CollapsibleSectionCard
        title="Proposal Metadata & Administrative Specs"
        subtitle={`Project: ${schedule.projectName || '—'} · Total Area: ${formatNumber(schedule.total_area_acres, 4)} acres`}
        icon={Info}
        defaultOpen={false}
        badge={
          <Badge variant="secondary" className="text-[10px] font-mono">
            {schedule.schedule_code || `PROP-${schedule.id.slice(0, 8)}`}
          </Badge>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem
            icon={Building2}
            label="Project Master"
            value={
              <Link href={`/projects/${schedule.project_id}`} className="text-sky-600 hover:underline font-semibold">
                {schedule.projectName}
              </Link>
            }
          />
          <MetaItem
            icon={MapPin}
            label="Area Office / Colliery"
            value={
              schedule.mine_cd
                ? `${schedule.area_office || '—'} · ${schedule.mine_cd}`
                : schedule.area_office || '—'
            }
          />
          <MetaItem
            icon={Calendar}
            label="Gazette Notification Date"
            value={
              schedule.notification_date
                ? new Date(schedule.notification_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Under Review'
            }
          />
          <MetaItem
            icon={Layers}
            label="Schedule Total Area"
            value={`${formatNumber(schedule.total_area_acres, 4)} Acres`}
          />
        </div>
      </CollapsibleSectionCard>
    </div>
  )
}
