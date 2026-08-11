'use client'

import * as React from 'react'
import { ApprovalPanel, UnifiedWorkflowTimeline, LimitCheckPanel } from '@/shared/components/coalrr'
import type { AvailableTransition, LimitDetails } from '@/shared/components/coalrr'
import { MODULE_CODES } from '@/core/config/module-codes.config'

export interface ProposalWorkflowSidebarSectionProps {
  proposalId: string
  currentState: string
  availableTransitions: AvailableTransition[]
  actorRole: string
  onActorRoleChange: (role: string) => void
  onAction: (transitionName: string) => void
  limits: LimitDetails | null
}

export function ProposalWorkflowSidebarSection({
  proposalId,
  currentState,
  availableTransitions,
  actorRole,
  onActorRoleChange,
  onAction,
  limits,
}: ProposalWorkflowSidebarSectionProps) {
  return (
    <div className="space-y-6">
      {/* 1. Approval Chain Panel */}
      <ApprovalPanel
        currentState={currentState}
        availableTransitions={availableTransitions}
        actorRole={actorRole}
        onActorRoleChange={onActorRoleChange}
        onAction={onAction}
      />

      {/* 2. Unified Workflow Timeline & Stepper */}
      <UnifiedWorkflowTimeline
        moduleCode={MODULE_CODES.LAND_SCHEDULE}
        entityId={proposalId}
      />

      {/* 3. Project Baseline Limits Gauge */}
      <LimitCheckPanel limits={limits} />
    </div>
  )
}
