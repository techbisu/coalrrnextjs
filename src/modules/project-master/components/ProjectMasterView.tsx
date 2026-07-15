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

interface ProjectData {
  id: string; name: string; mine_cd: string
  area_cd?: string; state_lgd?: bigint; mouza_lgds?: string[]; pr_docs?: UploadedDoc[]
  total_land_limit_acres: string; total_budget_ceiling: string; total_employment_quota: number
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
interface ProjectFormValues {
  name: string
  mine_cd: string
  area_cd?: string
  state_lgd?: string
  pr_doc_id?: string | null
  pr_docs?: UploadedDoc[]
  total_land_limit_acres: string | number
  total_budget_ceiling: string | number
  total_employment_quota: number
  mouza_lgds?: string[]
}

const EMPTY_FORM: ProjectFormValues = {
  name: '',
  mine_cd: '',
  area_cd: '',
  total_land_limit_acres: '',
  total_budget_ceiling: '',
  total_employment_quota: 0,
}

// ─── Create / Edit dialog ──────────────────────────────────────────────────
function ProjectFormDialog({
  open, onOpenChange, mode, initial, project_id, onSaved, user
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: 'create' | 'edit'
  initial: ProjectFormValues
  project_id?: string
  onSaved?: (id: string) => void
  user?: any
}) {
  const qc = useQueryClient()
  const isEdit = mode === 'edit'

  const [uploadedDocs, setUploadedDocs] = React.useState<UploadedDoc[]>(initial.pr_docs || [])
  
  const handleDocUpload = React.useCallback(async (file: File) => {
    try {
       const formData = new FormData();
       formData.append('file', file);
       const res = await fetch('/api/files/upload', {
         method: 'POST',
         body: formData,
       });
       if (!res.ok) throw new Error('Upload failed');
       const data = await res.json();
       const newDoc: UploadedDoc = {
         id: data.file_id,
         file_name: file.name,
         file_size_kb: Math.round(file.size / 1024),
         mime_type: file.type,
         virus_scan_status: 'clean'
       };
       setUploadedDocs(prev => [...prev, newDoc]);
       toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
       toast.error('Failed to upload file');
    }
  }, [])
  
  const handleDocRemove = React.useCallback((doc: UploadedDoc) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== doc.id));
  }, [])

  
  const form = useForm<ProjectFormValues>({
    defaultValues: {
      ...initial,
      state_lgd: user?.state_lgd || initial.state_lgd,
      area_cd: user?.area_cd || initial.area_cd,
    }
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        ...initial,
        state_lgd: user?.state_lgd || initial.state_lgd,
        area_cd: user?.area_cd || initial.area_cd,
      })
    }
  }, [open, initial, form, user])

  const mutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      // Cast bigints to string for JSON serialization if necessary
      const payload = {
        ...values,
        state_lgd: values.state_lgd ? String(values.state_lgd) : undefined,
        mouza_lgds: values.mouza_lgds 
          ? (Array.isArray(values.mouza_lgds) ? values.mouza_lgds.map(String) : [String(values.mouza_lgds)])
          : [],
        pr_doc_id: uploadedDocs.length > 0 ? uploadedDocs[0].id : null,
      }

      if (isEdit) {
        if (!project_id) throw new Error('Missing project id for edit')
        const r = await fetch(`/api/projects/${project_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await r.json()
        if (!r.ok) throw new Error(json?.error ?? 'Failed to update project')
        return json
      } else {
        const r = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project Baseline' : 'New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update draft baseline details. Once locked, these fields become immutable.'
              : 'Create a new draft project baseline. The baseline can be edited until it is locked.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Project name</Label>
            <Input {...form.register('name')} placeholder="e.g. Bhubaneswari OCP Phase-III" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>State</Label>
              <MasterFormLookup
                control={form.control as any}
                name="state_lgd"
                master="state_master"
                placeholder="Select State..."
                disabled={!!user?.state_lgd}
                searchable
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Area</Label>
              <MasterCascade
                control={form.control as any}
                chain={[
                  {
                    master: 'area_master',
                    name: 'area_cd',
                    dependsOnField: 'state_lgd',
                    dependsOnParam: 'state_lgd',
                    placeholder: 'Select Area...',
                    searchable: true
                  }
                ]}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Mine / Colliery</Label>
              <MasterCascade
                control={form.control as any}
                chain={[
                  {
                    master: 'mine_master',
                    name: 'mine_cd',
                    dependsOnField: 'area_cd',
                    dependsOnParam: 'area_cd',
                    placeholder: 'Select Mine...',
                    searchable: true
                  }
                ]}
              />
            </div>

            <div className="grid gap-2">
              <Label>Mapped Mouzas</Label>
              <MasterFormLookup
                control={form.control as any}
                name="mouza_lgds"
                master="mouza_master"
                placeholder="Select Mouzas..."
                searchable
                isMulti
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Land limit (acres)</Label>
              <Input
                {...form.register('total_land_limit_acres')}
                inputMode="decimal"
                placeholder="450.0000"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Employment quota</Label>
              <Input
                {...form.register('total_employment_quota', { valueAsNumber: true })}
                type="number"
                inputMode="numeric"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Total budget ceiling (₹)</Label>
            <Input
              {...form.register('total_budget_ceiling')}
              inputMode="decimal"
              placeholder="18750000000"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Approved PR Document</Label>
            <DocumentUploader
              checklist_item_key="PR-DOCS"
              label="Upload document"
              documents={uploadedDocs}
              onUpload={handleDocUpload}
              onRemove={handleDocRemove}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
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
// ─── Form-XXII Approvals Section ──────────────────────────────────────────
function FormXXIISection({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery<{ approvals: FormXXIIApproval[] }>({
    queryKey: ['project-form-xxii', projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/form-xxii`)
      if (!r.ok) throw new Error('Failed to load Form-XXII approvals')
      const json = await r.json()
      return json.data ?? json
    },
    enabled: !!projectId,
  })

  const approvals = data?.approvals ?? []
  if (!isLoading && approvals.length === 0) return null

  return (
    <SectionCard
      title="Board Deviation Approvals (Form-XXII)"
      icon={FileWarning}
      description="Proposals that exceeded project limits and received formal Board approval"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading approvals…
        </div>
      ) : (
        <ul className="space-y-3">
          {approvals.map((a) => (
            <li
              key={a.proposal_id}
              className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50/40 p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  <span className="font-mono text-xs font-semibold text-green-800">{a.schedule_code}</span>
                  <Badge variant="outline" className="text-[10px] border-green-300 text-green-700 bg-white">
                    {a.state}
                  </Badge>
                </div>
                {a.proposal_title && (
                  <p className="text-sm text-foreground truncate">{a.proposal_title}</p>
                )}
                {a.file && (
                  <p className="text-[11px] text-muted-foreground">
                    Uploaded {new Date(a.file.attached_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    {a.file.size_bytes && (
                      <> · {(Number(a.file.size_bytes) / 1024).toFixed(1)} KB</>
                    )}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {a.file && (
                  <Button variant="outline" size="sm" asChild className="h-8 text-green-700 border-green-300 hover:bg-green-50 bg-white">
                    <a href={`/api/files/${a.file.file_id}/download`} target="_blank" rel="noreferrer">
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      {a.file.original_name}
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild className="h-8 text-muted-foreground hover:text-foreground">
                  <a href={`/proposals?schedule_id=${a.proposal_id}`}>
                    View Proposal →
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
        plot_number: p.plot_number,
        land_type: p.land_type as PlotFeature['land_type'],
        area_acres: p.area_acres,
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
            Colliery code <span className="font-mono">{project.mine_cd}</span> · locked on{' '}
            {project.locked_at ? new Date(project.locked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
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
                onClick={() => { selectProject(p.id); window.history.pushState(null, '', routes.project.details(p.mine_cd)); }}
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
        <StatTile label="Land Limit" value={`${formatNumber(project.total_land_limit_acres, 4)} ac`} icon={MapPin} accent="emerald" />
        <StatTile label="Budget Ceiling" value={formatINR(project.total_budget_ceiling)} icon={IndianRupee} accent="amber" sublabel={`utilized ${project.budgetUtilization}%`} />
        <StatTile label="Employment Quota" value={project.total_employment_quota} icon={Users} accent="violet" sublabel="statutory jobs" />
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
            { key: 'plot_number', header: 'Plot', sortable: true, render: (r) => <span className="font-mono text-xs font-medium">{r.plot_number}</span> },
            { key: 'mouza', header: 'Mouza', sortable: true },
            { key: 'land_type', header: 'Type', render: (r) => <Badge variant="outline" className="text-xs">{r.land_type}</Badge> },
            { key: 'area_acres', header: 'Area (ac)', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{formatNumber(r.area_acres, 4)}</span> },
            { key: 'exhausted_area_for_jobs', header: 'Exhausted (jobs)', align: 'right', render: (r) => <span className="tabular-nums text-muted-foreground">{formatNumber(r.exhausted_area_for_jobs, 4)}</span> },
            { key: 'remaining_job_quota', header: 'Job Quota', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{r.remaining_job_quota}</span> },
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
              <span className="text-muted-foreground"> / {formatINR(project.total_budget_ceiling)}</span>
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

      {/* Form-XXII Board Approvals */}
      <FormXXIISection projectId={project.id} />

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
        project_id={project.id}
        initial={{
          name: project.name,
          mine_cd: project.mine_cd,
          state_lgd: project.state_lgd ? String(project.state_lgd) : undefined,
          area_cd: project.area_cd || undefined,
          mouza_lgds: project.mouza_lgds?.map(String) || [],
          pr_docs: project.pr_docs as any || [],
          total_land_limit_acres: project.total_land_limit_acres,
          total_budget_ceiling: project.total_budget_ceiling,
          total_employment_quota: project.total_employment_quota,
        }}
      />
      <LockBaselineDialog open={lockOpen} onOpenChange={setLockOpen} project={project} />
    </div>
  )
}

export default ProjectMasterView

