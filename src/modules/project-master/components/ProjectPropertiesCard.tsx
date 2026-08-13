'use client'

import * as React from 'react'
import { SectionCard } from '@/shared/components/coalrr'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { Layers, MapPin, Map, Factory, FileStack } from 'lucide-react'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'
import { formatNumber } from '@/lib/utils/formatters'

export function ProjectPropertiesCard({ project }: { project: any }) {
  // Fetch master data for name resolution
  const { data: areaData } = useMasterLookup({ masterName: 'area', dependencies: { values: project?.area_cd ? [project.area_cd] : [] } })
  const { data: mineData } = useMasterLookup({ masterName: 'mine', dependencies: { values: project?.mine_cds || [] } })
  const { data: mouzaData } = useMasterLookup({ masterName: 'mouza', dependencies: { values: project?.mouza_lgds || [] } })

  // Resolve Area Name
  const areaName = React.useMemo(() => {
    if (!project?.area_cd || !areaData?.options) return project?.area_cd || 'N/A'
    const found = areaData.options.find((o: any) => o.value === project.area_cd)
    return found ? found.label : project.area_cd
  }, [project?.area_cd, areaData])

  // Resolve Mine Name(s)
  const mineNames = React.useMemo(() => {
    if (!project?.mine_cds || project.mine_cds.length === 0 || !mineData?.options) return ['N/A']
    return project.mine_cds.map((mineCd: string) => {
      const found = mineData.options.find((o: any) => o.value === mineCd)
      return found ? found.label : mineCd
    })
  }, [project?.mine_cds, mineData])

  // Resolve Mouza Name(s)
  const mouzaNames = React.useMemo(() => {
    if (!project?.mouza_lgds || project.mouza_lgds.length === 0 || !mouzaData?.options) return []
    return project.mouza_lgds.map((lgd: string) => {
      const found = mouzaData.options.find((o: any) => o.value === lgd)
      if (found) {
        return found.data?.jl_no ? `${found.label} (JL No: ${found.data.jl_no})` : found.label
      }
      return lgd
    })
  }, [project?.mouza_lgds, mouzaData])

  // Helper for Land Type Bars
  const totalLandLimit = Number(project?.total_land_limit_acres || 0)

  const landTypes = [
    { label: 'Tenancy Land', val: Number(project?.approved_tenancy_area || 0) },
    { label: 'Govt Land', val: Number(project?.approved_govt_area || 0) },
    { label: 'Forest Land', val: Number(project?.approved_forest_area || 0) },
    { label: 'Patta Land', val: Number(project?.approved_patta_area || 0) },
  ].filter(l => l.val > 0)

  const landUses = [
    { label: 'Excavation (Quarry)', val: Number(project?.approved_excavation_area || 0) },
    { label: 'Safety Zone', val: Number(project?.approved_safety_zone_area || 0) },
    { label: 'OB Dump', val: Number(project?.approved_ob_dump_area || 0) },
    { label: 'Infrastructure', val: Number(project?.approved_infra_area || 0) },
    { label: 'Diversion', val: Number(project?.approved_diversion_area || 0) },
    { label: 'Rehab Site', val: Number(project?.approved_rehab_area || 0) },
  ].filter(l => l.val > 0)

  return (
    <SectionCard title="Project Baseline Properties" icon={Layers} description="Metadata and statutory limits mapped from Project Report">
      <div className="space-y-6">
        {/* Mapping details */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
            <Factory className="h-3 w-3" /> Area & Mine Mapping
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm border-b pb-3">
            <div className="text-muted-foreground">Area:</div>
            <div className="font-medium text-right">{areaName}</div>
            <div className="text-muted-foreground">Mine(s):</div>
            <div className="font-medium text-right">
              {mineNames.map((mn: string, i: number) => (
                <div key={i}>{mn}</div>
              ))}
            </div>
          </div>

          <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mt-4">
            <Map className="h-3 w-3" /> Mapped Mouzas
          </h4>
          <div className="flex flex-wrap gap-1 border-b pb-3">
            {mouzaNames.length > 0 ? mouzaNames.map((mz: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-normal">{mz}</Badge>
            )) : <span className="text-xs text-muted-foreground italic">No mouzas mapped.</span>}
          </div>
        </div>

        {/* Type-wise Land Breakdown */}
        {totalLandLimit > 0 && (
          <div className="space-y-4 pt-2">
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-3">
                <FileStack className="h-3 w-3" /> Type-Wise PR Limits
              </h4>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium">Total Limit</span>
                <span className="text-sm font-bold">{formatNumber(totalLandLimit, 4)} ac</span>
              </div>
              <div className="space-y-3">
                {landTypes.map((lt, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{lt.label}</span>
                      <span className="tabular-nums font-medium">{formatNumber(lt.val, 4)} ac</span>
                    </div>
                    <Progress value={(lt.val / totalLandLimit) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Use-wise Land Breakdown */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-3">
                <MapPin className="h-3 w-3" /> Use-Wise PR Limits
              </h4>
              <div className="space-y-3">
                {landUses.map((lu, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{lu.label}</span>
                      <span className="tabular-nums font-medium">{formatNumber(lu.val, 4)} ac</span>
                    </div>
                    <Progress value={(lu.val / totalLandLimit) * 100} className="h-1.5 bg-muted indicator-emerald-500" indicatorClassName="bg-amber-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
