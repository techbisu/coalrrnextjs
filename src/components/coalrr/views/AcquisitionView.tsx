'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  SectionCard, DataTable, StateBadge, SmartChecklist, ApprovalPanel, StatusTimeline,
} from '@/components/coalrr'
import type {
  Column, AvailableTransition, TimelineNode, ChecklistItem, ChecklistItemStatus,
} from '@/components/coalrr'
import { formatNumber, timeAgo, useCoalrr } from '@/components/coalrr/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  ClipboardList, Plus, Loader2, ArrowLeft, MapPin, Building2, Calendar, ShieldCheck,
  History, FileText, Layers, CheckCircle2, Circle, Clock, AlertCircle, Lock, ChevronRight,
  Trash2, ListChecks,
} from 'lucide-react'
import { COMPENSATION_PAYROLL_STATES, COMPENSATION_PAYROLL_ORDERED_STATES } from '@/lib/engines'

// ─── Acquisition mode metadata (CL-1.x) ────────────────────────────────────
type AcquisitionMode = 'cba_act' | 'direct_purchase' | 'rfctlarr' | 'patta'

const MODE_META: Record<AcquisitionMode, { label: string; checklistCode: string; color: string }> = {
  cba_act:         { label: 'CBA Act, 1957',      checklistCode: 'CL-1.1', color: 'border-rose-300 bg-rose-50 text-rose-700' },
  direct_purchase: { label: 'Direct Purchase',    checklistCode: 'CL-1.2', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  rfctlarr:        { label: 'RFCTLARR Act, 2013', checklistCode: 'CL-1.3', color: 'border-violet-300 bg-violet-50 text-violet-700' },
  patta:           { label: 'Patta Transfer',     checklistCode: 'CL-1.4', color: 'border-teal-300 bg-teal-50 text-teal-700' },
}

const MODES: AcquisitionMode[] = ['cba_act', 'direct_purchase', 'rfctlarr', 'patta']

// Annexure tag styling (A/B/C)
const ANNEXURE_META: Record<'A' | 'B' | 'C', { label: string; color: string; desc: string }> = {
  A: { label: 'A', color: 'border-emerald-300 bg-emerald-50 text-emerald-700',     desc: 'Govt. land' },
  B: { label: 'B', color: 'border-amber-300 bg-amber-50 text-amber-700',           desc: 'Private tenancy' },
  C: { label: 'C', color: 'border-rose-300 bg-rose-50 text-rose-700',              desc: 'Forest/Debottar' },
}

const LAND_TYPE_COLOR: Record<string, string> = {
  Forest:    'border-rose-300 bg-rose-50 text-rose-700',
  Govt:      'border-teal-300 bg-teal-50 text-teal-700',
  Patta:     'border-teal-300 bg-teal-50 text-teal-700',
  Tenancy:   'border-emerald-300 bg-emerald-50 text-emerald-700',
  Debottar:  'border-amber-300 bg-amber-50 text-amber-700',
}

// ─── Types ────────────────────────────────────────────────────────────────
interface ScheduleListItem {
  id: string
  scheduleCode: string
  projectName: string
  acquisitionMode: AcquisitionMode
  state: string
  proposalTitle: string
  description: string
  totalAreaAcres: string
  notificationDate: string | null
  itemSummary: { total: number; annexureA: number; annexureB: number; annexureC: number }
  createdAt: string
}

interface ScheduleItem {
  id: string
  plotId: string
  plotNumber: string
  mouza: string
  landType: string
  areaAcres: string
  annexureTag: 'A' | 'B' | 'C'
  isActive: boolean
}

interface ModeChecklistPayload {
  checklistCode: string
  items: Array<{ key: string; label: string; required: boolean; status: string }>
}

interface ScheduleDetail {
  id: string
  scheduleCode: string
  projectName: string
  acquisitionMode: AcquisitionMode
  state: string
  proposalTitle: string
  description: string
  proposedBy: string
  proposedByRole: string
  areaOffice: string
  collieryCode: string
  adjacentColliery: string
  totalAreaAcres: string
  notificationDate: string | null
  annexureA: string
  annexureB: string
  annexureC: string
  modeSpecificChecklist: string
  items: ScheduleItem[]
  createdAt: string
}

interface ProjectListItem {
  id: string
  name: string
  collieryCode: string
  isLocked: boolean
  totalLandLimitAcres: string
}

interface PlotListItem {
  id: string
  plotNumber: string
  mouza: string
  landType: string
  areaAcres: string
}

// ─── Fetchers ─────────────────────────────────────────────────────────────
async function fetchSchedules(): Promise<ScheduleListItem[]> {
  const r = await fetch('/api/schedules')
  if (!r.ok) throw new Error('Failed to load schedules')
  return r.json()
}

async function fetchSchedule(id: string): Promise<ScheduleDetail> {
  const r = await fetch(`/api/schedules/${id}`)
  if (!r.ok) throw new Error('Failed to load schedule')
  return r.json()
}

async function fetchProjects(): Promise<ProjectListItem[]> {
  const r = await fetch('/api/projects')
  if (!r.ok) throw new Error('Failed to load projects')
  return r.json()
}

async function fetchPlots(): Promise<PlotListItem[]> {
  const r = await fetch('/api/plots')
  if (!r.ok) throw new Error('Failed to load plots')
  return r.json()
}

// ─── Main component ───────────────────────────────────────────────────────
export function AcquisitionView() {
  const qc = useQueryClient()
  const { selectedScheduleId, selectSchedule } = useCoalrr()

  const { data: scheduleList, isLoading: listLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: fetchSchedules,
  })

  const { data: schedule, isLoading: detailLoading } = useQuery({
    queryKey: ['schedule', selectedScheduleId],
    queryFn: () => fetchSchedule(selectedScheduleId!),
    enabled: !!selectedScheduleId,
  })

  // ── List view ─────────────────────────────────────────────────────────
  if (!selectedScheduleId || !schedule) {
    return (
      <ListView
        schedules={scheduleList ?? []}
        loading={listLoading}
        onSelect={(id) => selectSchedule(id)}
        onCreated={(id) => {
          qc.invalidateQueries({ queryKey: ['schedules'] })
          selectSchedule(id)
        }}
      />
    )
  }

  // ── Detail view ───────────────────────────────────────────────────────
  return (
    <DetailView
      schedule={schedule}
      loading={detailLoading}
      onBack={() => selectSchedule(null)}
      onChanged={() => {
        qc.invalidateQueries({ queryKey: ['schedule', schedule.id] })
        qc.invalidateQueries({ queryKey: ['schedules'] })
        qc.invalidateQueries({ queryKey: ['dashboard'] })
      }}
    />
  )
}

