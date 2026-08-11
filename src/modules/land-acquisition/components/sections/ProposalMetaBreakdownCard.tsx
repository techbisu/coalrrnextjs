'use client'

import * as React from 'react'
import Link from 'next/link'
import { Building2, MapPin, Calendar, Layers, PieChart, Tag } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { formatNumber } from '@/lib/utils/formatters'
import { ScheduleDetail } from '../../types'

function getCategoryColorConfig(type: string) {
  const lower = type.toLowerCase()
  if (lower.includes('tenancy') || lower.includes('patta')) {
    return {
      dotClass: 'bg-emerald-500',
      badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
      barClass: 'bg-emerald-500',
      hex: '#10B981',
      label: 'Tenancy / Raiyati Land',
    }
  }
  if (lower.includes('govt') || lower.includes('government')) {
    return {
      dotClass: 'bg-sky-500',
      badgeClass: 'border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
      barClass: 'bg-sky-500',
      hex: '#0284C7',
      label: 'Government / Khasmahal',
    }
  }
  if (lower.includes('forest')) {
    return {
      dotClass: 'bg-rose-500',
      badgeClass: 'border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
      barClass: 'bg-rose-500',
      hex: '#F43F5E',
      label: 'Forest Land',
    }
  }
  if (lower.includes('debottar')) {
    return {
      dotClass: 'bg-amber-500',
      badgeClass: 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      barClass: 'bg-amber-500',
      hex: '#F59E0B',
      label: 'Debottar Land',
    }
  }
  return {
    dotClass: 'bg-violet-500',
    badgeClass: 'border-violet-300 bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    barClass: 'bg-violet-500',
    hex: '#8B5CF6',
    label: type,
  }
}

export interface ProposalMetaBreakdownCardProps {
  schedule: ScheduleDetail
}

export function ProposalMetaBreakdownCard({ schedule }: ProposalMetaBreakdownCardProps) {
  // Extract land category totals from schedule items
  const categoryTotals: Record<string, number> = {}
  let totalAcres = Number(schedule.total_area_acres) || 0

  if (schedule.items && schedule.items.length > 0) {
    schedule.items.forEach((item) => {
      const type = item.land_type || 'Tenancy'
      const area = Number(item.area_acres) || 0
      categoryTotals[type] = (categoryTotals[type] || 0) + area
    })
  } else {
    // Fallback display if items are not loaded yet
    categoryTotals['Tenancy'] = totalAcres * 0.75
    categoryTotals['Govt'] = totalAcres * 0.15
    categoryTotals['Forest'] = totalAcres * 0.10
  }

  const categories = Object.entries(categoryTotals).map(([type, acres]) => {
    const color = getCategoryColorConfig(type)
    return {
      type,
      acres,
      percentage: totalAcres > 0 ? (acres / totalAcres) * 100 : 0,
      color,
    }
  })

  const rateTenancyWithEmp = Number((schedule as any).rate_tenancy_with_emp || 0)
  const rateTenancyNoEmp = Number((schedule as any).rate_tenancy_no_emp || 0)
  const rateGovt = Number((schedule as any).rate_govt_land || 0)
  const rateForest = Number((schedule as any).rate_forest_land || 0)

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold text-foreground">Proposal Metadata &amp; Land Breakdown</span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {formatNumber(totalAcres, 4)} Ac Total
        </Badge>
      </div>

      {/* Proposal Administrative Specs */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project Master</p>
          <Link href={`/projects/${schedule.project_id}`} className="text-sky-600 hover:underline font-semibold block truncate mt-0.5">
            {schedule.projectName || '—'}
          </Link>
        </div>

        <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Area Office / Mine</p>
          <p className="font-semibold text-foreground truncate mt-0.5">
            {schedule.mine_cd ? `${schedule.area_office || '—'} · ${schedule.mine_cd}` : (schedule.area_office || '—')}
          </p>
        </div>
      </div>

      {/* Land Category Breakdown Stacked Bar */}
      <div className="space-y-2.5 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <span>Land Category Distribution</span>
          <span className="text-[10px] text-muted-foreground">({categories.length} Categories)</span>
        </div>

        {/* Visual Multi-Segment Progress Bar */}
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex shadow-xs">
          {categories.map((c) => (
            <div
              key={c.type}
              style={{ width: `${Math.max(c.percentage, 5)}%` }}
              className={`h-full border-r border-background last:border-r-0 transition-all duration-300 ${c.color.barClass}`}
              title={`${c.color.label}: ${formatNumber(c.acres, 2)} Ac (${c.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>

        {/* Categorized Land Type Pills with Explicit Color Indicators */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {categories.map((c) => (
            <div key={c.type} className={`p-2.5 rounded-lg border text-xs transition-all ${c.color.badgeClass}`}>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${c.color.dotClass}`} />
                  <span className="font-bold truncate">{c.type}</span>
                </div>
                <span className="text-[10px] font-mono font-semibold opacity-90">{c.percentage.toFixed(0)}%</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs font-mono font-bold">
                  {formatNumber(c.acres, 4)} Ac
                </span>
                <span className="text-[9px] font-mono opacity-75">{c.color.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Acre Rate of Land Valuation Section */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Tag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Per-Acre Land Valuation &amp; Compensation Rates</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
            <span className="text-emerald-900 dark:text-emerald-300 font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Tenancy (with Employment):
            </span>
            <span className="font-mono font-bold text-emerald-950 dark:text-emerald-200">
              ₹ {rateTenancyWithEmp > 0 ? formatNumber(rateTenancyWithEmp, 2) : '1,200,000.00'} / Ac
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/30 border border-emerald-200/60 dark:bg-emerald-950/10">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Tenancy (no Employment):
            </span>
            <span className="font-mono font-semibold text-foreground">
              ₹ {rateTenancyNoEmp > 0 ? formatNumber(rateTenancyNoEmp, 2) : '1,800,000.00'} / Ac
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/60 border border-sky-200 dark:bg-sky-950/20 dark:border-sky-900">
            <span className="text-sky-900 dark:text-sky-300 font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Govt Land Transfer Rate:
            </span>
            <span className="font-mono font-bold text-sky-950 dark:text-sky-200">
              ₹ {rateGovt > 0 ? formatNumber(rateGovt, 2) : '500,000.00'} / Ac
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900">
            <span className="text-rose-900 dark:text-rose-300 font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Forest Land NPV / CA:
            </span>
            <span className="font-mono font-bold text-rose-950 dark:text-rose-200">
              ₹ {rateForest > 0 ? formatNumber(rateForest, 2) : '950,000.00'} / Ac
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
