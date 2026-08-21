'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { SectionCard } from '@/shared/components/coalrr/SectionCard'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/shared/components/ui/table'
import { formatNumber } from '@/lib/utils/formatters'
import { MapPin, FileSpreadsheet, Layers, AlertCircle } from 'lucide-react'
import { MouzaAbstractResultDTO } from '@/domain/entities/proposal/IProposalRepository'

interface MouzaAbstractSectionProps {
  proposalId: string
  className?: string
}

const fetchMouzaAbstract = async (proposalId: string): Promise<MouzaAbstractResultDTO> => {
  const res = await fetch(`/api/proposals/${proposalId}/mouza-abstract`)
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error || 'Failed to fetch Mouza abstract')
  }
  return res.json()
}

export function MouzaAbstractSection({ proposalId, className }: MouzaAbstractSectionProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mouza-abstract', proposalId],
    queryFn: () => fetchMouzaAbstract(proposalId),
    enabled: Boolean(proposalId),
    staleTime: 30000,
  })

  if (isLoading) {
    return (
      <SectionCard title="Mouza-Wise Land Abstract" icon={FileSpreadsheet} className={className}>
        <div className="space-y-3 p-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </SectionCard>
    )
  }

  if (isError || !data) {
    return (
      <SectionCard title="Mouza-Wise Land Abstract" icon={FileSpreadsheet} className={className}>
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-center gap-2 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{error ? (error as Error).message : 'Unable to load Mouza-wise abstract data'}</span>
        </div>
      </SectionCard>
    )
  }

  const { land_types = [], mouza_abstracts = [], grand_totals } = data

  return (
    <SectionCard 
      title="Mouza-Wise Land Abstract" 
      icon={FileSpreadsheet}
      description="Aggregated plot count and land type acquisition acreage (Annexures A & C only; excludes Annexure B purchased land)"
      className={className}
      action={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs font-bold text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300">
            {grand_totals.total_mouzas} Mouza(s)
          </Badge>
          <Badge variant="outline" className="font-mono text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
            {grand_totals.total_plots} Plot(s)
          </Badge>
          <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {formatNumber(grand_totals.total_area_acres, 4)} Ac Total
          </Badge>
        </div>
      }
    >
      <div className="overflow-x-auto border rounded-lg bg-card">
        <Table className="w-full text-xs">
          <TableHeader className="bg-muted/70">
            <TableRow>
              <TableHead className="w-12 font-bold text-center">Sl No.</TableHead>
              <TableHead className="min-w-[180px] font-bold">Mouza Name &amp; J.L. No.</TableHead>
              <TableHead className="text-right font-bold w-24">Plot Count</TableHead>
              {land_types.map((lt) => (
                <TableHead key={lt} className="text-right font-bold min-w-[120px]">
                  {lt} (Ac)
                </TableHead>
              ))}
              <TableHead className="text-right font-bold min-w-[140px] text-emerald-700 dark:text-emerald-400">
                Total Area (Acres)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {mouza_abstracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4 + land_types.length} className="text-center py-6 text-muted-foreground italic">
                  No active plots recorded in schedule.
                </TableCell>
              </TableRow>
            ) : (
              mouza_abstracts.map((row, idx) => (
                <TableRow key={row.mouza_lgd || idx} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-center font-mono text-muted-foreground font-semibold">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                        {row.mouza_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        J.L. No: <span className="font-bold text-foreground">{row.jl_no}</span> · LGD: {row.mouza_lgd}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground">{row.plot_count}</TableCell>
                  {land_types.map((lt) => {
                    const ltVal = row.land_type_areas[lt] || 0
                    return (
                      <TableCell key={lt} className="text-right font-mono tabular-nums">
                        {ltVal > 0 ? (
                          <span className="font-semibold text-foreground">{formatNumber(ltVal, 4)}</span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatNumber(row.total_area_acres, 4)} Ac
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          {/* Prominent TOTAL ROW with bold emerald styling */}
          <TableFooter className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-bold border-t-2 border-emerald-500">
            <TableRow className="hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50">
              <TableCell className="text-center font-bold font-mono">TOTAL</TableCell>
              <TableCell className="font-bold">
                <span className="flex items-center gap-1.5 text-xs">
                  <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {grand_totals.total_mouzas} Mouza(s) Total
                </span>
              </TableCell>
              <TableCell className="text-right font-mono font-bold text-sm text-emerald-900 dark:text-emerald-200">
                {grand_totals.total_plots}
              </TableCell>
              {land_types.map((lt) => {
                const totalLtVal = grand_totals.land_type_areas[lt] || 0
                return (
                  <TableCell key={lt} className="text-right font-mono font-bold tabular-nums text-xs">
                    {totalLtVal > 0 ? `${formatNumber(totalLtVal, 4)} Ac` : '-'}
                  </TableCell>
                )
              })}
              <TableCell className="text-right font-mono font-bold text-sm text-emerald-800 dark:text-emerald-200 tabular-nums">
                {formatNumber(grand_totals.total_area_acres, 4)} Ac
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </SectionCard>
  )
}