// ─── List View ────────────────────────────────────────────────────────────
function ListView({
  schedules, loading, onSelect, onCreated,
}: {
  schedules: ScheduleListItem[]
  loading: boolean
  onSelect: (id: string) => void
  onCreated: (id: string) => void
}) {
  const [createOpen, setCreateOpen] = React.useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Land Acquisition Proposals</h2>
          <p className="text-sm text-muted-foreground">
            Module M2 · Plot schedules · CL-1 mode-specific checklists · spec §1.2.1 Journey A
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Proposal
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg border border-border/60 bg-muted/40" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <Alert>
          <ClipboardList className="h-4 w-4" />
          <AlertTitle>No acquisition proposals yet</AlertTitle>
          <AlertDescription>
            Create your first land acquisition proposal against a locked project baseline to begin the
            CL-1 checklist + area/HQ vetting workflow.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => {
            const mode = MODE_META[s.acquisitionMode] ?? {
              label: s.acquisitionMode, checklistCode: 'CL-1', color: 'border-slate-300 bg-slate-50 text-slate-700',
            }
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className="group flex flex-col rounded-lg border border-border/60 bg-card p-4 text-left transition hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-medium">{s.scheduleCode}</span>
                  <StateBadge state={s.state} />
                </div>

                <h3 className="mt-2 line-clamp-1 text-sm font-semibold">{s.proposalTitle}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.projectName}</p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={`font-mono text-[10px] ${mode.color}`}>
                    {mode.checklistCode} · {mode.label}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                  <AnnexurePill tag="A" count={s.itemSummary.annexureA} />
                  <AnnexurePill tag="B" count={s.itemSummary.annexureB} />
                  <AnnexurePill tag="C" count={s.itemSummary.annexureC} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {formatNumber(s.totalAreaAcres, 4)} ac
                  </span>
                  <span>{timeAgo(s.createdAt)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <CreateProposalDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={onCreated} />
    </div>
  )
}

