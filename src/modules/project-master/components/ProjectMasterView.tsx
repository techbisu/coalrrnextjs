'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, StatTile, GISMapViewer, DataTable } from '@/components/coalrr'
import type { Column, PlotFeature } from '@/components/coalrr'
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
  Plus, Pencil, AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react'
import { Can } from '@/authorization/components/Can'

interface ProjectData {
  id: string; name: string; collieryCode: string
  totalLandLimitAcres: string; totalBudgetCeiling: string; totalEmploymentQuota: number
  boundary: string; statutoryClearances: string | null
  lockedAt: string | null; isLocked: boolean
  payrollCount: number; totalDisbursed: string; budgetUtilization: string
  plots: Array<{ id: string; plotNumber: string; mouza: string; landType: string; areaAcres: string; exhaustedAreaForJobs: string; remainingJobQuota: number }>
}

async function fetchProjects(): Promise<ProjectData[]> {
  const r = await fetch('/api/projects')
  if (!r.ok) throw new Error('Failed to load projects')
  const json = await r.json()
  return json.data ?? json // Handle both raw array or wrapped { data: [] }
}

// ─── Project form payload (shared by create + edit) ────────────────────────
interface ProjectFormValues {
  name: string
  collieryCode: string
  totalLandLimitAcres: string
  totalBudgetCeiling: string
  totalEmploymentQuota: number
}

const EMPTY_FORM: ProjectFormValues = {
  name: '',
  collieryCode: '',
  totalLandLimitAcres: '',
  totalBudgetCeiling: '',
  totalEmploymentQuota: 0,
}

