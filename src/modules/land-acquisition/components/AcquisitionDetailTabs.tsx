'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Can } from '@/authorization/components/Can'
import {
  SectionCard, DataTable, StateBadge, SmartChecklist, ApprovalPanel, StatusTimeline,
} from '@/components/coalrr'
import type {
  Column, AvailableTransition, TimelineNode, ChecklistItem, ChecklistItemStatus,
} from '@/components/coalrr'
import { formatNumber, timeAgo,  } from '@/lib/utils/formatters'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { useUiState } from '@/providers/UiStateProvider'
import { routes } from '@/lib/url/UrlService'
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

import {
  AcquisitionMode, MODE_META, MODES, ANNEXURE_META, LAND_TYPE_COLOR,
  ScheduleListItem, ScheduleItem, ModeChecklistPayload, ScheduleDetail
} from '../types'


const fetchPlots = async (filter?: any): Promise<any[]> => {
  const r = await fetch('/api/plots')
  if (!r.ok) throw new Error('Failed to load plots')
  const data = await r.json()
  return data
}

export function AcquisitionDetailTabs({ schedule }: { schedule: ScheduleDetail }) {
  const mode = MODE_META[schedule.acquisition_mode] ?? {
    label: schedule.acquisition_mode, checklistCode: 'CL-1', color: 'border-slate-300 bg-slate-50 text-slate-700',
  }

  const checklist: ModeChecklistPayload = React.useMemo(() => {
    try {
      const parsed = JSON.parse(schedule.mode_specific_checklist ?? '{"checklistCode":"CL-1","items":[]}')
      return {
        checklistCode: parsed.checklistCode ?? mode.checklistCode,
        items: Array.isArray(parsed.items) ? parsed.items : [],
      }
    } catch {
      return { checklistCode: mode.checklistCode, items: [] }
    }
  }, [schedule.mode_specific_checklist, mode.checklistCode])

  const qc = useQueryClient()
  const onChanged = () => {
    qc.invalidateQueries({ queryKey: ['schedules'] })
    qc.invalidateQueries({ queryKey: ['schedule', schedule.id] })
    window.location.reload() // Simple client refresh since we moved fetch to RSC
  }

  return (
    <div className="space-y-6">
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
    mutationFn: async (plot_id: string) => {
      const r = await fetch(`/api/schedules/${schedule.id}/items/${plot_id}`, { method: 'DELETE' })
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
    mutationFn: async ({ plot_id, tag }: { plot_id: string; tag: 'A' | 'B' | 'C' }) => {
      const r = await fetch(`/api/schedules/${schedule.id}/items/${plot_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annexure_tag: tag }),
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
      if (it.is_active) c[it.annexure_tag] += 1
    }
    return c
  }, [schedule.items])

  const columns: Column<ScheduleItem>[] = [
    { key: 'plot_number', header: 'Plot', sortable: true, render: (r) => (
      <span className="font-mono text-xs font-medium">{r.plot_number}</span>
    ) },
    { key: 'mouza', header: 'Mouza', sortable: true, render: (r) => <span className="text-sm">{r.mouza}</span> },
    { key: 'land_type', header: 'Land Type', render: (r) => (
      <Badge variant="outline" className={`text-[10px] ${LAND_TYPE_COLOR[r.land_type] ?? 'border-slate-300 bg-slate-50 text-slate-700'}`}>
        {r.land_type}
      </Badge>
    ) },
    { key: 'area_acres', header: 'Area (ac)', align: 'right', sortable: true, render: (r) => (
      <span className="tabular-nums">{formatNumber(r.area_acres, 4)}</span>
    ) },
    { key: 'annexure_tag', header: 'Annexure', align: 'center', render: (r) => {
      const meta = ANNEXURE_META[r.annexure_tag]
      return (
        <Badge variant="outline" className={`font-mono text-xs ${meta.color}`}>
          {meta.label} · {meta.desc}
        </Badge>
      )
    } },
    { key: '_reclassify', header: 'Reclassify', align: 'center', render: (r) => (
      <select
        value={r.annexure_tag}
        disabled={!isDrafting || reclassify.isPending}
        onChange={(e) => reclassify.mutate({ plot_id: r.plot_id, tag: e.target.value as 'A' | 'B' | 'C' })}
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
          onClick={() => deleteItem.mutate(r.plot_id)}
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
            ? `${schedule.items.length} plot(s) · total ${formatNumber(schedule.total_area_acres, 4)} acres`
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
        schedule_id={schedule.id}
        existingPlotIds={schedule.items.map((i) => i.plot_id)}
        onAdded={onChanged}
      />
    </div>
  )
}

function AddPlotDialog({
  open, onOpenChange, schedule_id, existingPlotIds, onAdded,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  schedule_id: string
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

  const [plot_id, setPlotId] = React.useState('')
  const [tag, setTag] = React.useState<'A' | 'B' | 'C'>('A')

  React.useEffect(() => {
    if (!open) { setPlotId(''); setTag('A') }
  }, [open])

  const add = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/schedules/${schedule_id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plot_id, annexure_tag: tag }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to add plot')
      return data as { plot_number: string; total_area_acres: string }
    },
    onSuccess: (data) => {
      toast.success(`Plot ${data.plot_number} added`, {
        description: `Schedule total now ${formatNumber(data.total_area_acres, 4)} acres`,
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
                value={plot_id}
                onChange={(e) => setPlotId(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="">Select a plot…</option>
                {availablePlots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plot_number} · {p.mouza} · {p.land_type} · {formatNumber(p.area_acres, 4)} ac
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
            disabled={!plot_id || add.isPending}
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
        body: JSON.stringify({ action: 'submit' }),
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
        description={`Mode-specific compliance items for ${MODE_META[schedule.acquisition_mode]?.label ?? schedule.acquisition_mode}. 'Forward to Area Vetting' enabled once all required items are complete.`}
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
        body: JSON.stringify({ 
          action: schedule.state === 'Drafting' ? 'submit' : (transitionName.includes('escalate') || transitionName.includes('reject') ? 'reject' : 'approve'),
          comments: `Transitioned via UI`
        }),
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
        title="Actor role"
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
