'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { MasterCascade } from '@/core/master-lookup/components/MasterCascade'
import { MasterFormLookup } from '@/core/master-lookup/components/MasterFormLookup'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, StatTile, GISMapViewer, DataTable, DocumentUploader } from '@/components/coalrr'
import type { Column, PlotFeature } from '@/components/coalrr'
import type { UploadedDoc } from '@/components/coalrr'
import { formatINR, formatNumber,  } from '@/lib/utils/formatters'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { useUiState } from '@/providers/UiStateProvider'
import { routes } from '@/lib/url/UrlService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  Building2, MapPin, Lock, ShieldCheck, IndianRupee, Users, FileText, TreePine,
  Plus, Pencil, AlertTriangle, CheckCircle2, Loader2, FileWarning, Download,
} from 'lucide-react'
import { Can } from '@/authorization/components/Can'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { ProjectFormDialog, ProjectFormValues } from './ProjectFormDialog'
import { LockBaselineDialog } from './LockBaselineDialog'
import { FormXXIIModal } from './FormXXIIModal'
import { ProjectFilesSection } from './ProjectFilesSection'
import { ProjectBoundarySection } from './ProjectBoundarySection'

export const EMPTY_FORM: ProjectFormValues = {
  name: '',
  mine_cd: '',
  area_cd: '',
  total_land_limit_acres: 0,
  land_budget: 0,
  rr_budget: 0,
  total_employment_quota: 0,
}

interface ProjectData {
  id: string; name: string; mine_cd: string; ecl_proj_cd?: string;
  area_cd?: string; state_lgd?: bigint; district_lgd?: string; block_lgd?: string; mouza_lgds?: string[]; pr_docs?: UploadedDoc[]
  total_land_limit_acres: string; total_budget_ceiling: string; total_employment_quota: number
  total_acquired_area: string; areaUtilization: number;
  boundary: string; statutory_clearances: string | null
  locked_at: string | null; isLocked: boolean
  payrollCount: number; totalDisbursed: string; budgetUtilization: string
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
  const r = await fetch('/api/projects')
  if (!r.ok) throw new Error('Failed to load projects')
  const json = await r.json()
  return json.data || json
}

// ─── Project form payload (shared by create + edit) ────────────────────────
// Removed inline dialogs