// ─── Create / Edit dialog ──────────────────────────────────────────────────
function ProjectFormDialog({
  open, onOpenChange, mode, initial, projectId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: 'create' | 'edit'
  initial: ProjectFormValues
  projectId?: string
  onSaved?: (id: string) => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = React.useState<ProjectFormValues>(initial)

  // Re-sync when dialog reopens / target changes
  React.useEffect(() => {
    if (open) setForm(initial)
  }, [open, initial])

  const isEdit = mode === 'edit'

  const mutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      if (isEdit) {
        if (!projectId) throw new Error('Missing project id for edit')
        const r = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const json = await r.json()
        if (!r.ok) throw new Error(json?.error ?? 'Failed to update project')
        return json
      } else {
        const r = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const json = await r.json()
        if (!r.ok) throw new Error(json?.error ?? 'Failed to create project')
        return json
      }
    },
    onSuccess: (data) => {
      toast.success(isEdit ? 'Project updated.' : `Project "${data.name}" created as draft.`)
      qc.invalidateQueries({ queryKey: ['projects'] })
      onOpenChange(false)
      onSaved?.(data.id)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const submit = () => {
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.collieryCode.trim()) return toast.error('Colliery code is required')
    if (Number(form.totalLandLimitAcres) <= 0) return toast.error('Land limit must be > 0')
    if (Number(form.totalBudgetCeiling) <= 0) return toast.error('Budget ceiling must be > 0')
    mutation.mutate(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project Baseline' : 'New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update draft baseline details. Once locked, these fields become immutable.'
              : 'Create a new draft project baseline. The baseline can be edited until it is locked.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="proj-name">Project name</Label>
            <Input
              id="proj-name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bhubaneswari OCP Phase-III"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="proj-colliery">Colliery code</Label>
            <Input
              id="proj-colliery" value={form.collieryCode}
              onChange={(e) => setForm({ ...form, collieryCode: e.target.value })}
              placeholder="e.g. BHP/03" className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="proj-land">Land limit (acres)</Label>
              <Input
                id="proj-land" inputMode="decimal" value={form.totalLandLimitAcres}
                onChange={(e) => setForm({ ...form, totalLandLimitAcres: e.target.value })}
                placeholder="450.0000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="proj-quota">Employment quota</Label>
              <Input
                id="proj-quota" inputMode="numeric" type="number"
                value={form.totalEmploymentQuota}
                onChange={(e) => setForm({ ...form, totalEmploymentQuota: Number(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="proj-budget">Total budget ceiling (₹)</Label>
            <Input
              id="proj-budget" inputMode="decimal" value={form.totalBudgetCeiling}
              onChange={(e) => setForm({ ...form, totalBudgetCeiling: e.target.value })}
              placeholder="18750000000"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Lock baseline confirmation dialog ─────────────────────────────────────
function LockBaselineDialog({
  open, onOpenChange, project,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  project: ProjectData
}) {
  const qc = useQueryClient()
  const [typedName, setTypedName] = React.useState('')

  React.useEffect(() => {
    if (open) setTypedName('')
  }, [open])

  const nameMatches = typedName.trim() === project.name

  const lockMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/projects/${project.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: typedName.trim() }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json?.error ?? 'Failed to lock baseline')
      return json
    },
    onSuccess: () => {
      toast.success(`Baseline LOCKED for "${project.name}".`)
      qc.invalidateQueries({ queryKey: ['projects'] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lock Baseline</DialogTitle>
          <DialogDescription>
            This action is irreversible. Once locked, the project baseline (land limit, budget ceiling,
            employment quota) becomes immutable and downstream modules (Form-I, payrolls, ledger) bind to it.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Irreversible operation</AlertTitle>
          <AlertDescription>
            You are about to lock the baseline for{' '}
            <span className="font-semibold">{project.name}</span>. Type the project name exactly as shown
            below to confirm.
          </AlertDescription>
        </Alert>

        <div className="grid gap-1.5">
          <Label htmlFor="lock-confirm">Type the project name to confirm</Label>
          <Input
            id="lock-confirm"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={project.name}
            className="font-mono"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            {nameMatches
              ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Name matches — ready to lock.</span>
              : <>Expected: <span className="font-mono font-medium">{project.name}</span></>}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={lockMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => lockMutation.mutate()}
            disabled={!nameMatches || lockMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {lockMutation.isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locking…</>
              : <><Lock className="mr-2 h-4 w-4" /> Lock Baseline</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main view ─────────────────────────────────────────────────────────────
export function ProjectMasterView() {
  const { selectedProjectId, selectProject } = useUiState()
  const { data, isLoading } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  const [selectedPlotId, setSelectedPlotId] = React.useState<string | null>(null)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [lockOpen, setLockOpen] = React.useState(false)

  // Auto-select the first project when none is selected
  React.useEffect(() => {
    if (data && data.length > 0 && !selectedProjectId) {
      selectProject(data[0].id)
    }
  }, [data, selectedProjectId, selectProject])

  // If the selected project no longer exists (deleted), fall back to first
  const project = React.useMemo(() => {
    if (!data || data.length === 0) return undefined
    return data.find((p) => p.id === selectedProjectId) ?? data[0]
  }, [data, selectedProjectId])

  const plotFeatures: PlotFeature[] = React.useMemo(() => {
    if (!project) return []
    // Synthetic geometry: place plots in a grid inside the boundary box
    return project.plots.map((p, i) => {
      const row = Math.floor(i / 3), col = i % 3
      const x = 84.05 + col * 0.03, y = 21.45 + row * 0.03
      return {
        id: p.id,
        plotNumber: p.plotNumber,
        landType: p.landType as PlotFeature['landType'],
        areaAcres: p.areaAcres,
        geometry: [[x, y], [x + 0.025, y], [x + 0.025, y + 0.025], [x, y + 0.025], [x, y]],
        selected: p.id === selectedPlotId,
      }
    })
  }, [project, selectedPlotId])

  const boundary = React.useMemo(() => {
    if (!project) return undefined
    try {
      const b = JSON.parse(project.boundary)
      return { coordinates: b.coordinates, color: b.color }
    } catch { return undefined }
  }, [project])

  const clearances = React.useMemo(() => {
    if (!project?.statutoryClearances) return []
    try { return JSON.parse(project.statutoryClearances) as Array<{ authority: string; referenceNo: string; issuedOn: string }> } catch { return [] }
  }, [project])

  if (isLoading) {
    return <div className="space-y-3"><div className="h-32 animate-pulse rounded-lg bg-muted" /><div className="h-64 animate-pulse rounded-lg bg-muted" /></div>
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Project Master</h2>
            <p className="mt-1 text-sm text-muted-foreground">No projects yet — create one to get started.</p>
          </div>
          <Can permission="project.create">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Project
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
              <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Lock className="h-3 w-3" /> Baseline Locked</Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-700">Draft — not locked</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Colliery code <span className="font-mono">{project.collieryCode}</span> · locked on{' '}
            {project.lockedAt ? new Date(project.lockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Can permission="project.create">
            <Button onClick={() => setCreateOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Can>
          {!project.isLocked && (
            <>
              <Can permission="project.edit">
                <Button onClick={() => setEditOpen(true)} variant="outline">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
              </Can>
              <Can permission="project.lock">
                <Button
                  onClick={() => setLockOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Lock className="mr-2 h-4 w-4" /> Lock Baseline
                </Button>
              </Can>
            </>
          )}
        </div>
      </div>

      {/* Project selector pills (only when multiple projects exist) */}
      {data && data.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Switch project:</span>
          {data.map((p) => {
            const active = p.id === project.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { selectProject(p.id); window.history.pushState(null, '', routes.project.details(p.collieryCode)); }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {p.isLocked && <Lock className="h-3 w-3" />}
                {p.name}
                {!p.isLocked && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Baseline not locked alert */}
      {!project.isLocked && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Baseline not locked</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3 justify-between">
            <span>
              This project is still in draft. Downstream modules (Form-I claims, compensation payrolls,
              Form-D ledger) cannot bind to an unlocked baseline. Lock it to enable acquisition workflows.
            </span>
            <Button
              size="sm"
              onClick={() => setLockOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Lock className="mr-2 h-3.5 w-3.5" /> Lock Baseline
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Baseline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Land Limit" value={`${formatNumber(project.totalLandLimitAcres, 4)} ac`} icon={MapPin} accent="emerald" />
        <StatTile label="Budget Ceiling" value={formatINR(project.totalBudgetCeiling)} icon={IndianRupee} accent="amber" sublabel={`utilized ${project.budgetUtilization}%`} />
        <StatTile label="Employment Quota" value={project.totalEmploymentQuota} icon={Users} accent="violet" sublabel="statutory jobs" />
        <StatTile label="Plots Registered" value={project.plots.length} icon={FileText} accent="teal" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* GIS Map */}
        <div className="lg:col-span-2">
          <SectionCard title="Project Boundary & Plots" icon={MapPin} description="PostGIS-style geometry viewer with statutory land-type color coding">
            <GISMapViewer
              boundary={boundary}
              plots={plotFeatures}
              selectedPlotId={selectedPlotId ?? undefined}
              onPlotSelect={setSelectedPlotId}
              height={380}
            />
          </SectionCard>
        </div>

        {/* Statutory clearances */}
        <SectionCard title="Statutory Clearances" icon={ShieldCheck} description="DGMS, Environment, Forest Dept.">
          <ul className="space-y-2">
            {clearances.map((c) => (
              <li key={c.referenceNo} className="rounded-md border border-border/60 bg-card p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.authority}</span>
                  <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700">
                    <ShieldCheck className="h-2.5 w-2.5" /> cleared
                  </Badge>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{c.referenceNo}</p>
                <p className="text-[11px] text-muted-foreground">issued {new Date(c.issuedOn).toLocaleDateString('en-IN')}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Plot schedule table */}
      <SectionCard title="Plot Schedule" icon={TreePine} description="Master land registry (LIS mirror) with exhausted-area-for-jobs denormalized column">
        <DataTable
          columns={[
            { key: 'plotNumber', header: 'Plot', sortable: true, render: (r) => <span className="font-mono text-xs font-medium">{r.plotNumber}</span> },
            { key: 'mouza', header: 'Mouza', sortable: true },
            { key: 'landType', header: 'Type', render: (r) => <Badge variant="outline" className="text-xs">{r.landType}</Badge> },
            { key: 'areaAcres', header: 'Area (ac)', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{formatNumber(r.areaAcres, 4)}</span> },
            { key: 'exhaustedAreaForJobs', header: 'Exhausted (jobs)', align: 'right', render: (r) => <span className="tabular-nums text-muted-foreground">{formatNumber(r.exhaustedAreaForJobs, 4)}</span> },
            { key: 'remainingJobQuota', header: 'Job Quota', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{r.remainingJobQuota}</span> },
          ] as Column<ProjectData['plots'][0]>[]}
          data={project.plots}
          getRowId={(r) => r.id}
          onRowClick={(r) => setSelectedPlotId(r.id)}
          pageSize={10}
        />
      </SectionCard>

      {/* Budget progress */}
      <SectionCard title="Budget Compliance" icon={IndianRupee} description="WithinProjectBaseline guard — payslips cannot exceed ceiling">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm">Disbursed vs. ceiling</span>
            <span className="text-sm tabular-nums">
              <span className="font-semibold">{formatINR(project.totalDisbursed)}</span>
              <span className="text-muted-foreground"> / {formatINR(project.totalBudgetCeiling)}</span>
            </span>
          </div>
          <Progress value={Number(project.budgetUtilization)} className="h-3" indicatorClassName={Number(project.budgetUtilization) < 80 ? 'bg-emerald-500' : 'bg-rose-500'} />
          <p className="text-xs text-muted-foreground">
            {Number(project.budgetUtilization) < 80
              ? `✓ Within baseline — ${project.budgetUtilization}% utilized, headroom for ${project.payrollCount} active payroll(s).`
              : `⚠ Approaching ceiling — baseline breach will route payrolls to Board Escalation.`}
          </p>
        </div>
      </SectionCard>

      {/* Dialogs */}
      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        initial={EMPTY_FORM}
        onSaved={(id) => selectProject(id)}
      />
      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        projectId={project.id}
        initial={{
          name: project.name,
          collieryCode: project.collieryCode,
          totalLandLimitAcres: project.totalLandLimitAcres,
          totalBudgetCeiling: project.totalBudgetCeiling,
          totalEmploymentQuota: project.totalEmploymentQuota,
        }}
      />
      <LockBaselineDialog open={lockOpen} onOpenChange={setLockOpen} project={project} />
    </div>
  )
}

export default ProjectMasterView

