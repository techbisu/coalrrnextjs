'use client'

import * as React from 'react'
import { FilterBar, MasterLookup } from '@/components/coalrr'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Lock, MapPin, IndianRupee, Users } from 'lucide-react'
import { formatINR, formatNumber } from '@/lib/utils/formatters'

const PROJECT_COLORS = [
  'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-900',
  'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900',
  'bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-400 dark:border-violet-900',
  'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-900',
  'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-900',
  'bg-cyan-500/10 text-cyan-700 border-cyan-200 dark:text-cyan-400 dark:border-cyan-900',
  'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200 dark:text-fuchsia-400 dark:border-fuchsia-900',
  'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400 dark:border-orange-900'
]

const PROJECT_BORDERS = [
  'border-l-blue-500',
  'border-l-emerald-500',
  'border-l-violet-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-cyan-500',
  'border-l-fuchsia-500',
  'border-l-orange-500'
]

const PROJECT_PROGRESS_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-orange-500'
]

function getProjectColorIndex(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % PROJECT_COLORS.length
}

interface ProjectData {
  id: string; name: string; mine_cd: string; ecl_proj_cd?: string; area_cd?: string;
  total_land_limit_acres: string; total_budget_ceiling: string; total_employment_quota: number
  total_acquired_area: string; areaUtilization: number;
  locked_at: string | null; isLocked: boolean
  payrollCount: number; totalDisbursed: string; budgetUtilization: string
}

interface ProjectListProps {
  projects: ProjectData[]
  onSelectProject: (id: string) => void
  selectedProjectId?: string
}

