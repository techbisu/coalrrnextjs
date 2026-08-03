'use client'

import * as React from 'react'
import { FilterBar, MasterLookup } from '@/shared/components/coalrr'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Lock, MapPin, IndianRupee, Users, AlertTriangle, ChevronRight, Building2 } from 'lucide-react'
import { formatINR, formatNumber } from '@/lib/utils/formatters'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Can } from '@/authorization/components/Can'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

// ... existing arrays ...
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
  const t = useAppTranslation('project_master')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterLocked, setFilterLocked] = React.useState<boolean | null>(null) // null = all, true = locked, false = draft
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
      <FilterBar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
      searchPlaceholder={t('search_placeholder')}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 px-6 text-center bg-card border border-dashed rounded-xl flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium text-foreground">{t('no_projects_found')}</h3>
            <p className="text-muted-foreground mt-2">{t('no_projects_desc', 'There are no projects available in the system yet. Please create one to get started.')}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-dashed rounded-xl">
            {t('no_projects_found')}
          </div>
        ) : (
          filteredProjects.map(project => {
            const colorIdx = getProjectColorIndex(project.id)
            const colorClass = PROJECT_COLORS[colorIdx]
            const progressClass = PROJECT_PROGRESS_COLORS[colorIdx]
            
            const areaPct = Number(project.total_land_limit_acres) > 0 
              ? (Number(project.total_acquired_area) / Number(project.total_land_limit_acres)) * 100 
              : 0
            
            return (
              <div 
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`group relative flex flex-col bg-card border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${selectedProjectId === project.id ? 'ring-2 ring-primary border-transparent' : 'border-border'}`}
              >
                {/* Card Header Background */}
                <div className={`h-24 w-full absolute top-0 left-0 bg-gradient-to-br from-background to-muted opacity-50 z-0`}></div>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant={project.isLocked ? "default" : "secondary"} className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 shadow-sm ${project.isLocked ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400' : ''}`}>
                    {project.isLocked ? <><Lock className="h-3 w-3 mr-1" />{t('baseline_locked')}</> : t('draft', 'Draft')}
                  </Badge>
                </div>

                <div className="p-6 pt-5 flex-1 flex flex-col z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${colorClass}`}>
                      {project.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col pr-12">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-1" title={project.name}>{project.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono bg-background text-muted-foreground border-dashed px-1.5">
                          {project.ecl_proj_cd || project.mine_cd}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium line-clamp-1">
                          {mineMap.has(project.mine_cd) ? mineMap.get(project.mine_cd) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div 
                  className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 cursor-pointer"
                  onClick={() => onSelectProject(project.id)}
                >
                  {/* Area */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Area</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold tabular-nums">{formatNumber(project.total_acquired_area, 2)}</span>
                      <span className="text-[10px] text-muted-foreground">/ {formatNumber(project.total_land_limit_acres, 0)} ac</span>
                    </div>
                    <Progress value={areaPct} className="h-1" indicatorClassName={areaPct < 90 ? 'bg-emerald-500' : 'bg-destructive'} />
                  </div>

                  {/* Budget */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Budget</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold tabular-nums">{Number(project.budgetUtilization).toFixed(0)}%</span>
                      <span className="text-[10px] text-muted-foreground">used</span>
                    </div>
                    <Progress value={Number(project.budgetUtilization)} className="h-1" indicatorClassName={Number(project.budgetUtilization) < 80 ? 'bg-amber-500' : 'bg-destructive'} />
                  </div>

                  {/* Employment */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Jobs</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold tabular-nums">{project.payrollCount || 0}</span>
                      <span className="text-[10px] text-muted-foreground">/ {project.total_employment_quota}</span>
                    </div>
                    <Progress value={project.total_employment_quota ? ((project.payrollCount || 0) / project.total_employment_quota) * 100 : 0} className="h-1" indicatorClassName="bg-violet-500" />
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-white dark:bg-card">
                  <div className="flex items-center gap-2">
                    {!project.isLocked && (
                      <Can permission="project.delete">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setProjectToDelete({ id: project.id, name: project.name })
                            setDeleteConfirmName('')
                            setDeleteConfirmOpen(true)
                          }}
                        >
                          <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Delete
                        </Button>
                      </Can>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full sm:w-auto text-xs font-medium h-8 group-hover:bg-primary/5"
                    onClick={() => onSelectProject(project.id)}
                  >
                    View Details <ChevronRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
        setDeleteConfirmOpen(open)
        if (!open) {
          setDeleteConfirmName('')
          setProjectToDelete(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete_project', 'Delete Project')}</DialogTitle>
            <DialogDescription>
              {t('delete_confirm_desc', 'Are you sure you want to delete this project? This action cannot be undone.')}
              <br /><br />
              {t('delete_confirm_type', 'Type the project name')} <strong className="text-foreground">{projectToDelete?.name}</strong> {t('delete_confirm_exactly', 'exactly as shown below to confirm.')}
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
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>{t('cancel')}</Button>
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
