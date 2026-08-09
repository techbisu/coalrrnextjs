'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Can } from '@/authorization/components/Can'
import {
  SectionCard, DataTable, StateBadge, SmartChecklist, ApprovalPanel, StatusTimeline, ActionJustificationDialog, PartialAreaInputDialog, WorkflowTimelineFeed, ProposalActionCenterBanner,
} from '@/shared/components/coalrr'
import { ProposalOverviewSection } from './sections/ProposalOverviewSection'
import type {
  Column, AvailableTransition, TimelineNode, ChecklistItem, ChecklistItemStatus,
} from '@/shared/components/coalrr'
import { formatNumber, timeAgo,  } from '@/lib/utils/formatters'
import { useUiState } from '@/providers/UiStateProvider'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { routes } from '@/lib/url/UrlService'
import { PlotScheduleManager } from '@/modules/proposal/components/PlotScheduleManager'
import { GenericChecklistWorkspace } from '@/core/checklist/components/GenericChecklistWorkspace'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Separator } from '@/shared/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  ClipboardList, Plus, Loader2, ArrowLeft, MapPin, Building2, Calendar, ShieldCheck,
  History, FileText, Layers, CheckCircle2, Circle, Clock, AlertCircle, Lock, ChevronRight,
  Trash2, ListChecks, Pencil, UploadCloud
} from 'lucide-react'
import { COMPENSATION_PAYROLL_STATES, COMPENSATION_PAYROLL_ORDERED_STATES } from '@/core/workflow'
import { getChecklistStatus, updateChecklistSubmission } from '@/app/actions/checklist.actions'

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
  const qc = useQueryClient()
  const router = useRouter()
  const onChanged = () => {
    qc.invalidateQueries({ queryKey: ['schedules'] })
    qc.invalidateQueries({ queryKey: ['schedule', schedule.id] })
    router.refresh() // Soft refresh to retain client state (popups) while fetching latest RSC data
  }

  return (
    <div className="space-y-6">
      <PendingActionBanner schedule={schedule} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Overview & Plots (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-fit flex-wrap">
            <TabsTrigger value="overview"><ListChecks className="mr-2 h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="checklist"><FileText className="mr-2 h-3.5 w-3.5" /> Compliance Checklist</TabsTrigger>
            <TabsTrigger value="plots"><Layers className="mr-2 h-3.5 w-3.5" /> Plots &amp; Annexures</TabsTrigger>
            <TabsTrigger value="milestones"><Calendar className="mr-2 h-3.5 w-3.5" /> Statutory Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            <ProposalOverviewSection schedule={schedule} />
          </TabsContent>

          <TabsContent value="checklist" className="mt-4 space-y-6">
            <ChecklistTab schedule={schedule} onChanged={onChanged} />
          </TabsContent>

          <TabsContent value="plots" className="mt-4">
            <PlotsTab schedule={schedule} onChanged={onChanged} />
          </TabsContent>

          <TabsContent value="milestones" className="mt-4">
            <MilestonesTab schedule={schedule} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Timeline, Verification & Limits (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <VerificationTab schedule={schedule} onChanged={onChanged} />
        <TimelineTab schedule={schedule} />
        <LimitsTab schedule={schedule} />
      </div>
      </div>
    </div>
  )
}

function PendingActionBanner({ schedule }: { schedule: ScheduleDetail }) {
  const { user } = useAuth()
  const { data: clStatus } = useQuery<{ isComplete: boolean; completedCount?: number; totalCount?: number }>({
    queryKey: ['schedules', schedule.id, 'checklist-status'],
    queryFn: async () => {
      const r = await fetch(`/api/schedules/${schedule.id}/checklist`)
      if (!r.ok) return { isComplete: false, completedCount: 0, totalCount: 0 }
      return r.json()
    }
  })

  return (
    <ProposalActionCenterBanner
      proposalId={schedule.id}
      proposalNo={schedule.schedule_code || `PROP-${schedule.id.slice(0, 8)}`}
      currentStage={getNormalizedState(schedule.state)}
      userRole={user?.roles?.[0] || 'unit_office'}
      checklistSummary={clStatus ? {
        total: (clStatus as any).totalCount || 12,
        completed: (clStatus as any).completedCount || ((clStatus as any).isComplete ? 12 : 8),
        isComplete: Boolean(clStatus.isComplete),
      } : undefined}
    />
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

// Normalize raw db state (e.g. DRAFTING -> Drafting, SUBMITTED -> UnitSubmitted)
function getNormalizedState(stateStr: string) {
  if (!stateStr) return 'Drafting'
  if (stateStr === 'DRAFT' || stateStr === 'DRAFTING') return 'Drafting'
  if (stateStr === 'SUBMITTED') return 'UnitSubmitted'
  return stateStr
}

// ─── Tab 1: Plots & Annexures ────────────────────────────────────────────
function PlotsTab({
  schedule, onChanged,
}: {
  schedule: ScheduleDetail
  onChanged: () => void
}) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const normalizedState = getNormalizedState(schedule.state)
  const isDrafting = normalizedState === 'Drafting'
  
  // Logic: Users cannot edit while verification is running.
  // Exception: Area GM can edit/delete disputed plots when the workflow is frozen by a grievance/overlap.
  // For this prototype, we'll assume the presence of grievances means frozen.
  const hasGrievances = (schedule as any).grievances?.some((g: any) => !g.resolution)
  const isAGM = user?.roles.includes('area_gm')
  const canEdit = isDrafting || (hasGrievances && isAGM)

  const [addOpen, setAddOpen] = React.useState(false)
  const [editPlotId, setEditPlotId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'A' | 'B' | 'C'>('A')
  const [partialPlot, setPartialPlot] = React.useState<ScheduleItem | null>(null)

  const deleteItem = useMutation({
    mutationFn: async (plot_id: string) => {
      const r = await fetch(`/api/proposals/${schedule.id}/plots/${plot_id}`, { method: 'DELETE' })
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

  const updateStatus = useMutation({
    mutationFn: async ({
      plot_no,
      status,
      total_poss_area,
      to_be_acquired_area,
      remarks,
    }: {
      plot_no: string
      status: string
      total_poss_area?: number
      to_be_acquired_area?: number
      remarks?: string
    }) => {
      const r = await fetch(`/api/proposals/${schedule.id}/plots/${plot_no}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acq_status: status,
          total_poss_area,
          to_be_acquired_area,
          remarks,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to update status')
      return data
    },
    onSuccess: () => {
      toast.success('Adjacent colliery status updated')
      setPartialPlot(null)
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

  const baseColumns: Column<ScheduleItem>[] = [
    { key: 'plot_number', header: 'Plot', sortable: true, render: (r) => (
      <div className="flex flex-col gap-0.5 py-0.5">
        <span className="font-mono text-xs font-semibold text-foreground">{r.plot_number}</span>
        {r.opt_plot_number && (
          <span className="font-mono text-[11px] text-muted-foreground">Prev: {r.opt_plot_number}</span>
        )}
        <span className="text-[11px] text-muted-foreground font-medium">
          {r.mouza}{r.jl_no ? ` (JL No: ${r.jl_no})` : ''}
        </span>
      </div>
    ) },
    { key: 'total_area', header: 'Total Area (ac)', align: 'right', sortable: true, render: (r) => (
      <div className="flex flex-col items-end gap-0.5 py-0.5 font-mono text-xs">
        <span className="font-semibold text-foreground">{formatNumber(r.total_ror_area || Number(r.area_acres || 0), 4)} ac</span>
        <span className="text-[11px] text-muted-foreground">Acq: {formatNumber(r.to_be_acquired_area || Number(r.area_acres || 0), 4)} ac</span>
      </div>
    ) },
    { key: 'land_type', header: 'Land Type', render: (r) => {
      if (r.land_types_breakdown && r.land_types_breakdown.length > 0) {
        return (
          <div className="flex flex-col gap-1.5 py-1 min-w-[200px]">
            {r.land_types_breakdown.map((bt, idx) => (
              <div key={idx} className="flex flex-col gap-0.5 bg-muted/40 p-1.5 rounded border border-border/50">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-foreground font-mono">{bt.primary_name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{formatNumber(bt.primary_area, 4)} ac</span>
                </div>
                {bt.use_purpose && (
                  <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground/90">
                    Purpose: {bt.use_purpose}
                  </span>
                )}
                {bt.sub_types && bt.sub_types.length > 0 && (
                  <div className="mt-0.5 flex flex-col gap-0.5 pl-1.5 border-l-2 border-primary/30">
                    {bt.sub_types.map((st, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-mono">{st.sub_name}</span>
                        <span className="font-mono font-medium text-foreground">{formatNumber(st.area_to_acquire, 4)} ac</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
      return (
        <Badge variant="outline" className="text-xs font-normal font-mono bg-muted/30">
          {r.land_type}
        </Badge>
      )
    } },
    { key: 'annexure_tag', header: 'Annexure', align: 'center', render: (r) => {
      const meta = ANNEXURE_META[r.annexure_tag]
      const currentStatus = r.annexure_tag === 'B' ? 'PURCHASED' : r.annexure_tag === 'C' ? 'PARTIALLY_PURCHASED' : 'PROPOSED';
      
      const isAnnexureEditable = canEdit || normalizedState === 'UnitSubmitted' || !!schedule.adjacent_colliery;

      if (isAnnexureEditable) {
        return (
          <select
            value={currentStatus}
            disabled={updateStatus.isPending}
            onChange={(e) => {
              const newStatus = e.target.value
              if (newStatus === 'PARTIALLY_PURCHASED') {
                setPartialPlot(r)
              } else {
                updateStatus.mutate({ plot_no: r.plot_id || r.plot_number, status: newStatus })
              }
            }}
            className={`h-7 font-mono text-xs font-bold rounded border px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${meta.color}`}
            title={`Annexure ${meta.label} · ${meta.desc}`}
          >
            <option value="PROPOSED" className="bg-background text-foreground font-mono font-normal">Annexure A (Clear)</option>
            <option value="PURCHASED" className="bg-background text-foreground font-mono font-normal">Annexure B (Purchased)</option>
            <option value="PARTIALLY_PURCHASED" className="bg-background text-foreground font-mono font-normal">Annexure C (Partial)</option>
          </select>
        )
      }

      return (
        <Badge 
          variant="outline" 
          className={`font-mono text-xs font-bold px-2.5 py-0.5 cursor-help ${meta.color}`}
          title={`Annexure ${meta.label} · ${meta.desc}`}
        >
          {meta.label}
        </Badge>
      )
    } },
  ]
  
  const actionsColumn: Column<ScheduleItem> = { key: '_actions', header: '', align: 'right', render: (r) => (
      canEdit ? (
        <div className="flex justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-blue-600"
            onClick={() => setEditPlotId(r.plot_id)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                disabled={deleteItem.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the plot from this proposal.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteItem.mutate(r.plot_id)} className="bg-rose-600 hover:bg-rose-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <Lock className="h-3 w-3 text-muted-foreground/40" />
      )
    ) }

  const columns = [...baseColumns, actionsColumn]

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
          <PlotScheduleManager 
            proposalId={schedule.id} 
            isDrafting={isDrafting} 
            projectStateLgd={schedule.project_state_lgd}
            projectMouzas={schedule.projectMouzas}
            editPlotId={editPlotId}
            setEditPlotId={setEditPlotId}
            onChanged={onChanged} 
          />
        }
      >
        <DataTable
          columns={columns}
          data={schedule.items.filter(it => it.annexure_tag === activeTab)}
          getRowId={(r) => r.id}
          pageSize={5}
          showRecordCount={false}
          emptyMessage={`No plots in Annexure ${ANNEXURE_META[activeTab].label}.`}
          headerAction={
            <div className="flex gap-1 bg-muted/50 p-1 rounded-md w-fit">
              {(['A', 'B', 'C'] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTab(tag)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${
                    activeTab === tag
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <span>Annexure {tag}</span>
                  <Badge variant="secondary" className="px-1.5 py-0 min-w-[20px] text-[10px]">
                    {schedule.items.filter(it => it.annexure_tag === tag).length}
                  </Badge>
                </button>
              ))}
            </div>
          }
        />
      </SectionCard>

      <PartialAreaInputDialog
        isOpen={!!partialPlot}
        onClose={() => setPartialPlot(null)}
        plotNumber={partialPlot?.plot_number || ''}
        totalArea={Number(partialPlot?.area_acres || 0)}
        onSubmit={async ({ totalPossArea, toBeAcquiredArea, remarks }) => {
          if (partialPlot) {
            await updateStatus.mutateAsync({
              plot_no: partialPlot.plot_id || partialPlot.plot_number,
              status: 'PARTIALLY_PURCHASED',
              total_poss_area: totalPossArea,
              to_be_acquired_area: toBeAcquiredArea,
              remarks,
            })
          }
        }}
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
  schedule, onChanged,
}: {
  schedule: ScheduleDetail
  onChanged: () => void
}) {
  const qc = useQueryClient()
  const { user } = useAuth()
  
  const normalizedState = getNormalizedState(schedule.state)
  const showForward = normalizedState === 'UnitSubmitted'

  // Forward to Area Vetting
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
      <GenericChecklistWorkspace
        moduleCode="LAND_ACQ_PROPOSAL"
        checkableType="acq_proposal"
        checkableId={schedule.id}
        userId={user?.id || 'system'}
        title="Compliance Checklist"
        description={`Mode-specific compliance items for ${MODE_META[schedule.acquisition_mode]?.label ?? schedule.acquisition_mode}. Completeness status is automatically validated by the Workflow Engine.`}
      />
    </div>
  )
}

function StatusGlyph({ status }: { status: ChecklistItemStatus }) {
  if (status === 'complete') return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
  if (status === 'in_progress') return <Clock className="h-4 w-4 text-amber-600 shrink-0" />
  if (status === 'skipped') return <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
  return <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
}

// ─── Tab 3: Verification (ApprovalPanel) ─────────────────────────────────
function VerificationTab({
  schedule, onChanged,
}: {
  schedule: ScheduleDetail
  onChanged: () => void
}) {
  const qc = useQueryClient()
  const { user } = useAuth()

  const mapUserRole = (rawRole?: string) => {
    if (!rawRole) return 'unit_office'
    const lower = rawRole.toLowerCase()
    if (lower.includes('unit')) return 'unit_office'
    if (lower.includes('area')) return 'area_office'
    if (lower.includes('lre') || lower.includes('planning')) return 'gm_planning'
    if (lower.includes('finance')) return 'gm_finance'
    if (lower.includes('director')) return 'director'
    if (lower.includes('cmd')) return 'cmd'
    return 'unit_office'
  }

  const detectedRole = mapUserRole(user?.roles?.[0])
  const [actorRole, setActorRole] = React.useState(detectedRole)

  React.useEffect(() => {
    if (user?.roles?.[0]) {
      setActorRole(mapUserRole(user.roles[0]))
    }
  }, [user?.roles])

  const normalizedState = getNormalizedState(schedule.state)
  const stateKey = normalizedState as keyof typeof COMPENSATION_PAYROLL_STATES
  const stateMeta = COMPENSATION_PAYROLL_STATES[stateKey]
  const { data: clStatus } = useQuery<{ isComplete: boolean; missingItems: string[] }>({
    queryKey: ['schedules', schedule.id, 'checklist-status'],
    queryFn: async () => {
      const r = await fetch(`/api/schedules/${schedule.id}/checklist`)
      if (!r.ok) return { isComplete: false, missingItems: [] }
      return r.json()
    }
  })

  const { data: limitsData } = useQuery<{ isWithinLimit: boolean }>({
    queryKey: ['proposals', schedule.id, 'limits'],
    queryFn: async () => {
      const r = await fetch(`/api/proposals/${schedule.id}/limits`)
      if (!r.ok) return null
      const json = await r.json()
      return json.details
    }
  })

  const isBreached = limitsData ? (limitsData.isWithinLimit === false) : false
  const isSuperAdmin = user?.roles?.some((r: string) => r.toLowerCase().includes('admin'))

  const transitions: AvailableTransition[] = (stateMeta?.allowedTransitions ?? [])
    .filter((t) => {
      // 1. Role filter: user must match transition role or be admin
      if (!isSuperAdmin && t.role !== detectedRole) return false

      // 2. Show/Hide condition filters:
      // Hide submit_to_area if CL-1 checklist is incomplete
      if (t.name === 'submit_to_area' && clStatus && !clStatus.isComplete) {
        return false
      }

      // Hide submit_to_hq_parallel if project baseline is breached
      if (t.name === 'submit_to_hq_parallel' && isBreached) {
        return false
      }

      // Hide escalate_to_board if project baseline is intact (no breach)
      if (t.name === 'escalate_to_board' && !isBreached) {
        return false
      }

      return true
    })
    .map((t) => ({
      name: t.name,
      label: t.label,
      role: t.role,
      guardFailed: null,
    }))

  const [selectedTransition, setSelectedTransition] = React.useState<{ name: string; label: string } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const verify = useMutation({
    mutationFn: async ({ transitionName, comments, file }: { transitionName: string; comments?: string; file?: File | null }) => {
      let uploadedDocId: string | null = null
      if (file) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('proposal_id', schedule.id)
          formData.append('document_type', 'JUSTIFICATION_NOTE')
          const uploadRes = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
          })
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json()
            uploadedDocId = uploadJson.document_id || uploadJson.id || null
          }
        } catch (err) {
          console.warn('Document upload error:', err)
        }
      }

      const r = await fetch(`/api/schedules/${schedule.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: transitionName,
          transitionName: transitionName,
          role: actorRole,
          comments: comments || `Transitioned via UI`,
          document_id: uploadedDocId
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
      <ApprovalPanel
        currentState={normalizedState}
        availableTransitions={transitions}
        actorRole={actorRole}
        onActorRoleChange={setActorRole}
        onAction={(name) => {
          const tr = transitions.find((t) => t.name === name)
          if (tr) {
            setSelectedTransition(tr)
            setIsDialogOpen(true)
          }
        }}
      />

      <ActionJustificationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        actionName={selectedTransition?.name || ''}
        actionLabel={selectedTransition?.label || ''}
        isReturn={selectedTransition?.name.includes('return') || selectedTransition?.name.includes('reject')}
        onSubmit={async ({ comments, targetRecipient, file }) => {
          if (selectedTransition) {
            const finalRemarks = targetRecipient ? `${targetRecipient}. ${comments}`.trim() : comments
            await verify.mutateAsync({
              transitionName: selectedTransition.name,
              comments: finalRemarks,
              file,
            })
          }
        }}
      />



      {normalizedState === 'Drafting' && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Drafting — Land Schedule Created</AlertTitle>
          <AlertDescription>
            Compose the plot schedule and complete the compliance checklist, then submit for Adjacent Colliery &amp; Unit Office verification.
          </AlertDescription>
        </Alert>
      )}

      {normalizedState === 'Published' && (
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

function LimitsTab({ schedule }: { schedule: ScheduleDetail }) {
  const { data: limits, isLoading: loadingLimits } = useQuery({
    queryKey: ['proposals', schedule.id, 'limits'],
    queryFn: async () => {
      const r = await fetch(`/api/proposals/${schedule.id}/limits`)
      if (!r.ok) throw new Error('Failed to load limits')
      const json = await r.json()
      return json.details
    }
  })

  return <LimitCheckPanel limits={limits || null} loading={loadingLimits} />
}

// ─── Tab 4: Timeline ─────────────────────────────────────────────────────
function TimelineTab({ schedule }: { schedule: ScheduleDetail }) {
  const normalizedState = getNormalizedState(schedule.state)

  const { data: limitsData } = useQuery<{ isWithinLimit: boolean }>({
    queryKey: ['proposals', schedule.id, 'limits'],
    queryFn: async () => {
      const r = await fetch(`/api/proposals/${schedule.id}/limits`)
      if (!r.ok) return null
      const json = await r.json()
      return json.details
    }
  })

  const isBreached = limitsData ? (limitsData.isWithinLimit === false) : false
  const isBoardBranchState = normalizedState === 'BoardEscalation' || normalizedState === 'BoardApproved' || normalizedState === 'LimitBreached'

  // Only display Board Escalation / Board Approved nodes if a baseline breach occurs or proposal is in Board state
  const statesToDisplay = COMPENSATION_PAYROLL_ORDERED_STATES.filter((state) => {
    if (state === 'BoardEscalation' || state === 'BoardApproved' || state === 'LimitBreached') {
      return isBreached || isBoardBranchState
    }
    return true
  })

  const nodes: TimelineNode[] = statesToDisplay.map((state) => {
    const meta = COMPENSATION_PAYROLL_STATES[state]
    const currentState = normalizedState as keyof typeof COMPENSATION_PAYROLL_STATES
    const isBranch = state === 'BoardEscalation' || state === 'LimitBreached'
    let status: TimelineNode['status'] = 'pending'

    if (currentState === 'BoardEscalation' || currentState === 'LimitBreached') {
      if (state === 'BoardEscalation' || state === 'LimitBreached') status = 'current'
      else if (meta.order < COMPENSATION_PAYROLL_STATES.GmLreReview.order) status = 'done'
      else if (state === 'GmLreReview') status = 'done'
      else status = 'pending'
    } else {
      if (meta.order < COMPENSATION_PAYROLL_STATES[currentState].order) status = 'done'
      else if (state === currentState) status = 'current'
    }

    const adjacentTarget = schedule.adjacent_colliery ? schedule.adjacent_colliery : (schedule.mine_cd ? `Mine ${schedule.mine_cd}` : 'Adjacent Colliery Office')
    const collieryInfo = `Assigned Adjacent Colliery: ${adjacentTarget}`

    return {
      state,
      label: meta.label,
      status,
      note: status === 'current' 
        ? (state === 'UnitSubmitted' ? `${collieryInfo} — ${meta.description}` : meta.description)
        : (state === 'UnitSubmitted' ? collieryInfo : undefined),
      isBranch,
    }
  })

  return (
    <div className="space-y-6">
      <SectionCard
        title="Workflow Stage Stepper"
        icon={History}
        description="Finite state machine stage stepper — spec §2.3.1."
      >
        <StatusTimeline nodes={nodes} maxheight={320} />
      </SectionCard>

      <WorkflowTimelineFeed moduleCode="LAND_SCHEDULE" entityId={schedule.id} maxHeight={480} />
    </div>
  )
}

import { ManualMilestonePanel, Milestone } from '@/shared/components/coalrr/ManualMilestonePanel'
import { LimitCheckPanel } from '@/shared/components/coalrr/LimitCheckPanel'
import { milestoneConfig } from '@/core/config/milestone.config'

function MilestonesTab({ schedule }: { schedule: ScheduleDetail }) {
  const qc = useQueryClient()
  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: ['proposals', schedule.id, 'milestones'],
    queryFn: async () => {
      const r = await fetch(`/api/proposals/${schedule.id}/milestones`)
      if (!r.ok) throw new Error('Failed to load milestones')
      return r.json()
    }
  })

  const addMilestone = useMutation({
    mutationFn: async (newMilestone: { milestone_type: string; authority: string; reference_no?: string; outcome?: string; remarks?: string; document_id?: string | null }) => {
      const r = await fetch(`/api/proposals/${schedule.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to record milestone');
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success('Milestone recorded successfully')
      qc.invalidateQueries({ queryKey: ['proposals', schedule.id, 'milestones'] })
    },
    onError: (e: Error) => toast.error('Failed to add milestone', { description: e.message })
  })

  const deleteMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      const r = await fetch(`/api/proposals/${schedule.id}/milestones/${milestoneId}`, {
        method: 'DELETE',
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to delete milestone');
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success('Milestone deleted successfully')
      qc.invalidateQueries({ queryKey: ['proposals', schedule.id, 'milestones'] })
    },
    onError: (e: Error) => toast.error('Failed to delete milestone', { description: e.message })
  })

  const editMilestone = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: { milestone_type: string; authority: string; reference_no?: string; outcome?: string; remarks?: string; document_id?: string | null } }) => {
      const r = await fetch(`/api/proposals/${schedule.id}/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to update milestone');
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success('Milestone updated successfully')
      qc.invalidateQueries({ queryKey: ['proposals', schedule.id, 'milestones'] })
    },
    onError: (e: Error) => toast.error('Failed to update milestone', { description: e.message })
  })

  const modeStr = String(schedule.acquisition_mode || '').toLowerCase()
  const isDirectPurchase = modeStr.includes('direct') || modeStr === 'dp'

  return (
    <div className="space-y-4">
      <SectionCard 
        title={isDirectPurchase ? "Purchase Milestones & Registrations" : "Government Notifications & Statutory Milestones"} 
        icon={CheckCircle2} 
        description={
          isDirectPurchase 
            ? "Track Sale Deed Registration, Stamp Duty Clearance, Valuation Approvals, and Land Handover milestones."
            : "Track Section 4, 7, 9, 11 gazette notifications and statutory legal clearances."
        }
      >
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <ManualMilestonePanel 
            milestones={milestones || []} 
            readOnly={false} 
            isDirectPurchase={isDirectPurchase}
            config={isDirectPurchase ? milestoneConfig.DP : milestoneConfig.CBA}
            onAddSubmit={async (m) => {
              await addMilestone.mutateAsync(m)
            }}
            onEditSubmit={async (id, m) => {
              await editMilestone.mutateAsync({ id, data: m })
            }}
            onDeleteSubmit={async (id) => {
              await deleteMilestone.mutateAsync(id)
            }}
          />
        )}
      </SectionCard>
    </div>
  )
}
