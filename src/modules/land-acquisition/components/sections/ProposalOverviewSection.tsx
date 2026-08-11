'use client'

import * as React from 'react'
import { SectionCard, StatTile } from '@/shared/components/coalrr'
import { formatNumber } from '@/lib/utils/formatters'
import { MapPin, Layers, Building2, User, FileText } from 'lucide-react'

export interface ProposalOverviewSectionProps {
  schedule: {
    id: string
    schedule_code: string
    proposal_title: string
    acq_mode_id: number
    colliery_code?: string
    proposed_by: string
    proposed_by_role?: string
    total_area_acres: string | number
    plots_count?: number
    rate_tenancy_with_emp?: number | string
    rate_tenancy_no_emp?: number | string
    rate_govt_land?: number | string
    rate_forest_land?: number | string
    created_at?: string
  }
}

export function ProposalOverviewSection({ schedule }: ProposalOverviewSectionProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile
          label="Total Area"
          value={`${formatNumber(Number(schedule.total_area_acres || 0), 4)} Acres`}
          accent="amber"
          icon={Layers}
        />
        <StatTile
          label="Acquisition Mode"
          value={schedule.acq_mode_id.toString()}
          accent="teal"
          icon={FileText}
        />
        <StatTile
          label="Colliery / Mine"
          value={schedule.colliery_code ?? 'N/A'}
          accent="emerald"
          icon={Building2}
        />
        <StatTile
          label="Proposed By"
          value={schedule.proposed_by}
          accent="violet"
          icon={User}
        />
      </div>

      {/* Primary Details Card */}
      <SectionCard
        title="Proposal Metadata & Land Category Breakdown"
        description="Detailed land acquisition parameters, rate structures, and colliery associations."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Rate of Tenancy Land (with Employment):</span>
              <span className="font-mono font-semibold">₹ {formatNumber(Number(schedule.rate_tenancy_with_emp || 0), 2)} / Acre</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Rate of Tenancy Land (no Employment):</span>
              <span className="font-mono font-semibold">₹ {formatNumber(Number(schedule.rate_tenancy_no_emp || 0), 2)} / Acre</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Rate of Government Land:</span>
              <span className="font-mono font-semibold">₹ {formatNumber(Number(schedule.rate_govt_land || 0), 2)} / Acre</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Rate of Forest Land:</span>
              <span className="font-mono font-semibold">₹ {formatNumber(Number(schedule.rate_forest_land || 0), 2)} / Acre</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