export function ProjectList({ projects, onSelectProject, selectedProjectId }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterLocked, setFilterLocked] = React.useState<boolean | null>(null) // null = all, true = locked, false = draft
  const [filterArea, setFilterArea] = React.useState<string | undefined>()
  const [filterMine, setFilterMine] = React.useState<string | undefined>()

  const { data: areaMasterData } = useMasterLookup({ masterName: 'area_master' })
  const areaMap = React.useMemo(() => {
    const map = new Map<string, string>()
    if (areaMasterData?.options) {
      areaMasterData.options.forEach(opt => map.set(opt.value, opt.label))
    }
    return map
  }, [areaMasterData])

  const filteredProjects = React.useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.mine_cd.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.ecl_proj_cd && p.ecl_proj_cd.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesLock = filterLocked === null ? true : p.isLocked === filterLocked
      const matchesMine = !filterMine ? true : p.mine_cd === filterMine

      return matchesSearch && matchesLock && matchesMine
    })
  }, [projects, searchQuery, filterLocked, filterMine])

  return (
    <div className="space-y-4">
      <FilterBar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search projects by name or code..."
        hasActiveFilters={filterLocked !== null || !!filterMine || !!filterArea}
        onClearFilters={() => {
          setFilterLocked(null)
          setFilterArea(undefined)
          setFilterMine(undefined)
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <MasterLookup
            masterName="area_master"
            value={filterArea}
            onChange={(v) => {
              setFilterArea(v)
              setFilterMine(undefined)
            }}
            placeholder="Select Area..."
            className="w-[140px] h-8 text-xs"
          />
          <MasterLookup
            masterName="mine_master"
            dependencies={{ area_cd: filterArea }}
            value={filterMine}
            onChange={setFilterMine}
            placeholder="Select Mine..."
            className="w-[140px] h-8 text-xs"
            disabled={!filterArea}
          />
          <div className="flex bg-muted p-1 rounded-md">
          <button 
            onClick={() => setFilterLocked(null)}
            className={`px-3 py-1 text-xs rounded-sm transition-colors ${filterLocked === null ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterLocked(true)}
            className={`px-3 py-1 text-xs rounded-sm transition-colors flex items-center gap-1 ${filterLocked === true ? 'bg-background shadow-sm text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Locked
          </button>
          <button 
            onClick={() => setFilterLocked(false)}
            className={`px-3 py-1 text-xs rounded-sm transition-colors flex items-center gap-1 ${filterLocked === false ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Draft
          </button>
        </div>
        </div>
      </FilterBar>

      <div className="flex flex-col gap-3">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 px-6 text-center bg-card border border-dashed rounded-lg flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium text-foreground">No Projects Found</h3>
            <p className="text-muted-foreground mt-2">There are no projects available in the system yet. Please create one to get started.</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-dashed rounded-lg">
            No projects found matching the criteria.
          </div>
        ) : (
          filteredProjects.map(project => {
            const colorIdx = getProjectColorIndex(project.id)
            const colorClass = PROJECT_COLORS[colorIdx]
            const borderClass = PROJECT_BORDERS[colorIdx]
            const progressClass = PROJECT_PROGRESS_COLORS[colorIdx]
            
            return (
            <div 
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`flex flex-col lg:flex-row gap-4 p-5 bg-card border rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-l-[6px] ${borderClass} ${selectedProjectId === project.id ? 'ring-2 ring-primary border-transparent' : ''}`}
            >
              <div className="flex flex-col md:flex-row lg:flex-col justify-between gap-4 lg:w-1/4 lg:shrink-0">
                <div className="flex gap-3">
                  <div className={`h-12 w-12 shrink-0 rounded-lg flex items-center justify-center font-bold text-lg border ${colorClass}`}>
                    {project.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold tracking-tight text-lg line-clamp-1" title={project.name}>{project.name}</h3>
                      <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 ${project.isLocked ? 'bg-secondary/20 text-secondary-foreground border-secondary/30' : 'bg-muted text-muted-foreground border-border'}`}>
                        {project.isLocked ? <><Lock className="h-2.5 w-2.5" /> Locked</> : 'Draft'}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-1 mt-1">
                      {project.ecl_proj_cd && <Badge variant="outline" className={`text-xs font-mono border-dashed bg-transparent ${colorClass.split(' ')[1]}`}>{project.ecl_proj_cd}</Badge>}
                      <Badge variant="secondary" className="text-xs font-mono bg-muted">{project.area_cd && areaMap.has(project.area_cd) ? areaMap.get(project.area_cd) : project.mine_cd}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="lg:hidden">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelectProject(project.id); }}>
                    View Details
                  </Button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-muted/30 p-4 rounded-md items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Area (Acres)</span>
                  <div className="flex items-end justify-between mt-1 mb-1.5">
                    <span className="text-base font-semibold">{formatNumber(project.total_acquired_area, 2)}</span>
                    <span className="text-xs text-muted-foreground">/ {formatNumber(project.total_land_limit_acres, 0)}</span>
                  </div>
                  <Progress value={Number(project.areaUtilization)} className="h-1.5" indicatorClassName={progressClass} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Budget</span>
                  <div className="flex items-end justify-between mt-1 mb-1.5">
                    <span className="text-base font-semibold">{formatINR(project.totalDisbursed)}</span>
                    <span className="text-xs text-muted-foreground">{Number(project.budgetUtilization) === 0 ? '0' : Number(project.budgetUtilization).toFixed(1)}%</span>
                  </div>
                  <Progress value={Number(project.budgetUtilization)} className="h-1.5" indicatorClassName={progressClass} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Employment</span>
                  <div className="flex items-end justify-between mt-1 mb-1.5">
                    <span className="text-base font-semibold">{project.payrollCount}</span>
                    <span className="text-xs text-muted-foreground">/ {project.total_employment_quota}</span>
                  </div>
                  <Progress value={project.total_employment_quota ? (project.payrollCount / project.total_employment_quota) * 100 : 0} className="h-1.5" indicatorClassName={progressClass} />
                </div>
                <div className="flex flex-col justify-center md:border-l md:pl-4">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">Status Date</span>
                  <div className="text-sm font-medium mt-1">
                    {project.locked_at ? new Date(project.locked_at).toLocaleDateString() : 'Pending'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {project.isLocked ? 'Finalized' : 'Editing allowed'}
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex lg:flex-col lg:justify-center lg:shrink-0 lg:pl-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelectProject(project.id); }}>
                  View Details
                </Button>
              </div>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}
