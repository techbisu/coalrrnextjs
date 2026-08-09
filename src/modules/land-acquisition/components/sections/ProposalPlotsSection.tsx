'use client'

import * as React from 'react'
import { PlotScheduleManager } from '@/modules/proposal/components/PlotScheduleManager'

export interface ProposalPlotsSectionProps {
  proposalId: string
  isDrafting?: boolean
  onChanged?: () => void
}

export function ProposalPlotsSection({
  proposalId,
  isDrafting = true,
  onChanged = () => {},
}: ProposalPlotsSectionProps) {
  const [editPlotId, setEditPlotId] = React.useState<string | null>(null)

  return (
    <div className="space-y-4">
      <PlotScheduleManager
        proposalId={proposalId}
        isDrafting={isDrafting}
        projectStateLgd="19"
        projectMouzas={[]}
        editPlotId={editPlotId}
        setEditPlotId={setEditPlotId}
        onChanged={onChanged}
      />
    </div>
  )
}
