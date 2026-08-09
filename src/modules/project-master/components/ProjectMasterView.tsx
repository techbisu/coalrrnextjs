'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { MasterCascade } from '@/core/master-lookup/components/MasterCascade'
import { MasterFormLookup } from '@/core/master-lookup/components/MasterFormLookup'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, StatTile, GISMapViewer, DataTable, DocumentUploader, MasterLookup, DocumentWorkspaceModal, EntityFileManagerTrigger } from '@/shared/components/coalrr'
import type { Column, PlotFeature } from '@/shared/components/coalrr'
import { UploadedDoc } from '@/shared/components/coalrr'
import dynamic from 'next/dynamic'
import { formatINR, formatNumber,  } from '@/lib/utils/formatters'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { useUiState } from '@/providers/UiStateProvider'
import { routes } from '@/lib/url/UrlService'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/shared/components/ui/back-button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { toast } from 'sonner'
import {
  Building2, MapPin, Lock, ShieldCheck, IndianRupee, Users, FileText, TreePine,
  Plus, Pencil, AlertTriangle, CheckCircle2, Loader2, FileWarning, Download, ArrowLeft,
} from 'lucide-react'
import { Can } from '@/authorization/components/Can'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { ProjectFormDialog, ProjectFormValues } from './ProjectFormDialog'
import { LockBaselineDialog } from './LockBaselineDialog'
import { FormXXIIModal } from './FormXXIIModal'
import { ProjectList } from './ProjectList'
const ProjectProposalsList = dynamic(() => import('./ProjectProposalsList').then(m => m.ProjectProposalsList), { ssr: false, loading: () => <div className="h-32 animate-pulse bg-muted rounded-lg" /> })
const ProjectBoardApprovals = dynamic(() => import('./ProjectBoardApprovals').then(m => m.ProjectBoardApprovals), { ssr: false, loading: () => <div className="h-32 animate-pulse bg-muted rounded-lg" /> })
const ProjectBoundarySection = dynamic(() => import('./ProjectBoundarySection').then(m => m.ProjectBoundarySection), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" /> })
const ProjectPropertiesCard = dynamic(() => import('./ProjectPropertiesCard').then(m => m.ProjectPropertiesCard), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" /> })

export const EMPTY_FORM: ProjectFormValues = {
  name: '',
  mine_cds: [],
  area_cd: '',
  total_land_limit_acres: 0,
  land_budget: 0,
  rr_budget: 0,
  total_employment_quota: 0,
}

interface ProjectData {
  id: string; name: string; mine_cd: string; mine_cds?: string[]; ecl_proj_cd?: string;
  proj_cd?: string; status?: string;
  area_cd?: string; state_lgd?: bigint; district_lgd?: string; block_lgd?: string; mouza_lgds?: string[]; pr_docs?: UploadedDoc[]
  total_land_limit_acres: string; total_budget_ceiling: string; total_employment_quota: number
  total_acquired_area: string; areaUtilization: number;
  boundary: string; statutory_clearances: string | null
  locked_at: string | null; isLocked: boolean
  payrollCount: number; totalDisbursed: string; budgetUtilization: string
  approvals?: any[]
  // Land type-wise approved areas
  approved_tenancy_area?: number | string
  approved_govt_area?: number | string
  approved_forest_area?: number | string
  approved_patta_area?: number | string
  // Operational use-wise approved areas
  approved_excavation_area?: number | string
  approved_safety_zone_area?: number | string
  approved_ob_dump_area?: number | string
  approved_infra_area?: number | string
  approved_diversion_area?: number | string
  approved_rehab_area?: number | string
  plots: Array<{ id: string; plot_number: string; mouza: string; land_type: string; area_acres: string; exhausted_area_for_jobs: string; remaining_job_quota: number }>
}

interface FormXXIIApproval {
  proposal_id: string
  schedule_code: string
  proposal_title: string | null
  state: string
  instance_id: string | null
  instance_status: string | null
  file: {
    file_id: string
    original_name: string
    attached_at: string
    attached_by: string | null
    mime_type: string | null
    size_bytes: string | null
  } | null
}

async function fetchProjects(): Promise<ProjectData[]> {
  const r = await fetch('/api/projects', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  })
  if (!r.ok) throw new Error('Failed to load projects')
  const json = await r.json()
  return json.data || json
}

async function fetchProposals(): Promise<any[]> {
  const r = await fetch('/api/proposals', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  })
  if (!r.ok) throw new Error('Failed to load proposals')
  const json = await r.json()
  return json.data || json
}

// ─── Project form payload (shared by create + edit) ────────────────────────
// Removed inline dialogs