// ─── Main view ─────────────────────────────────────────────────────────────
// ─── Form-XXII Approvals Section ──────────────────────────────────────────
function FormXXIISection({ projectId }: { projectId: string }) {
  const t = useAppTranslation('project_master')
  const { data, isLoading } = useQuery<{ approvals: FormXXIIApproval[] }>({
    queryKey: ['project-form-xxii', projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/form-xxii`)
      if (!r.ok) throw new Error(t('project_master.form_xxii_error', 'Failed to load Form-XXII approvals'))
      const json = await r.json()
      return json.data ?? json
    },
    enabled: !!projectId,
  })

  const approvals = data?.approvals ?? []
  if (!isLoading && approvals.length === 0) return null

  return (
    <SectionCard
      title={t('project_master.form_xxii_title', 'Board Deviation Approvals (Form-XXII)')}
      icon={FileWarning}
      description={t('project_master.form_xxii_desc', 'Proposals that exceeded project limits and received formal Board approval')}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading_approvals', 'Loading approvals…')}
        </div>
      ) : (
        <ul className="space-y-3">
          {approvals.map((a) => (
            <li
              key={a.proposal_id}
              className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-mono text-xs font-semibold text-emerald-700">{a.schedule_code}</span>
                  <Badge variant="outline" className="text-[10px] bg-background">
                    {a.state}
                  </Badge>
                </div>
                {a.proposal_title && (
                  <p className="text-sm text-foreground truncate">{a.proposal_title}</p>
                )}
                {a.file && (
                  <p className="text-[11px] text-muted-foreground">
                    {t('common.uploaded', 'Uploaded')} {new Date(a.file.attached_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    {a.file.size_bytes && (
                      <> · {(Number(a.file.size_bytes) / 1024).toFixed(1)} KB</>
                    )}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {a.file && (
                  <Button variant="outline" size="sm" asChild className="h-8 bg-background">
                    <a href={`/api/files/${a.file.file_id}/download`} target="_blank" rel="noreferrer">
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      {a.file.original_name}
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild className="h-8 text-muted-foreground hover:text-foreground">
                  <a href={`/proposals?schedule_id=${a.proposal_id}`}>
                    {t('common.view_proposal', 'View Proposal →')}
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}



export function ProjectMasterView({ initialMineCd }: { initialMineCd?: string }) {
  const t = useAppTranslation('project_master')
  const { selectedProjectId, selectProject: uiSelectProject } = useUiState()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  const [selectedPlotId, setSelectedPlotId] = React.useState<string | null>(null)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [lockOpen, setLockOpen] = React.useState(false)
  const [formXXIIOpen, setFormXXIIOpen] = React.useState(false)
  // Increment keys every time dialogs open to force fresh remount of useForm
  const [editFormKey, setEditFormKey] = React.useState(0)
  const [createFormKey, setCreateFormKey] = React.useState(0)

  const selectProject = React.useCallback((id: string) => {
    uiSelectProject(id)
    if (data) {
      const p = data.find(x => x.id === id)
      if (p) window.history.pushState(null, '', routes.project.details(p.mine_cd))
    }
  }, [data, uiSelectProject])

  React.useEffect(() => {
    if (data && data.length > 0 && !selectedProjectId) {
      if (initialMineCd) {
        const found = data.find(p => p.mine_cd === initialMineCd || p.id === initialMineCd)
        if (found) selectProject(found.id)
        else selectProject(data[0].id)
      } else {
        selectProject(data[0].id)
      }
    }
  }, [data, initialMineCd, selectProject, selectedProjectId])

  // If the selected project no longer exists (deleted), fall back to first
  const project = React.useMemo(() => {
    if (!data || data.length === 0) return undefined
    return data.find((p) => p.id === selectedProjectId) ?? data[0]
  }, [data, selectedProjectId])

  // Memoize edit form initial values — stable reference prevents spurious useEffect triggers
  const editInitial = React.useMemo(() => {
    if (!project) return null
    return {
      name: project.name,
      mine_cd: project.mine_cd,
      // Pass as strings — buildFormValues in ProjectFormDialog handles BigInt coercion for state_lgd
      state_lgd: project.state_lgd ? String(project.state_lgd) : undefined,
      area_cd: project.area_cd || undefined,
      // district_lgd / block_lgd are UI-only cascade selectors — keep as strings
      district_lgd: project.district_lgd || undefined,
      block_lgd: project.block_lgd || undefined,
      // mouza_lgds submitted as strings, Zod coerces to bigint on the server
      mouza_lgds: project.mouza_lgds?.map(String) || [],
      pr_docs: (project.pr_docs as any) || [],
      total_land_limit_acres: Number(project.total_land_limit_acres),
      land_budget: Number((project as any).land_budget || 0),
      rr_budget: Number((project as any).rr_budget || 0),
      total_employment_quota: project.total_employment_quota,
    }
  }, [project?.id, project?.name, project?.mine_cd, project?.state_lgd, project?.area_cd,
      project?.district_lgd, project?.block_lgd,
      JSON.stringify(project?.mouza_lgds), JSON.stringify(project?.pr_docs),
      project?.total_land_limit_acres, (project as any)?.land_budget, (project as any)?.rr_budget, project?.total_employment_quota])

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
            <h2 className="text-xl font-bold tracking-tight">{project.name}</h2>
            {project.isLocked ? (
              <Badge variant="outline" className="gap-1 bg-secondary text-secondary-foreground"><Lock className="h-3 w-3" /> {t('project_master.baseline_locked', 'Baseline Locked')}</Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">{t('project_master.draft_status', 'Draft — not locked')}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('project_master.colliery_code', 'Colliery code')} <span className="font-mono">{project.ecl_proj_cd || project.mine_cd}</span> · {t('project_master.locked_on', 'locked on')}{' '}
            {project.locked_at ? new Date(project.locked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              <Can permission="project.lock">
                <Button
                  onClick={() => setLockOpen(true)}
                  variant="default"
                >
                  <Lock className="mr-2 h-4 w-4" /> {t('project_master.lock_baseline_btn', 'Lock Baseline')}
                </Button>
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
                onClick={() => { selectProject(p.id); window.history.pushState(null, '', routes.project.details(p.mine_cd)); }}
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
            <Button
              size="sm"
              onClick={() => setLockOpen(true)}
              variant="destructive"
            >
              <Lock className="mr-2 h-3.5 w-3.5" /> {t('project_master.lock_baseline_btn', 'Lock Baseline')}
            </Button>
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Modals */}
        <LockBaselineDialog open={lockOpen} onOpenChange={setLockOpen} project={project} />
        <FormXXIIModal open={formXXIIOpen} onOpenChange={setFormXXIIOpen} project={project} />
        {/* GIS Map */}
        <div className="lg:col-span-2">
          <ProjectBoundarySection project={project} />
        </div>

        {/* Statutory clearances & Files */}
        <ProjectFilesSection projectId={project.id} prDocs={project.pr_docs} />
      </div>

      {/* Plot schedule table */}
      <SectionCard title={t('project_master.plot_schedule.title', 'Plot Schedule')} icon={TreePine} description={t('project_master.plot_schedule.desc', 'Master land registry (LIS mirror) with exhausted-area-for-jobs denormalized column')}>
        <DataTable
          columns={[
            { key: 'plot_number', header: t('project_master.plot_schedule.cols.plot', 'Plot'), sortable: true, render: (r) => <span className="font-mono text-xs font-medium">{r.plot_number}</span> },
            { key: 'mouza', header: t('project_master.plot_schedule.cols.mouza', 'Mouza'), sortable: true },
            { key: 'land_type', header: t('project_master.plot_schedule.cols.type', 'Type'), render: (r) => <Badge variant="outline" className="text-xs">{r.land_type}</Badge> },
            { key: 'area_acres', header: t('project_master.plot_schedule.cols.area', 'Area (ac)'), align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{formatNumber(r.area_acres, 4)}</span> },
            { key: 'exhausted_area_for_jobs', header: t('project_master.plot_schedule.cols.exhausted', 'Exhausted (jobs)'), align: 'right', render: (r) => <span className="tabular-nums text-muted-foreground">{formatNumber(r.exhausted_area_for_jobs, 4)}</span> },
            { key: 'remaining_job_quota', header: t('project_master.plot_schedule.cols.job_quota', 'Job Quota'), align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{r.remaining_job_quota}</span> },
          ] as Column<ProjectData['plots'][0]>[]}
          data={project.plots}
          getRowId={(r) => r.id}
          onRowClick={(r) => setSelectedPlotId(r.id)}
          pageSize={10}
        />
      </SectionCard>

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
      <SectionCard title="Area Compliance" icon={MapPin} description="WithinProjectBaseline guard — land acquisitions cannot exceed approved limit">
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

      {/* Form-XXII Board Approvals */}
      <FormXXIISection projectId={project.id} />

      {/* Dialogs */}
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
    </div>
  )
}

export default ProjectMasterView

