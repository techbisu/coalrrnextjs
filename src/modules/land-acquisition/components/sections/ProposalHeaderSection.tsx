'use client'

import * as React from 'react'
import { ProcessActionCenter, EntityFileManagerTrigger } from '@/shared/components/coalrr'
import { ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'

export interface ProposalHeaderSectionProps {
  schedule: {
    id: string
    schedule_code: string
    state: string
  }
  userRole?: string
  checklistSummary?: {
    total: number
    completed: number
    isComplete: boolean
  }
  onExecuteAction?: () => void
  onOpenDocumentWorkspace?: (templateCode: string) => void
}

export function ProposalHeaderSection({
  schedule,
  userRole = 'unit_office',
  checklistSummary,
  onExecuteAction,
  onOpenDocumentWorkspace,
}: ProposalHeaderSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card p-3 border rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Proposal Document Repository</span>
        </div>
        <EntityFileManagerTrigger
          entityType={ACQ_LAND_SCHEDULE}
          entityId={schedule.id}
          label="Open Proposal File Workspace & Tags"
          size="sm"
        />
      </div>

      <ProcessActionCenter
        entityId={schedule.id}
        entityCode={schedule.schedule_code || `PROP-${schedule.id.slice(0, 8)}`}
        entityTypeLabel="Land Acquisition Schedule"
        currentStage={schedule.state}
        userRole={userRole}
        checklistSummary={checklistSummary}
        onOpenDocumentWorkspace={onOpenDocumentWorkspace}
      />
    </div>
  )
}