function AnnexurePill({ tag, count }: { tag: 'A' | 'B' | 'C'; count: number }) {
  const meta = ANNEXURE_META[tag]
  return (
    <div className={`rounded-md border px-2 py-1 ${meta.color}`}>
      <div className="text-[10px] font-semibold uppercase">{meta.label}</div>
      <div className="text-sm font-bold tabular-nums">{count}</div>
    </div>
  )
}

// ─── Create Proposal Dialog ──────────────────────────────────────────────
function CreateProposalDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  onCreated: (id: string) => void
}) {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    enabled: open,
  })

  const lockedProjects = React.useMemo(
    () => (projects ?? []).filter((p) => p.isLocked),
    [projects],
  )

  const [form, setForm] = React.useState({
    projectId: '',
    acquisitionMode: '' as AcquisitionMode | '',
    proposalTitle: '',
    description: '',
    areaOffice: '',
    collieryCode: '',
    adjacentColliery: '',
    notificationDate: '',
  })

  // Pre-fill colliery code from selected project
  React.useEffect(() => {
    if (!form.projectId) return
    const p = lockedProjects.find((pr) => pr.id === form.projectId)
    if (p && !form.collieryCode) {
      setForm((f) => ({ ...f, collieryCode: p.collieryCode }))
    }
  }, [form.projectId, lockedProjects, form.collieryCode])

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          acquisitionMode: form.acquisitionMode,
          proposalTitle: form.proposalTitle,
          description: form.description,
          areaOffice: form.areaOffice,
          collieryCode: form.collieryCode,
          adjacentColliery: form.adjacentColliery,
          notificationDate: form.notificationDate || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to create proposal')
      return data as { id: string; scheduleCode: string; message?: string }
    },
    onSuccess: (data) => {
      toast.success(`Proposal ${data.scheduleCode} created`, {
        description: data.message ?? 'Drafting state — add plots & complete CL-1 checklist.',
      })
      setForm({
        projectId: '', acquisitionMode: '', proposalTitle: '', description: '',
        areaOffice: '', collieryCode: '', adjacentColliery: '', notificationDate: '',
      })
      onOpenChange(false)
      onCreated(data.id)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canSubmit = form.projectId && form.acquisitionMode && form.proposalTitle.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Land Acquisition Proposal</DialogTitle>
          <DialogDescription>
            Create a schedule against a locked project baseline. Mode drives the CL-1.x checklist
            enforced at area vetting.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Project selector */}
          <Field label="Project (locked baseline only)">
            {projectsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading projects…
              </div>
            ) : lockedProjects.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No locked projects available</AlertTitle>
                <AlertDescription>
                  A project baseline must be locked before acquisition proposals can be raised against it.
                </AlertDescription>
              </Alert>
            ) : (
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="">Select a locked project…</option>
                {lockedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.collieryCode} · limit {formatNumber(p.totalLandLimitAcres, 2)} ac
                  </option>
                ))}
              </select>
            )}
          </Field>

          {/* Acquisition mode picker */}
          <Field label="Acquisition Mode (drives CL-1.x checklist)">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODES.map((m) => {
                const meta = MODE_META[m]
                const selected = form.acquisitionMode === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, acquisitionMode: m })}
                    className={`flex flex-col items-start rounded-md border px-3 py-2 text-left transition ${
                      selected ? meta.color + ' ring-2 ring-offset-1 ring-amber-300' : 'border-border bg-card hover:border-amber-300'
                    }`}
                  >
                    <span className="font-mono text-[10px] font-bold uppercase">{meta.checklistCode}</span>
                    <span className="mt-0.5 text-xs font-medium leading-tight">{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Proposal title + description */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Proposal Title">
              <Input
                value={form.proposalTitle}
                onChange={(e) => setForm({ ...form, proposalTitle: e.target.value })}
                placeholder="e.g. Hingula Phase-III acquisition — 42 acres"
              />
            </Field>
            <Field label="Notification Date">
              <Input
                type="date"
                value={form.notificationDate}
                onChange={(e) => setForm({ ...form, notificationDate: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief scope, affected mouzas, rationale…"
              className="min-h-16"
            />
          </Field>

          {/* Colliery details */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Area Office">
              <Input
                value={form.areaOffice}
                onChange={(e) => setForm({ ...form, areaOffice: e.target.value })}
                placeholder="e.g. Talcher Area"
              />
            </Field>
            <Field label="Acquiring Colliery Code">
              <Input
                value={form.collieryCode}
                onChange={(e) => setForm({ ...form, collieryCode: e.target.value })}
                placeholder="e.g. HNG"
              />
            </Field>
            <Field label="Adjacent Colliery">
              <Input
                value={form.adjacentColliery}
                onChange={(e) => setForm({ ...form, adjacentColliery: e.target.value })}
                placeholder="e.g. BNP"
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail View (4 tabs) ────────────────────────────────────────────────
function DetailView({
  schedule, loading, onBack, onChanged,
}: {
  schedule: ScheduleDetail
  loading: boolean
  onBack: () => void
  onChanged: () => void
}) {
  const mode = MODE_META[schedule.acquisitionMode] ?? {
    label: schedule.acquisitionMode, checklistCode: 'CL-1', color: 'border-slate-300 bg-slate-50 text-slate-700',
  }

  // Parse the modeSpecificChecklist JSON string
  const checklist: ModeChecklistPayload = React.useMemo(() => {
    try {
      const parsed = JSON.parse(schedule.modeSpecificChecklist ?? '{"checklistCode":"CL-1","items":[]}')
      return {
        checklistCode: parsed.checklistCode ?? mode.checklistCode,
        items: Array.isArray(parsed.items) ? parsed.items : [],
      }
    } catch {
      return { checklistCode: mode.checklistCode, items: [] }
    }
  }, [schedule.modeSpecificChecklist, mode.checklistCode])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="mt-0.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{schedule.proposalTitle}</h2>
              <StateBadge state={schedule.state} size="md" />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{schedule.scheduleCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-mono text-xs ${mode.color}`}>
            {mode.checklistCode} · {mode.label}
          </Badge>
        </div>
      </div>

      {/* Proposal meta strip */}
      <div className="grid gap-3 rounded-lg border border-border/60 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem icon={Building2} label="Project" value={schedule.projectName} />
        <MetaItem icon={MapPin} label="Area Office / Colliery" value={`${schedule.areaOffice || '—'} · ${schedule.collieryCode || '—'}`} />
        <MetaItem icon={Calendar} label="Notification Date" value={schedule.notificationDate ? new Date(schedule.notificationDate).toLocaleDateString('en-IN') : '—'} />
        <MetaItem icon={Layers} label="Total Area" value={`${formatNumber(schedule.totalAreaAcres, 4)} acres`} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plots" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="plots"><Layers className="h-3.5 w-3.5" /> Plots &amp; Annexures</TabsTrigger>
          <TabsTrigger value="checklist"><ListChecks className="h-3.5 w-3.5" /> CL-1 Checklist</TabsTrigger>
          <TabsTrigger value="verify"><ShieldCheck className="h-3.5 w-3.5" /> Verification</TabsTrigger>
          <TabsTrigger value="timeline"><History className="h-3.5 w-3.5" /> Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="plots" className="mt-4">
          <PlotsTab schedule={schedule} onChanged={onChanged} />
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <ChecklistTab schedule={schedule} checklist={checklist} onChanged={onChanged} />
        </TabsContent>

        <TabsContent value="verify" className="mt-4">
          <VerificationTab schedule={schedule} onChanged={onChanged} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineTab schedule={schedule} />
        </TabsContent>
      </Tabs>

      {loading && (
        <p className="text-xs text-muted-foreground">Refreshing…</p>
      )}
    </div>
  )
}

function MetaItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

// ─── Tab 1: Plots & Annexures ────────────────────────────────────────────
function PlotsTab({
  schedule, onChanged,
}: {
  schedule: ScheduleDetail
  onChanged: () => void
}) {
  const qc = useQueryClient()
  const isDrafting = schedule.state === 'Drafting'
  const [addOpen, setAddOpen] = React.useState(false)

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const r = await fetch(`/api/schedules/${schedule.id}/items/${itemId}`, { method: 'DELETE' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to remove plot')
      return data
    },
    onSuccess: () => {
      toast.success('Plot removed from schedule')
      onChanged()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const reclassify = useMutation({
    mutationFn: async ({ itemId, tag }: { itemId: string; tag: 'A' | 'B' | 'C' }) => {
      const r = await fetch(`/api/schedules/${schedule.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annexureTag: tag }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to reclassify')
      return data
    },
    onSuccess: () => {
      toast.success('Annexure reclassified')
      onChanged()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Summary counts (live from items)
  const counts = React.useMemo(() => {
    const c = { A: 0, B: 0, C: 0 }
    for (const it of schedule.items) {
      if (it.isActive) c[it.annexureTag] += 1
    }
    return c
  }, [schedule.items])

  const columns: Column<ScheduleItem>[] = [
    { key: 'plotNumber', header: 'Plot', sortable: true, render: (r) => (
      <span className="font-mono text-xs font-medium">{r.plotNumber}</span>
    ) },
    { key: 'mouza', header: 'Mouza', sortable: true, render: (r) => <span className="text-sm">{r.mouza}</span> },
    { key: 'landType', header: 'Land Type', render: (r) => (
      <Badge variant="outline" className={`text-[10px] ${LAND_TYPE_COLOR[r.landType] ?? 'border-slate-300 bg-slate-50 text-slate-700'}`}>
        {r.landType}
      </Badge>
    ) },
    { key: 'areaAcres', header: 'Area (ac)', align: 'right', sortable: true, render: (r) => (
      <span className="tabular-nums">{formatNumber(r.areaAcres, 4)}</span>
    ) },
    { key: 'annexureTag', header: 'Annexure', align: 'center', render: (r) => {
      const meta = ANNEXURE_META[r.annexureTag]
      return (
        <Badge variant="outline" className={`font-mono text-xs ${meta.color}`}>
          {meta.label} · {meta.desc}
        </Badge>
      )
    } },
    { key: '_reclassify', header: 'Reclassify', align: 'center', render: (r) => (
      <select
        value={r.annexureTag}
        disabled={!isDrafting || reclassify.isPending}
        onChange={(e) => reclassify.mutate({ itemId: r.id, tag: e.target.value as 'A' | 'B' | 'C' })}
        className="h-7 rounded border border-border bg-background px-1.5 text-xs disabled:opacity-50"
      >
        <option value="A">A · Govt</option>
        <option value="B">B · Private</option>
        <option value="C">C · Forest</option>
      </select>
    ) },
    { key: '_actions', header: '', align: 'right', render: (r) => (
      isDrafting ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-rose-600"
          onClick={() => deleteItem.mutate(r.id)}
          disabled={deleteItem.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Lock className="h-3 w-3 text-muted-foreground/40" />
      )
    ) },
  ]

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(['A', 'B', 'C'] as const).map((tag) => {
          const meta = ANNEXURE_META[tag]
          return (
            <div key={tag} className={`rounded-lg border p-4 ${meta.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Annexure {meta.label}</p>
                  <p className="text-xs opacity-80">{meta.desc}</p>
                </div>
                <span className="text-3xl font-bold tabular-nums">{counts[tag]}</span>
              </div>
            </div>
          )
        })}
      </div>

      <SectionCard
        title="Schedule Items (Plots)"
        icon={Layers}
        description={
          isDrafting
            ? `${schedule.items.length} plot(s) · total ${formatNumber(schedule.totalAreaAcres, 4)} acres`
            : `Schedule locked in ${schedule.state} — plots cannot be added or removed`
        }
        action={
          isDrafting ? (
            <Button size="sm" onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Plot
            </Button>
          ) : undefined
        }
      >
        <DataTable
          columns={columns}
          data={schedule.items}
          getRowId={(r) => r.id}
          pageSize={5}
          emptyMessage="No plots added yet. Click 'Add Plot' to compose the schedule."
        />
      </SectionCard>

      <AddPlotDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        scheduleId={schedule.id}
        existingPlotIds={schedule.items.map((i) => i.plotId)}
        onAdded={onChanged}
      />
    </div>
  )
}

function AddPlotDialog({
  open, onOpenChange, scheduleId, existingPlotIds, onAdded,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  scheduleId: string
  existingPlotIds: string[]
  onAdded: () => void
}) {
  const { data: plots, isLoading } = useQuery({
    queryKey: ['plots'],
    queryFn: fetchPlots,
    enabled: open,
  })

  const availablePlots = React.useMemo(
    () => (plots ?? []).filter((p) => !existingPlotIds.includes(p.id)),
    [plots, existingPlotIds],
  )

  const [plotId, setPlotId] = React.useState('')
  const [tag, setTag] = React.useState<'A' | 'B' | 'C'>('A')

  React.useEffect(() => {
    if (!open) { setPlotId(''); setTag('A') }
  }, [open])

  const add = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/schedules/${scheduleId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plotId, annexureTag: tag }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to add plot')
      return data as { plotNumber: string; totalAreaAcres: string }
    },
    onSuccess: (data) => {
      toast.success(`Plot ${data.plotNumber} added`, {
        description: `Schedule total now ${formatNumber(data.totalAreaAcres, 4)} acres`,
      })
      setPlotId('')
      setTag('A')
      onOpenChange(false)
      onAdded()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Plot to Schedule</DialogTitle>
          <DialogDescription>
            Select an available plot and assign it to an annexure class. Plot must not already be
            active in another schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Available Plot">
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading plots…
              </div>
            ) : availablePlots.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No plots available</AlertTitle>
                <AlertDescription>
                  All plots in the registry are already attached to this schedule.
                </AlertDescription>
              </Alert>
            ) : (
              <select
                value={plotId}
                onChange={(e) => setPlotId(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="">Select a plot…</option>
                {availablePlots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plotNumber} · {p.mouza} · {p.landType} · {formatNumber(p.areaAcres, 4)} ac
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Annexure Tag">
            <div className="grid grid-cols-3 gap-2">
              {(['A', 'B', 'C'] as const).map((t) => {
                const meta = ANNEXURE_META[t]
                const selected = tag === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`rounded-md border px-3 py-2 text-left transition ${
                      selected ? meta.color + ' ring-2 ring-offset-1 ring-amber-300' : 'border-border bg-card hover:border-amber-300'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold">Annexure {meta.label}</div>
                    <div className="text-[10px] opacity-80">{meta.desc}</div>
                  </button>
                )
              })}
            </div>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => add.mutate()}
            disabled={!plotId || add.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Plot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tab 2: CL-1 Checklist ───────────────────────────────────────────────
function ChecklistTab({
  schedule, checklist, onChanged,
}: {
  schedule: ScheduleDetail
  checklist: ModeChecklistPayload
  onChanged: () => void
}) {
  // Build SmartChecklist items
  const items: ChecklistItem[] = checklist.items.map((it) => ({
    key: it.key,
    label: it.label,
    required: it.required,
    status: (it.status === 'in_progress' ? 'in_progress' : it.status === 'complete' ? 'complete' : it.status === 'skipped' ? 'skipped' : 'pending') as ChecklistItemStatus,
  }))

  const canEdit = schedule.state === 'Drafting' || schedule.state === 'AreaVetting'
  const showForward = schedule.state === 'UnitSubmitted'

  const qc = useQueryClient()
  const updateItem = useMutation({
    mutationFn: async ({ itemKey, status }: { itemKey: string; status: ChecklistItemStatus }) => {
      const r = await fetch(`/api/schedules/${schedule.id}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey, status }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to update checklist')
      return data
    },
    onSuccess: () => {
      onChanged()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const forward = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/schedules/${schedule.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition: 'submit_to_area' }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Forward failed')
      if (data.ok === false) throw new Error(data.reason ?? 'Transition blocked')
      return data
    },
    onSuccess: (data) => {
      toast.success(`Forwarded to ${data.newStatusLabel ?? 'Area Vetting'}`)
      onChanged()
      qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: (e: Error) => toast.error('Forward blocked', { description: e.message }),
  })

  return (
    <div className="space-y-4">
      <SectionCard
        title={`CL-1 Checklist — ${checklist.checklistCode}`}
        icon={ListChecks}
        description={`Mode-specific compliance items for ${MODE_META[schedule.acquisitionMode]?.label ?? schedule.acquisitionMode}. 'Forward to Area Vetting' enabled once all required items are complete.`}
      >
        <SmartChecklist
          code={checklist.checklistCode}
          title="Compliance Checklist"
          items={items}
          hideForward={!showForward}
          forwardLabel="Forward to Area Vetting"
          onForward={() => forward.mutate()}
        />
      </SectionCard>

      {/* Quick-update panel */}
      <SectionCard
        title="Quick Update"
        icon={CheckCircle2}
        description={
          canEdit
            ? 'Click ○ / ◐ / ✓ to set each item status. PATCHes /api/schedules/[id]/checklist.'
            : `Checklist is locked in state ${schedule.state} — only editable from Drafting or AreaVetting.`
        }
      >
        {checklist.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No checklist items defined.</p>
        ) : (
          <div className="space-y-1.5">
            {checklist.items.map((it) => {
              const status = it.status as ChecklistItemStatus
              return (
                <div
                  key={it.key}
                  className={`flex items-center justify-between gap-3 rounded-md border border-transparent px-2.5 py-2 transition ${
                    status === 'complete' ? 'bg-emerald-50/60 dark:bg-emerald-950/20' :
                    status === 'in_progress' ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusGlyph status={status} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{it.label}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{it.key}</p>
                    </div>
                    {it.required && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px] uppercase">required</Badge>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <QuickButton
                      active={status === 'pending'} disabled={!canEdit || updateItem.isPending}
                      onClick={() => updateItem.mutate({ itemKey: it.key, status: 'pending' })}
                      title="Pending"
                    >
                      <Circle className="h-3.5 w-3.5" />
                    </QuickButton>
                    <QuickButton
                      active={status === 'in_progress'} disabled={!canEdit || updateItem.isPending}
                      onClick={() => updateItem.mutate({ itemKey: it.key, status: 'in_progress' })}
                      title="In progress"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </QuickButton>
                    <QuickButton
                      active={status === 'complete'} disabled={!canEdit || updateItem.isPending}
                      onClick={() => updateItem.mutate({ itemKey: it.key, status: 'complete' })}
                      title="Complete"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </QuickButton>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showForward && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Once all required items are complete, forward to area office for vetting.
              </p>
              <Button
                onClick={() => forward.mutate()}
                disabled={forward.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {forward.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Forward to Area Vetting
              </Button>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  )
}

function StatusGlyph({ status }: { status: ChecklistItemStatus }) {
  if (status === 'complete') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (status === 'in_progress') return <Clock className="h-4 w-4 text-amber-600" />
  if (status === 'skipped') return <AlertCircle className="h-4 w-4 text-slate-400" />
  return <Circle className="h-4 w-4 text-muted-foreground/60" />
}

function QuickButton({
  active, disabled, onClick, title, children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${
        active
          ? 'border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          : 'border-border bg-background text-muted-foreground hover:border-amber-300 hover:text-foreground'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

// ─── Tab 3: Verification (ApprovalPanel) ─────────────────────────────────
function VerificationTab({
  schedule, onChanged,
}: {
  schedule: ScheduleDetail
  onChanged: () => void
}) {
  const qc = useQueryClient()
  const [actorRole, setActorRole] = React.useState('area_office')

  const stateKey = schedule.state as keyof typeof COMPENSATION_PAYROLL_STATES
  const stateMeta = COMPENSATION_PAYROLL_STATES[stateKey]
  const transitions: AvailableTransition[] = (stateMeta?.allowedTransitions ?? []).map((t) => ({
    name: t.name,
    label: t.label,
    role: t.role,
    guardFailed: null,
  }))

  const verify = useMutation({
    mutationFn: async (transitionName: string) => {
      const r = await fetch(`/api/schedules/${schedule.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition: transitionName }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Transition failed')
      if (data.ok === false) throw new Error(data.reason ?? 'Transition blocked')
      return data as { newStatusLabel?: string; spawnedTasks?: Array<{ role: string }> }
    },
    onSuccess: (data) => {
      toast.success(`Transitioned to ${data.newStatusLabel ?? 'next state'}`, {
        description: data.spawnedTasks?.length ? `Spawned ${data.spawnedTasks.length} review task(s)` : undefined,
      })
      onChanged()
      qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: (e: Error) => toast.error('Transition blocked', { description: e.message }),
  })

  return (
    <div className="space-y-4">
      <SectionCard
        title="Actor Role"
        icon={ShieldCheck}
        description="Simulate acting as different approvers across the workflow chain."
      >
        <select
          value={actorRole}
          onChange={(e) => setActorRole(e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="unit_office">Unit Office</option>
          <option value="area_office">Area Office</option>
          <option value="gm_planning">GM (Planning)</option>
          <option value="gm_finance">GM (Finance)</option>
          <option value="director">Director</option>
          <option value="cmd">CMD</option>
          <option value="board">Board</option>
        </select>
      </SectionCard>

      <ApprovalPanel
        currentState={schedule.state}
        availableTransitions={transitions}
        actorRole={actorRole}
        onAction={(name) => verify.mutate(name)}
      />

      {schedule.state === 'Drafting' && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Drafting — not yet submitted</AlertTitle>
          <AlertDescription>
            Compose the plot schedule and complete the CL-1 checklist, then submit to the Unit Office
            to begin the verification chain.
          </AlertDescription>
        </Alert>
      )}

      {schedule.state === 'Published' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Published — terminal state</AlertTitle>
          <AlertDescription>
            Award published to the immutable Form-D ledger. Transparency window started.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// ─── Tab 4: Timeline ─────────────────────────────────────────────────────
function TimelineTab({ schedule }: { schedule: ScheduleDetail }) {
  const nodes: TimelineNode[] = COMPENSATION_PAYROLL_ORDERED_STATES.map((state) => {
    const meta = COMPENSATION_PAYROLL_STATES[state]
    const currentState = schedule.state as keyof typeof COMPENSATION_PAYROLL_STATES
    const isBranch = state === 'BoardEscalation'
    let status: TimelineNode['status'] = 'pending'

    if (currentState === 'BoardEscalation') {
      // Linear chain up to DirectorConsent is done; CmdApproved/Published stay pending; branch is current
      if (state === 'BoardEscalation') status = 'current'
      else if (meta.order < COMPENSATION_PAYROLL_STATES.DirectorConsent.order) status = 'done'
      else if (state === 'DirectorConsent') status = 'done'
      else status = 'pending'
    } else {
      if (meta.order < COMPENSATION_PAYROLL_STATES[currentState].order) status = 'done'
      else if (state === currentState) status = 'current'
    }

    return {
      state,
      label: meta.label,
      status,
      note: status === 'current' ? meta.description : undefined,
      isBranch,
    }
  })

  return (
    <SectionCard
      title="Workflow Timeline"
      icon={History}
      description="Finite state machine — spec §2.3.1. BoardEscalation is a branch off AreaVetting / DirectorConsent."
    >
      <StatusTimeline nodes={nodes} maxheight={460} />
    </SectionCard>
  )
}
