'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle, ShieldAlert, Award } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { formatNumber } from '@/lib/utils/formatters'

interface ProjectLimitsCheckProps {
  proposalType?: string
  proposedAreaAcres: number
  approvedProjectLimitAcres: number
  tenancyAreaProposed?: number
  tenancyAreaLimit?: number
  govtAreaProposed?: number
  govtAreaLimit?: number
  forestAreaProposed?: number
  forestAreaLimit?: number
  totalLandCostEst?: number
  projectLandBudget?: number
  employmentProposedCount?: number
  sanctionedEmploymentCount?: number
}

export function ProjectLimitsCheck({
  proposalType = 'STANDARD_LAP',
  proposedAreaAcres,
  approvedProjectLimitAcres,
  tenancyAreaProposed = 0,
  tenancyAreaLimit = 0,
  govtAreaProposed = 0,
  govtAreaLimit = 0,
  forestAreaProposed = 0,
  forestAreaLimit = 0,
  totalLandCostEst = 0,
  projectLandBudget = 0,
  employmentProposedCount = 0,
  sanctionedEmploymentCount = 0,
}: ProjectLimitsCheckProps) {
  const isDraftPrStage = proposalType === 'DRAFT_PR_CHECKLIST_1_4'

  const overallPercent = approvedProjectLimitAcres > 0 
    ? Math.min(Math.round((proposedAreaAcres / approvedProjectLimitAcres) * 100), 150)
    : 0

  const isExceeded = !isDraftPrStage && (
    (approvedProjectLimitAcres > 0 && proposedAreaAcres > approvedProjectLimitAcres) ||
    (projectLandBudget > 0 && totalLandCostEst > projectLandBudget) ||
    (sanctionedEmploymentCount > 0 && employmentProposedCount > sanctionedEmploymentCount)
  )

  return (
    <div className="rounded-md border p-4 bg-card shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">PR Baseline Compliance Check</h4>
        {isDraftPrStage ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300">
            DRAFT PR STAGE (CL-1.4)
          </Badge>
        ) : isExceeded ? (
          <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> ECL BOARD APPROVAL ROUTE
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> CMD APPROVAL ROUTE
          </Badge>
        )}
      </div>

      {/* Overall Land Limit Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span>Total Proposed Area</span>
          <span className="font-mono">{formatNumber(proposedAreaAcres, 2)} / {formatNumber(approvedProjectLimitAcres, 2)} Acres</span>
        </div>
        <Progress 
          value={overallPercent} 
          className={`h-2 ${overallPercent > 100 ? '[&>div]:bg-red-500' : overallPercent >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`} 
        />
        <div className="text-[10px] text-muted-foreground flex justify-between">
          <span>{overallPercent}% of PR Baseline</span>
          {overallPercent > 100 && <span className="text-red-500 font-semibold">Exceeds PR Limit</span>}
        </div>
      </div>

      {/* Breakdown Progress Bars */}
      <div className="grid gap-2 border-t pt-3 text-xs">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-muted-foreground">Tenancy Land</span>
          <span className="font-mono">{formatNumber(tenancyAreaProposed, 2)} ac (Limit: {formatNumber(tenancyAreaLimit, 2)})</span>
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-muted-foreground">Government Land</span>
          <span className="font-mono">{formatNumber(govtAreaProposed, 2)} ac (Limit: {formatNumber(govtAreaLimit, 2)})</span>
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-muted-foreground">Forest Land</span>
          <span className="font-mono">{formatNumber(forestAreaProposed, 2)} ac (Limit: {formatNumber(forestAreaLimit, 2)})</span>
        </div>
      </div>

      {/* Financial & Job Quota Summary */}
      <div className="grid grid-cols-2 gap-2 border-t pt-3 text-[11px]">
        <div className="p-2 rounded bg-muted/40">
          <div className="text-muted-foreground">Total Land Cost</div>
          <div className="font-mono font-bold text-foreground">₹{formatNumber(totalLandCostEst, 0)}</div>
        </div>

        <div className="p-2 rounded bg-muted/40">
          <div className="text-muted-foreground">Proposed Jobs</div>
          <div className="font-mono font-bold text-foreground">{employmentProposedCount} Jobs</div>
        </div>
      </div>
    </div>
  )
}