// ─── Main view ─────────────────────────────────────────────────────────────
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

import { GenericChecklistWorkspace } from '@/core/checklist/components/GenericChecklistWorkspace'

export function ProjectMasterView({ initialMineCd }: { initialMineCd?: string }) {
  const router = useRouter()
  const t = useAppTranslation('project_master')
  const { user } = useAuth()
  const { selectedProjectId, selectProject: uiSelectProject } = useUiState()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  const { data: allProposals, isLoading: isLoadingProposals } = useQuery({ queryKey: ['proposals'], queryFn: fetchProposals })
  const [selectedPlotId, setSelectedPlotId] = React.useState<string | null>(null)
  
  const [viewMode, setViewMode] = React.useState<'list' | 'details'>(
    initialMineCd || user?.scope?.level === 'UNIT' ? 'details' : 'list'
  )

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [lockOpen, setLockOpen] = React.useState(false)
  const [formXXIIOpen, setFormXXIIOpen] = React.useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [projectToDelete, setProjectToDelete] = React.useState<{ id: string, name: string } | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = React.useState('')

  const [editFormKey, setEditFormKey] = React.useState(0)
  const [createFormKey, setCreateFormKey] = React.useState(0)

  const { data: mouzaData } = useMasterLookup({ masterName: 'mouza_master' })
  const mouzaMap = React.useMemo(() => {
    const map = new Map<string, string>()
    if (mouzaData?.options) {
      mouzaData.options.forEach(opt => map.set(String(opt.value), opt.label))
    }
    return map
  }, [mouzaData])

  // Get project from data to use for checklist status query
  const projectForChecklist = data?.find((p) => p.id === selectedProjectId) ?? data?.[0]

  const { data: checklistData } = useQuery({
    queryKey: ['checklist', 'PROJECT_MASTER', 'project', projectForChecklist?.id],
    queryFn: async () => {
      const res = await fetch(`/api/checklists/status?moduleCode=PROJECT_MASTER&checkableType=project&checkableId=${projectForChecklist?.id}`);
      if (!res.ok) throw new Error('Failed to fetch checklist');
      return res.json();
    },
    enabled: !!projectForChecklist?.id
  })

  const isChecklistComplete = React.useMemo(() => {
    if (!checklistData || !Array.isArray(checklistData.items)) return false;
    const items = checklistData.items;
    const mandatoryItems = items.filter((item: any) => item.isMandatory);
    const satisfiedMandatoryCount = mandatoryItems.filter((item: any) =>
      item.submission?.status === 'SUBMITTED' ||
      item.submission?.status === 'AUTO_SATISFIED' ||
      item.submission?.status === 'APPROVED' ||
      item.generatedDocInfo?.status === 'COMPLETED'
    ).length;
    return mandatoryItems.length === 0 || satisfiedMandatoryCount === mandatoryItems.length;
  }, [checklistData])

  const selectProject = React.useCallback((id: string) => {
    uiSelectProject(id)
    if (data) {
      const p = data.find(x => x.id === id)
      if (p) router.push(routes.project.details(p.mine_cd))
    }
  }, [data, uiSelectProject, router])

  const handleDelete = async () => {
    if (!projectToDelete) return
    if (deleteConfirmName !== projectToDelete.name) return
    try {
      const r = await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to delete project');
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteConfirmOpen(false);
      setDeleteConfirmName('');
      if (projectToDelete.id === selectedProjectId) {
        setViewMode('list');
      }
      setProjectToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting project');
    }
  }

  // ... rest of the code until render ...

  // Sync viewMode if we navigated back to the list URL or entered a details URL
  React.useEffect(() => {
    if (!initialMineCd && user?.scope?.level !== 'UNIT') {
      setViewMode('list')
    } else if (initialMineCd) {
      setViewMode('details')
    }
  }, [initialMineCd, user?.scope?.level])

  React.useEffect(() => {
    if (data && data.length > 0 && !selectedProjectId) {
      if (initialMineCd) {
        const found = data.find(p => p.mine_cd === initialMineCd || p.id === initialMineCd)
        if (found) {
          selectProject(found.id)
          setViewMode('details')
        } else {
          selectProject(data[0].id)
          if (user?.scope?.level === 'UNIT') setViewMode('details')
        }
      } else {
        if (user?.scope?.level === 'UNIT') {
          selectProject(data[0].id)
          setViewMode('details')
        }
      }
    }
  }, [data, initialMineCd, selectProject, selectedProjectId, user?.scope?.level])

  // If the selected project no longer exists (deleted), fall back to first
  const project = React.useMemo(() => {
    if (!data || data.length === 0) return undefined
    return data.find((p) => p.id === selectedProjectId) ?? data[0]
  }, [data, selectedProjectId])

  const editInitial: any = React.useMemo(() => {
    if (!project) return null
    return {
      proj_nm: project.name || '',
      proj_cd: project.proj_cd || '',
      ecl_proj_cd: project.ecl_proj_cd || '',
      proj_status: project.status || 'ACTIVE',
      mine_cd: project.mine_cd || (project.mine_cds && project.mine_cds.length > 0 ? project.mine_cds[0] : ''),
      state_lgd: project.state_lgd ? String(project.state_lgd) : '',
      area_cd: project.area_cd || '',
      district_lgd: Array.isArray(project.district_lgd) && project.district_lgd.length > 0 ? String(project.district_lgd[0]) : (project.district_lgd ? String(project.district_lgd) : ''),
      block_lgds: Array.isArray(project.block_lgd) ? project.block_lgd.map(String) : (project.block_lgd ? [String(project.block_lgd)] : []),
      mouza_lgds: project.mouza_lgds?.map(String) || [],
      is_combo_project: project.mine_cds && project.mine_cds.length > 1,
      linked_mine_codes: project.mine_cds || [],
      
      // Land Limits (Type-Wise)
      approved_tenancy_area: Number(project.approved_tenancy_area || 0),
      approved_govt_area: Number(project.approved_govt_area || 0),
      approved_forest_area: Number(project.approved_forest_area || 0),
      approved_patta_area: Number(project.approved_patta_area || 0),
      
      // Operational Limits (Use-Wise)
      approved_excavation_area: Number(project.approved_excavation_area || 0),
      approved_safety_zone_area: Number(project.approved_safety_zone_area || 0),
      approved_ob_dump_area: Number(project.approved_ob_dump_area || 0),
      approved_infra_area: Number(project.approved_infra_area || 0),
      approved_diversion_area: Number(project.approved_diversion_area || 0),
      approved_rehab_area: Number(project.approved_rehab_area || 0),

      land_budget: Number((project as any).land_budget || 0),
      rr_budget: Number((project as any).rr_budget || 0),
      sanctioned_employment_count: Number(project.total_employment_quota || 0),
    }
  }, [project])

  const plotFeatures: PlotFeature[] = React.useMemo(() => {
    if (!project) return []
    // Synthetic geometry: place plots in a grid inside the boundary box
    return project.plots.map((p, i) => {
      const row = Math.floor(i / 3), col = i % 3
      const x = 84.05 + col * 0.03, y = 21.45 + row * 0.03
      return {
        id: p.id,
        plot_number: p.plot_number,
        land_type: p.land_type as PlotFeature['land_type'],
        area_acres: p.area_acres,
        geometry: [[x, y], [x + 0.025, y], [x + 0.025, y + 0.025], [x, y + 0.025], [x, y]],
        selected: p.id === selectedPlotId,
      }
    })
  }, [project, selectedPlotId])

  const clearances = React.useMemo(() => {
    if (!project?.statutory_clearances) return []
    try { return JSON.parse(project.statutory_clearances) as Array<{ authority: string; referenceNo: string; issuedOn: string }> } catch { return [] }
  }, [project])

  if (isLoading) {
    return <div className="space-y-3"><div className="h-32 animate-pulse rounded-lg bg-muted" /><div className="h-64 animate-pulse rounded-lg bg-muted" /></div>
  }

  if (viewMode === 'list' && user?.scope?.level !== 'UNIT') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BackButton iconOnly onClick={() => {
              if (window.history.length > 2) router.back();
              else router.push('/dashboard');
            }} />
            <div>
              <h2 className="text-xl font-bold tracking-tight">{t('project_master.title', 'Project Master')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('project_master.no_projects_desc', 'Select a project to view details or create a new one.')}</p>
            </div>
          </div>
          <Can permission="project.create">
            <Button onClick={() => { setCreateFormKey(k => k + 1); setCreateOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> {t('project_master.new_project', 'New Project')}
            </Button>
          </Can>
        </div>
        
        <ProjectList 
          projects={data || []} 
          selectedProjectId={selectedProjectId || undefined}
          onSelectProject={(id) => {
            selectProject(id)
            setViewMode('details')
          }} 
        />

        <ProjectFormDialog 
          key={`create-dialog-${createFormKey}`}
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          initial={EMPTY_FORM}
          onSaved={(id) => { selectProject(id); setViewMode('details') }}
        />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t('project_master.title', 'Project Master')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('project_master.no_projects_desc', 'No projects yet — create one to get started.')}</p>
          </div>
          <Can permission="project.create">
            <Button onClick={() => { setCreateFormKey(k => k + 1); setCreateOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> {t('project_master.new_project', 'New Project')}
            </Button>
          </Can>
        </div>
        <ProjectFormDialog 
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          initial={EMPTY_FORM}
          onSaved={(id) => selectProject(id)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BackButton iconOnly onClick={() => {
              if (window.history.length > 2) router.back();
              else router.push('/projects');
            }} />
            <h2 className="text-xl font-bold tracking-tight">{project.name}</h2>
            {project.isLocked ? (
              <Badge variant="outline" className="gap-1 bg-secondary text-secondary-foreground"><Lock className="h-3 w-3" /> {t('project_master.baseline_locked', 'Baseline Locked')}</Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">{t('project_master.draft_status', 'Draft — not locked')}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground ml-10">
            {t('project_master.colliery_code', 'Colliery code')} <span className="font-mono">{project.ecl_proj_cd || project.mine_cd}</span> · {t('project_master.locked_on', 'locked on')}{' '}
            {project.locked_at ? new Date(project.locked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EntityFileManagerTrigger
            entityType="project"
            entityId={project.id}
            variant="outline"
          />
          <Can permission="project.create">
            <Button onClick={() => { setCreateFormKey(k => k + 1); setCreateOpen(true); }} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> {t('project_master.new_project', 'New Project')}
            </Button>
          </Can>
          {!project.isLocked && (
            <>
              <Can permission="project.edit">
                <Button onClick={() => { setEditFormKey(k => k + 1); setEditOpen(true); }} variant="outline">
                  <Pencil className="mr-2 h-4 w-4" /> {t('common.edit', 'Edit')}
                </Button>
              </Can>
              <Can permission="project.delete">
                <Button 
                  onClick={() => {
                    setProjectToDelete({ id: project.id, name: project.name });
                    setDeleteConfirmName('');
                    setDeleteConfirmOpen(true);
                  }} 
                  variant="outline" 
                  className="text-destructive hover:bg-destructive/10 border-destructive/20"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" /> Delete
                </Button>
              </Can>
              <Can permission="project.lock">
                <span title={!isChecklistComplete ? "Please complete all mandatory project files and clearances below before locking the baseline." : ""}>
                  <Button
                    onClick={() => setLockOpen(true)}
                    variant="default"
                    disabled={!isChecklistComplete}
                  >
                    <Lock className="mr-2 h-4 w-4" /> {t('project_master.lock_baseline_btn', 'Lock Baseline')}
                  </Button>
                </span>
              </Can>
            </>
          )}
          {project.isLocked && (
            <Can permission="project.edit">
              <Button onClick={() => setFormXXIIOpen(true)} variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                <FileWarning className="mr-2 h-4 w-4" /> Simulate Form-XXII
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* Project selector pills (only when multiple projects exist) */}
      {data && data.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('project_master.switch_project', 'Switch project:')}</span>
          {data.map((p) => {
            const active = p.id === project.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { selectProject(p.id); }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {p.isLocked && <Lock className="h-3 w-3" />}
                {p.name}
                {!p.isLocked && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Baseline not locked alert */}
      {!project.isLocked && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('project_master.baseline_not_locked_title', 'Baseline not locked')}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3 justify-between">
            <span>
              {t('project_master.baseline_not_locked_desc', 'This project is still in draft. Downstream modules (Form-I claims, compensation payrolls, Form-D ledger) cannot bind to an unlocked baseline. Lock it to enable acquisition workflows.')}
            </span>
            <div className="flex gap-2">
              <Can permission="project.delete">
                <Button
                  size="sm"
                  onClick={() => {
                    setProjectToDelete({ id: project.id, name: project.name });
                    setDeleteConfirmName('');
                    setDeleteConfirmOpen(true);
                  }}
                  variant="outline"
                  className="bg-background border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <AlertTriangle className="mr-2 h-3.5 w-3.5" /> Delete
                </Button>
              </Can>
              <span title={!isChecklistComplete ? "Please complete all mandatory project files and clearances below before locking the baseline." : ""}>
                <Button
                  size="sm"
                  onClick={() => setLockOpen(true)}
                  variant="destructive"
                  disabled={!isChecklistComplete}
                >
                  <Lock className="mr-2 h-3.5 w-3.5" /> {t('project_master.lock_baseline_btn', 'Lock Baseline')}
                </Button>
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Baseline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t('project_master.stats.land_limit', 'Land Limit')} value={`${formatNumber(project.total_land_limit_acres, 4)} ac`} icon={MapPin} accent="emerald" />
        <StatTile label={t('project_master.stats.budget_ceiling', 'Budget Ceiling')} value={formatINR(project.total_budget_ceiling)} icon={IndianRupee} accent="amber" sublabel={t('project_master.stats.utilized_pct', { defaultValue: 'utilized {{pct}}%', pct: project.budgetUtilization })} />
        <StatTile label={t('project_master.stats.employment_quota', 'Employment Quota')} value={project.total_employment_quota} icon={Users} accent="violet" sublabel={t('project_master.stats.statutory_jobs', 'statutory jobs')} />
        <StatTile label={t('project_master.stats.plots_registered', 'Plots Registered')} value={project.plots.length} icon={FileText} accent="teal" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Files & Clearances, GIS Map */}
        <div className="space-y-6 lg:col-span-2">
          <GenericChecklistWorkspace
            key={`checklist-${project.id}`}
            moduleCode="PROJECT_MASTER"
            checkableType="project"
            checkableId={project.id}
            userId={user?.id || 'system'}
            readonly={project.isLocked}
          />
          <ProjectBoundarySection project={project} />
        </div>

        {/* Right Side: Compliances, Proposals, Approvals, Properties */}
        <div className="space-y-6 lg:col-span-1">
          <ProjectPropertiesCard project={project} />
          
          {/* Budget progress */}
          <SectionCard title={t('project_master.budget_compliance.title', 'Budget Compliance')} icon={IndianRupee} description={t('project_master.budget_compliance.desc', 'WithinProjectBaseline guard — payslips cannot exceed ceiling')}>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">{t('project_master.budget_compliance.disbursed', 'Disbursed vs. ceiling')}</span>
                <span className="text-sm tabular-nums">
                  <span className="font-semibold">{formatINR(project.totalDisbursed)}</span>
                  <span className="text-muted-foreground"> / {formatINR(project.total_budget_ceiling)}</span>
                </span>
              </div>
              <Progress value={Number(project.budgetUtilization)} className="h-3" indicatorClassName={Number(project.budgetUtilization) < 80 ? 'bg-primary' : 'bg-destructive'} />
              <p className="text-xs text-muted-foreground">
                {Number(project.budgetUtilization) < 80
                  ? `✓ ${t('project_master.budget_compliance.within_baseline', { defaultValue: 'Within baseline — {{pct}}% utilized, headroom for {{count}} active payroll(s).', pct: project.budgetUtilization, count: project.payrollCount })}`
                  : `⚠ ${t('project_master.budget_compliance.breach_warning', 'Approaching ceiling — baseline breach will route payrolls to Board Escalation.')}`}
              </p>
            </div>
          </SectionCard>

          {/* Area progress */}
          <SectionCard title="Area Compliance" icon={MapPin} description="WithinProjectBaseline guard — acquisitions limit">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Acquired vs. Limit</span>
                <span className="text-sm tabular-nums">
                  <span className="font-semibold">{formatNumber(project.total_acquired_area, 2)} ac</span>
                  <span className="text-muted-foreground"> / {formatNumber(project.total_land_limit_acres, 2)} ac</span>
                </span>
              </div>
              <Progress value={Number(project.areaUtilization)} className="h-3" indicatorClassName={Number(project.areaUtilization) < 95 ? 'bg-emerald-500' : 'bg-destructive'} />
              <p className="text-xs text-muted-foreground">
                {Number(project.areaUtilization) < 95
                  ? `✓ Within baseline — ${Number(project.areaUtilization).toFixed(1)}% acquired.`
                  : `⚠ Approaching or exceeding area limit — requires Form-XXII deviation.`}
              </p>
            </div>
          </SectionCard>

          <ProjectProposalsList projectId={project.id} />
          <ProjectBoardApprovals projectId={project.id} />
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
        setDeleteConfirmOpen(open)
        if (!open) {
          setDeleteConfirmName('')
          setProjectToDelete(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              All associated data will be permanently removed.
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
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteConfirmName !== projectToDelete?.name}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProjectFormDialog 
        key={`create-dialog-${createFormKey}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        initial={EMPTY_FORM}
        onSaved={(id) => selectProject(id)}
      />
      <ProjectFormDialog 
        key={`edit-dialog-${editFormKey}`}
        open={editOpen}
        onOpenChange={(v) => { setEditOpen(v); if (v) setEditFormKey(k => k + 1) }}
        mode="edit"
        project_id={project.id}
        initial={editInitial!}
      />
      <LockBaselineDialog open={lockOpen} onOpenChange={setLockOpen} project={project} />
      <FormXXIIModal open={formXXIIOpen} onOpenChange={setFormXXIIOpen} project={project} />
    </div>
  )
}

export default ProjectMasterView

