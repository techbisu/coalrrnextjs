'use client'

import * as React from 'react'
import { ManualMilestonePanel } from '@/shared/components/coalrr'
import type { Milestone } from '@/shared/components/coalrr'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface ProposalMilestonesSectionProps {
  proposalId: string
  acq_mode_id?: number
}

export function ProposalMilestonesSection({
  proposalId,
  acq_mode_id = 6, // DIRECT_PURCHASE
}: ProposalMilestonesSectionProps) {
  const qc = useQueryClient()

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['proposals', proposalId, 'milestones'],
    queryFn: async () => {
      const r = await fetch(`/api/milestones/proposal/${proposalId}`)
      if (!r.ok) return []
      return r.json()
    }
  })

  const addMilestone = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch(`/api/milestones/proposal/${proposalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'Failed to record milestone')
      return json
    },
    onSuccess: () => {
      toast.success('Milestone recorded')
      qc.invalidateQueries({ queryKey: ['proposals', proposalId, 'milestones'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <ManualMilestonePanel
        milestones={milestones}
        isDirectPurchase={acq_mode_id === 6}
        onAddSubmit={async (ms) => {
          await addMilestone.mutateAsync(ms)
        }}
      />
    </div>
  )
}
