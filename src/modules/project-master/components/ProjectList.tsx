'use client'

import * as React from 'react'
import { FilterBar, MasterLookup } from '@/shared/components/coalrr'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Lock, MapPin, IndianRupee, Users, AlertTriangle, ChevronRight, Layers, FileText, CheckCircle2 } from 'lucide-react'
import { formatINR, formatNumber } from '@/lib/utils/formatters'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Can } from '@/authorization/components/Can'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

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

function getProjectColorIndex(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % PROJECT_COLORS.length
}

interface ProjectData {
  id: string
  name: string
  mine_cd: string
  ecl_proj_cd?: string
  area_cd?: string
  total_land_limit_acres: string
  total_budget_ceiling: string
  total_employment_quota: number
  total_acquired_area: string
  areaUtilization: number
  locked_at: string | null
  isLocked: boolean
  payrollCount: number
  totalDisbursed: string
  budgetUtilization: string
  is_combo_project?: boolean
  linked_mine_codes?: string[]
  approved_tenancy_area?: string | number
  approved_govt_area?: string | number
  approved_forest_area?: string | number
  proposals_count?: number
}

interface ProjectListProps {
  projects: ProjectData[]
  onSelectProject: (id: string) => void
  selectedProjectId?: string
}

export function ProjectList({ projects, onSelectProject, selectedProjectId }: ProjectListProps) {
  const t = useAppTranslation('project_master')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterLocked, setFilterLocked] = React.useState<boolean | null>(null)
  const [filterArea, setFilterArea] = React.useState<string | undefined>()
  const [filterMine, setFilterMine] = React.useState<string | undefined>()

  const queryClient = useQueryClient()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [projectToDelete, setProjectToDelete] = React.useState<{ id: string, name: string } | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = React.useState('')

  const { data: areaMasterData } = useMasterLookup({ masterName: 'area_master' })
  const areaMap = React.useMemo(() => {
    const map = new Map<string, string>()
    if (areaMasterData?.options) {
      areaMasterData.options.forEach(opt => map.set(opt.value, opt.label))
    }
    return map
  }, [areaMasterData])

  const { data: mineMasterData } = useMasterLookup({ masterName: 'mine_master' })
  const mineMap = React.useMemo(() => {
    const map = new Map<string, string>()
    if (mineMasterData?.options) {
      mineMasterData.options.forEach(opt => map.set(opt.value, opt.label))
    }
    return map
  }, [mineMasterData])

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

  const handleDelete = async () => {
    if (!projectToDelete) return
    if (deleteConfirmName !== projectToDelete.name) return
    try {
      const r = await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(t('delete_error'));
      toast.success(t('project_deleted', 'Project deleted successfully'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteConfirmOpen(false);
      setDeleteConfirmName('');
      setProjectToDelete(null);
    } catch (err: any) {
      toast.error(err.message || t('delete_error'));
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls Bar */}
      <FilterBar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('search_placeholder', 'Search by project name, code, or mine...')}
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
              setFilterArea(v as string)
              setFilterMine(undefined)
            }}
            placeholder="Select Area..."
            className="w-[140px] h-8 text-xs"
          />
          <MasterLookup
            masterName="mine_master"
            dependencies={{ area_cd: filterArea }}
            value={filterMine}
            onChange={(v) => setFilterMine(v as string)}
            placeholder="Select Mine..."
            className="w-[140px] h-8 text-xs"
            disabled={!filterArea}
          />
          <div className="flex bg-muted p-1 rounded-md">
            <button 
              onClick={() => setFilterLocked(null)}
              className={`px-2.5 py-0.5 text-xs rounded-sm transition-colors ${filterLocked === null ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterLocked(true)}
              className={`px-2.5 py-0.5 text-xs rounded-sm transition-colors flex items-center gap-1 ${filterLocked === true ? 'bg-background shadow-sm font-medium text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Locked
            </button>
            <button 
              onClick={() => setFilterLocked(false)}
              className={`px-2.5 py-0.5 text-xs rounded-sm transition-colors flex items-center gap-1 ${filterLocked === false ? 'bg-background shadow-sm font-medium text-amber-700 dark:text-amber-400' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Draft
            </button>
          </div>
        </div>
      </FilterBar>

      {/* Responsive Executive Project Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 px-6 text-center bg-card border border-dashed rounded-xl flex flex-col items-center justify-center">
            <h3 className="text-base font-semibold text-foreground">{t('no_projects_found', 'No projects registered')}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t('no_projects_desc', 'There are no project PR Report baselines in the system yet. Click "New Project" to register one.')}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground bg-card border border-dashed rounded-xl">
            No projects match the selected search & filter criteria.
          </div>
        ) : (
          filteredProjects.map(project => {
            const colorIdx = getProjectColorIndex(project.id)
            const colorClass = PROJECT_COLORS[colorIdx]
            
            const areaAcquired = Number(project.total_acquired_area || 0)
            const areaLimit = Number(project.total_land_limit_acres || 0)
            const areaPct = areaLimit > 0 ? Math.min((areaAcquired / areaLimit) * 100, 100) : 0
            const isCombo = project.is_combo_project || (project.linked_mine_codes && project.linked_mine_codes.length > 0)
            
            return (
              <div 
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`group relative flex flex-col justify-between bg-card border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-amber-400/80 cursor-pointer ${
                  selectedProjectId === project.id ? 'ring-2 ring-amber-500 border-transparent bg-amber-50/10' : 'border-border'
                }`}
              >
                {/* Top Section: Header & Status Badges */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-base shadow-sm ${colorClass}`}>
                        {project.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base leading-snug text-foreground truncate" title={project.name}>
                          {project.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono font-medium text-foreground">{project.ecl_proj_cd || project.id}</span>
                          <span>•</span>
                          <span>Area: <strong className="text-foreground">{project.area_cd || '—'}</strong></span>
                          <span>•</span>
                          <span>Mine: <strong className="text-foreground">{project.mine_cd}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Lock / Draft Status */}
                    <div className="shrink-0 flex items-center gap-1">
                      {isCombo && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase font-bold tracking-tight">
                          <Layers className="h-2.5 w-2.5 mr-1" /> Combo
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-tight ${
                        project.isLocked 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {project.isLocked ? <><Lock className="h-2.5 w-2.5 mr-1" /> Locked</> : 'Draft'}
                      </Badge>
                    </div>
                  </div>

                  {/* Type-Wise PR Baseline Abstract Breakdown */}
                  <div className="my-3 rounded-lg bg-muted/40 p-2.5 border border-border/50 text-xs grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[10px] uppercase font-medium text-muted-foreground">Tenancy Baseline</div>
                      <div className="font-mono font-semibold text-foreground">{formatNumber(project.approved_tenancy_area || 0, 2)} ac</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-medium text-muted-foreground">Govt Baseline</div>
                      <div className="font-mono font-semibold text-foreground">{formatNumber(project.approved_govt_area || 0, 2)} ac</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-medium text-muted-foreground">Forest Baseline</div>
                      <div className="font-mono font-semibold text-foreground">{formatNumber(project.approved_forest_area || 0, 2)} ac</div>
                    </div>
                  </div>
                </div>

                {/* Metric Summary Progress Cards */}
                <div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-border/60 text-xs">
                    {/* Land Utilization */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        <span>Land Capacity</span>
                      </div>
                      <div className="font-mono text-xs font-bold text-foreground">
                        {formatNumber(areaAcquired, 1)} / {formatNumber(areaLimit, 1)} ac
                      </div>
                      <Progress value={areaPct} className="h-1.5" indicatorClassName={areaPct > 100 ? 'bg-red-500' : areaPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'} />
                    </div>

                    {/* Financial Budget */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <IndianRupee className="h-3 w-3 text-amber-600" />
                        <span>Budget Ceiling</span>
                      </div>
                      <div className="font-mono text-xs font-bold text-foreground">
                        {formatINR(project.total_budget_ceiling || 0)}
                      </div>
                      <Progress value={Number(project.budgetUtilization || 0)} className="h-1.5" indicatorClassName={Number(project.budgetUtilization || 0) > 100 ? 'bg-red-500' : 'bg-amber-500'} />
                    </div>

                    {/* Job Quota */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3 text-violet-600" />
                        <span>Job Quota</span>
                      </div>
                      <div className="font-mono text-xs font-bold text-foreground">
                        {project.payrollCount || 0} / {project.total_employment_quota || 0}
                      </div>
                      <Progress value={project.total_employment_quota ? ((project.payrollCount || 0) / project.total_employment_quota) * 100 : 0} className="h-1.5" indicatorClassName="bg-violet-500" />
                    </div>
                  </div>

                  {/* Card Footer: Action & Quick Info */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                      {project.proposals_count !== undefined && (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <FileText className="h-3 w-3 text-amber-600" /> {project.proposals_count} Proposals
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!project.isLocked && (
                        <Can permission="project.delete">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setProjectToDelete({ id: project.id, name: project.name })
                              setDeleteConfirmName('')
                              setDeleteConfirmOpen(true)
                            }}
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" /> Delete
                          </Button>
                        </Can>
                      )}

                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 text-xs font-semibold text-amber-700 dark:text-amber-400 group-hover:bg-amber-500/10"
                        onClick={() => onSelectProject(project.id)}
                      >
                        Overview <ChevronRight className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
        setDeleteConfirmOpen(open)
        if (!open) {
          setDeleteConfirmName('')
          setProjectToDelete(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete_project', 'Delete Project Baseline')}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project baseline? This action cannot be undone.
              <br /><br />
              Type the project name <strong className="text-foreground">{projectToDelete?.name}</strong> exactly as shown below to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={deleteConfirmName} 
              onChange={(e) => setDeleteConfirmName(e.target.value)} 
              placeholder={projectToDelete?.name} 
              autoComplete="off"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>{t('cancel', 'Cancel')}</Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteConfirmName !== projectToDelete?.name}
            >
              {t('delete_project', 'Delete Project')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
