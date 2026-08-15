'use client'

import * as React from 'react'
import { BackButton } from '@/shared/components/ui/back-button'
import { Badge } from '@/shared/components/ui/badge'
import { StateBadge, EntityFileManagerTrigger } from '@/shared/components/coalrr'
import { ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'
import { MODE_META, ScheduleDetail } from '../../types'

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
      {/* Clean Seamless Top Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <BackButton variant="outline" className="shrink-0" />
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">{schedule.proposal_title}</h1>
              <StateBadge state={schedule.state} size="md" />
              <Badge variant="outline" className={`font-mono text-xs font-semibold ${mode.color}`}>
                {mode.checklistCode} &bull; {mode.label}
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
            label="Proposal Document Files &amp; Tags"
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}
