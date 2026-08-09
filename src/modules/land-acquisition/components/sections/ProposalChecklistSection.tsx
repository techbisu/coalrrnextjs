'use client'

import * as React from 'react'
import { GenericChecklistWorkspace } from '@/core/checklist/components/GenericChecklistWorkspace'
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config'

export interface ProposalChecklistSectionProps {
  proposalId: string
  userId?: string
}

export function ProposalChecklistSection({ proposalId, userId }: ProposalChecklistSectionProps) {
  return (
    <div className="space-y-4">
      <GenericChecklistWorkspace
        moduleCode={MODULE_CODES.LAND_SCHEDULE}
        checkableType={ACQ_LAND_SCHEDULE}
        checkableId={proposalId}
        userId={userId}
        title="Compliance Checklist"
        description="Mode-specific compliance items. Completeness status is automatically validated by the Workflow Engine."
      />
    </div>
  )
}
