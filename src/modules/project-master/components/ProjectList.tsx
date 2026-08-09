'use client'

import * as React from 'react'
import { FilterBar, AreaSelect, MineSelect } from '@/shared/components/coalrr'
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
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  SortingState
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

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

  // --- Table Setup ---
  const [sorting, setSorting] = React.useState<SortingState>([])
  const columnHelper = createColumnHelper<ProjectData>()

  const columns = React.useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Project Details',
      cell: info => {
        const p = info.row.original
        const colorIdx = getProjectColorIndex(p.id)
        const colorClass = PROJECT_COLORS[colorIdx]
        return (
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${colorClass}`}>
              {p.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-foreground truncate max-w-[200px]" title={p.name}>
                {p.name}
              </span>
              <span className="font-mono text-xs text-muted-foreground mt-0.5">
                {p.ecl_proj_cd || p.id}
              </span>
            </div>
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'location',
      header: 'Location',
      cell: info => {
        const p = info.row.original
        return (
          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground uppercase tracking-tight">
            <span>Area: <strong className="text-foreground">{p.area_cd || '—'}</strong></span>
            <span>Mine: <strong className="text-foreground">{p.mine_cd}</strong></span>
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'baselines',
      header: () => <div className="text-right">Baselines (Acres)</div>,
      cell: info => {
        const p = info.row.original
        return (
          <div className="grid grid-cols-1 gap-1 text-[10px] uppercase font-medium tracking-tight text-right text-muted-foreground">
            <div className="flex justify-end gap-3">
              <span>Tenancy:</span>
              <span className="font-mono text-foreground font-semibold w-12">{formatNumber(p.approved_tenancy_area || 0, 2)}</span>
            </div>
            <div className="flex justify-end gap-3">
              <span>Govt:</span>
              <span className="font-mono text-foreground font-semibold w-12">{formatNumber(p.approved_govt_area || 0, 2)}</span>
            </div>
            <div className="flex justify-end gap-3">
              <span>Forest:</span>
              <span className="font-mono text-foreground font-semibold w-12">{formatNumber(p.approved_forest_area || 0, 2)}</span>
            </div>
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'metrics',
      header: 'Key Metrics',
      cell: info => {
        const p = info.row.original
        const areaAcquired = Number(p.total_acquired_area || 0)
        const areaLimit = Number(p.total_land_limit_acres || 0)
        const areaPct = areaLimit > 0 ? Math.min((areaAcquired / areaLimit) * 100, 100) : 0

        const budgetPct = Number(p.budgetUtilization || 0)
        
        return (
          <div className="w-[160px] flex flex-col gap-2.5">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-emerald-600"/> Land (ac)</span>
                <span className="font-mono">{formatNumber(areaAcquired, 1)} / {formatNumber(areaLimit, 1)}</span>
              </div>
              <Progress value={areaPct} className="h-1.5" indicatorClassName={areaPct > 100 ? 'bg-red-500' : areaPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
                <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3 text-amber-600"/> Budget</span>
                <span className="font-mono">{budgetPct.toFixed(1)}%</span>
              </div>
              <Progress value={budgetPct} className="h-1.5" indicatorClassName={budgetPct > 100 ? 'bg-red-500' : 'bg-amber-500'} />
            </div>
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: info => {
        const p = info.row.original
        const isCombo = p.is_combo_project || (p.linked_mine_codes && p.linked_mine_codes.length > 0)
        return (
          <div className="flex flex-col gap-1.5 items-start">
            <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-tight ${
              p.isLocked 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {p.isLocked ? <><Lock className="h-2.5 w-2.5 mr-1" /> Locked</> : 'Draft'}
            </Badge>
            {isCombo && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase font-bold tracking-tight">
                <Layers className="h-2.5 w-2.5 mr-1" /> Combo
              </Badge>
            )}
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => {
        const p = info.row.original
        return (
          <div className="flex items-center justify-end gap-2">
            {!p.isLocked && (
              <Can permission="project.delete">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setProjectToDelete({ id: p.id, name: p.name })
                    setDeleteConfirmName('')
                    setDeleteConfirmOpen(true)
                  }}
                  title="Delete Project"
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </Can>
            )}
            <Button 
              variant="secondary" 
              size="sm"
              className="h-8 text-xs font-semibold hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-900/50 dark:hover:text-amber-100"
              onClick={(e) => {
                e.stopPropagation()
                onSelectProject(p.id)
              }}
            >
              Overview <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        )
      }
    })
  ], [onSelectProject, setProjectToDelete, setDeleteConfirmName, setDeleteConfirmOpen])

  const table = useReactTable({
    data: filteredProjects,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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
          <AreaSelect
            showAllOption
            value={filterArea}
            onChange={(v) => {
              setFilterArea(v as string)
              setFilterMine(undefined)
            }}
            placeholder={t('project.form.areaPlaceholder', 'Select Area...')}
            className="w-[140px] h-8 text-xs"
          />
          <MineSelect
            areaCd={filterArea}
            showAllOption
            value={filterMine}
            onChange={(v) => setFilterMine(v as string)}
            placeholder={t('project.form.minePlaceholder', 'Select Mine...')}
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

      {/* Elegant Enterprise Data Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground h-11 bg-transparent px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedProjectId === row.original.id ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                  onClick={() => onSelectProject(row.original.id)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="py-4 px-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[400px] text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground/70" />
                    </div>
                    <p className="text-base font-semibold text-foreground">{t('no_projects_found', 'No projects found')}</p>
                    <p className="text-sm mt-1 max-w-[250px] leading-relaxed">
                      {projects.length === 0 
                        ? t('no_projects_desc', 'There are no project baselines yet. Register one to get started.') 
                        : 'Adjust your search and filter criteria to find what you are looking for.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
