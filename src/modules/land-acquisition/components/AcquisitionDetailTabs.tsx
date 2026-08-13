// Force reload 1
'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Can } from '@/authorization/components/Can'
import {
  SectionCard, DataTable, StateBadge, SmartChecklist, ApprovalPanel, StatusTimeline, ActionJustificationDialog, PartialAreaInputDialog, ProcessActionCenter, UnifiedWorkflowTimeline, WorkflowTimelineFeed, WorkflowActionBar, WorkflowActionDialog
} from '@/shared/components/coalrr'
import { useWorkflowSnapshot } from '@/shared/hooks/useWorkflowSnapshot'
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'
import type { WorkflowTransitionOption } from '@/core/workflow/types/snapshot.types'

import { ProposalOverviewSection } from './sections/ProposalOverviewSection'
import { ProposalMetaBreakdownCard } from './sections/ProposalMetaBreakdownCard'
import type {
  Column, AvailableTransition, TimelineNode, ChecklistItem, ChecklistItemStatus, StageStep,
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
import { getChecklistStatus, updateChecklistSubmission } from '@/app/actions/checklist.actions'

import {
  MODE_META, MODES, ANNEXURE_META, LAND_TYPE_COLOR,
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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = React.useState<'checklist' | 'plots' | 'milestones'>('checklist')

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

  const actorRole = mapUserRole(user?.roles?.[0])

  const { data: snapshot } = useWorkflowSnapshot(
    MODULE_CODES.LAND_SCHEDULE,
    CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
    schedule.id,
    actorRole
  )

  const handleProcessUpdated = () => {
    qc.invalidateQueries({ queryKey: ['schedules'] })
    qc.invalidateQueries({ queryKey: ['schedule', schedule.id] })
    qc.invalidateQueries({ queryKey: ['workflow', 'history', MODULE_CODES.LAND_SCHEDULE, schedule.id] })
    qc.invalidateQueries({ queryKey: ['proposals', schedule.id, 'milestones'] })
    qc.invalidateQueries({ queryKey: ['schedules', schedule.id, 'checklist-status'] })
    qc.invalidateQueries({ queryKey: ['workflow-snapshot', MODULE_CODES.LAND_SCHEDULE, CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, schedule.id] })
    router.refresh()
  }

  // Dynamic stage progress steps from workflow snapshot
  const stages: StageStep[] = snapshot?.assignments && snapshot.assignments.length > 0
    ? snapshot.assignments.map(a => ({
        code: a.id.replace('assignment-', ''),
        label: a.stageName,
        status: a.status === 'CURRENT' ? 'current' : a.status === 'COMPLETED' ? 'done' : 'pending'
      }))
    : [
        { code: 'Drafting', label: 'Drafting', status: schedule.state === 'Drafting' ? 'current' : 'done' },
        { code: 'UnitSubmitted', label: 'Unit Office', status: schedule.state === 'UnitSubmitted' ? 'current' : (schedule.state === 'Drafting' ? 'pending' : 'done') },
        { code: 'AreaVetting', label: 'Area Office', status: schedule.state === 'AreaVetting' ? 'current' : (['Drafting', 'UnitSubmitted'].includes(schedule.state) ? 'pending' : 'done') },
        { code: 'HqParallelVetting', label: 'HQ Parallel', status: schedule.state === 'HqParallelVetting' ? 'current' : (['Drafting', 'UnitSubmitted', 'AreaVetting'].includes(schedule.state) ? 'pending' : 'done') },
        { code: 'GmLreReview', label: 'GM (LRE)', status: schedule.state === 'GmLreReview' ? 'current' : (['Published'].includes(schedule.state) ? 'done' : 'pending') },
        { code: 'Published', label: 'Published', status: schedule.state === 'Published' ? 'done' : 'pending' },
      ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Unified Timeline Feed & Main Workspace Tabs */}
        <div className="lg:col-span-8 space-y-6">
          <UnifiedWorkflowTimeline
            moduleCode={MODULE_CODES.LAND_SCHEDULE}
            entityId={schedule.id}
            stages={stages}
          />

          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <TabsList className="w-fit flex-wrap">
              <TabsTrigger value="checklist"><FileText className="mr-2 h-3.5 w-3.5" /> Compliance Checklist</TabsTrigger>
              <TabsTrigger value="plots"><Layers className="mr-2 h-3.5 w-3.5" /> Plots &amp; Annexures</TabsTrigger>
              <TabsTrigger value="milestones"><Calendar className="mr-2 h-3.5 w-3.5" /> Statutory Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-4 space-y-6">
              <ChecklistTab schedule={schedule} onChanged={handleProcessUpdated} />
            </TabsContent>

            <TabsContent value="plots" className="mt-4">
              <PlotsTab schedule={schedule} onChanged={handleProcessUpdated} />
            </TabsContent>

            <TabsContent value="milestones" className="mt-4">
              <MilestonesTab schedule={schedule} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar Column (4 cols): Action Command Center, Proposal Metadata & Breakdown, Baseline Limits */}
        <div className="lg:col-span-4 space-y-6">
          <PendingActionBanner
            schedule={schedule}
            actorRole={actorRole}
            snapshot={snapshot}
            onSelectTab={(tab) => setActiveTab(tab)}
            onActionTriggered={handleProcessUpdated}
          />
          <ProposalMetaBreakdownCard schedule={schedule} />
          <LimitsTab schedule={schedule} />
        </div>
      </div>
    </div>
  )
}

function PendingActionBanner({
  schedule,
  actorRole,
  snapshot,
  onSelectTab,
  onActionTriggered
}: {
  schedule: ScheduleDetail;
  actorRole: string;
  snapshot?: any;
  onSelectTab: (tab: 'checklist' | 'plots' | 'milestones') => void;
  onActionTriggered?: () => void;
}) {
  const qc = useQueryClient()
  const pendingActions = snapshot?.currentAssignment?.pendingActions || []
  const availableTransitions = snapshot?.availableTransitions || []

  const [selectedTransition, setSelectedTransition] = React.useState<WorkflowTransitionOption | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const verify = useMutation({
    mutationFn: async ({ transitionName, comments, file, targetRecipientId }: any) => {
      const payload: any = { 
        action: transitionName, 
        transitionName,
        role: actorRole,
        comments: comments || `Transitioned via UI`
      }
      if (targetRecipientId) payload.adjacent_mine_ids = [targetRecipientId]
      
      let uploadedDocId: string | null = null
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('module', MODULE_CODES.LAND_SCHEDULE)
        formData.append('document_type', 'TRANSITION_ATTACHMENT')
        try {
          const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
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
        body: JSON.stringify({ ...payload, document_id: uploadedDocId }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Transition failed')
      if (data.ok === false) throw new Error(data.reason ?? 'Transition blocked')
      return data
    },
    onSuccess: (data) => {
      toast.success(`Transitioned to ${data.newStatusLabel ?? 'next state'}`)
      qc.invalidateQueries({ queryKey: ['schedules'] })
      qc.invalidateQueries({ queryKey: ['workflow-snapshot', MODULE_CODES.LAND_SCHEDULE, CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, schedule.id] })
      if (onActionTriggered) onActionTriggered()
      setIsDialogOpen(false)
    },
    onError: (e: Error) => toast.error('Transition blocked', { description: e.message }),
  })

  return (
    <SectionCard title="My Pending Actions" icon={ShieldCheck} description="Required tasks for your role in the active stage">
      <div className="space-y-4">
        {/* Dynamic Pending Action Stack */}
        {pendingActions.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>All stage prerequisites complete! You may proceed with available state transitions.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingActions.map((action: any) => {
              const isPlot = action.code === 'ADD_PLOT_SCHEDULE';
              const isChecklist = action.code === 'INITIAL_CHECKLIST';
              const targetTab = action.metadata?.targetTab || (isPlot ? 'plots' : 'checklist');

              return (
                <div
                  key={action.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-border/80 bg-card hover:bg-muted/40 transition-colors gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">{action.label}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-amber-50 text-amber-800 border-amber-300">
                        {action.type || 'PENDING'}
                      </Badge>
                    </div>
                    {action.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{action.description}</p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 shrink-0 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                    onClick={() => onSelectTab(targetTab)}
                  >
                    {isPlot ? 'Add Plots' : isChecklist ? 'View Rules' : 'Open Workspace'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Transition Actions */}
        {availableTransitions.length > 0 && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Available Transitions</div>
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((t: WorkflowTransitionOption) => (
                <Button
                  key={t.transitionId || t.name}
                  size="sm"
                  className="text-xs font-semibold"
                  disabled={verify.isPending}
                  onClick={() => {
                    setSelectedTransition(t)
                    setIsDialogOpen(true)
                  }}
                >
                  {t.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ActionJustificationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        actionName={selectedTransition?.name || ''}
        actionLabel={selectedTransition?.name || ''}
        isReturn={selectedTransition?.name.includes('return') || selectedTransition?.name.includes('reject')}
        onSubmit={async ({ comments, targetRecipient, targetRecipientId, file }) => {
          if (selectedTransition) {
            const finalRemarks = targetRecipient ? `${targetRecipient}. ${comments}`.trim() : comments
            await verify.mutateAsync({
              transitionName: selectedTransition.name,
              comments: finalRemarks,
              file,
              targetRecipientId,
            })
          }
        }}
      />
    </SectionCard>
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
    { key: 'plot_number', header: 'Plot & Mouza Specs', sortable: true, render: (r) => {
      const cleanPlot = (r.plot_number || '').replace(/^(LR\s+LR\s*)/i, 'LR ')
      return (
      <div className="flex flex-col gap-0.5 py-1 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-foreground">{cleanPlot}</span>
          {r.opt_plot_number && (
            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
              Prev: {r.opt_plot_number}
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate font-medium">
          <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
          <span>{r.mouza}{r.jl_no ? ` (JL: ${r.jl_no})` : ''}</span>
        </p>
      </div>
      )
    } },
    { key: 'total_area', header: 'Acreage (ROR / Acq)', align: 'right', sortable: true, render: (r) => (
      <div className="flex flex-col items-end gap-1 py-1 font-mono text-xs">
        <span className="font-bold text-foreground">{formatNumber(r.total_ror_area || Number(r.area_acres || 0), 4)} Ac</span>
        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          Acq: {formatNumber(r.to_be_acquired_area || Number(r.area_acres || 0), 4)} Ac
        </span>
      </div>
    ) },
    { key: 'land_type', header: 'Land Category & Purpose', render: (r) => {
      if (r.land_types_breakdown && r.land_types_breakdown.length > 0) {
        return (
          <div className="flex flex-col gap-2 py-1 min-w-[200px]">
            {r.land_types_breakdown.map((bt, idx) => (
              <div key={idx} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground">{bt.primary_name}</span>
                  <span className="font-mono text-[11px] font-bold text-foreground">{formatNumber(bt.primary_area, 4)} Ac</span>
                </div>
                {bt.use_purpose && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/90">
                    PURPOSE: {bt.use_purpose}
                  </span>
                )}
                {bt.sub_types && bt.sub_types.length > 0 && (
                  <div className="mt-0.5 space-y-0.5 pl-2">
                    {bt.sub_types.map((st, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{st.sub_name}</span>
                        <span className="font-mono font-semibold text-foreground">{formatNumber(st.area_to_acquire, 4)} Ac</span>
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
        <span className="text-xs font-semibold text-foreground">
          {r.land_type}
        </span>
      )
    } },
    { key: 'annexure_tag', header: 'Annexure Clearance', align: 'center', render: (r) => {
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
            className="h-8 text-xs font-semibold rounded-md border border-input bg-background px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="PROPOSED">ANX A</option>
            <option value="PURCHASED">ANX B</option>
            <option value="PARTIALLY_PURCHASED">ANX C</option>
          </select>
        )
      }

      return (
        <span className="text-xs font-mono font-semibold text-foreground">
          ANX {r.annexure_tag}
        </span>
      )
    } },
    ...(canEdit ? [{
      key: 'actions' as keyof ScheduleItem,
      header: 'Actions',
      align: 'right' as const,
      render: (r: ScheduleItem) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditPlotId(r.plot_id || r.id)}
            className="h-8 w-8 p-0 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40"
            title="Edit Plot Parameters"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Remove Plot"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Plot {r.plot_number}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action removes plot {r.plot_number} from proposal schedule {schedule.schedule_code}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteItem.mutate(r.plot_id || r.id)}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }] : [])
  ]

  const columns = baseColumns

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



      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Schedule Items (Plots)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isDrafting
                ? `${schedule.items.length} plot(s) · total ${formatNumber(schedule.total_area_acres, 4)} acres`
                : `Schedule locked in ${schedule.state} — plots cannot be added or removed`}
            </p>
          </div>
          <PlotScheduleManager 
            proposalId={schedule.id} 
            isDrafting={isDrafting} 
            projectStateLgd={schedule.project_state_lgd}
            projectMouzas={schedule.projectMouzas}
            editPlotId={editPlotId}
            setEditPlotId={setEditPlotId}
            onChanged={onChanged} 
          />
        </div>

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
      </div>

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
        moduleCode={MODULE_CODES.LAND_SCHEDULE}
        checkableType={CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE}
        checkableId={schedule.id}
        userId={user?.id || 'system'}
        title="Compliance Checklist"
        description={`Mode-specific compliance items for ${MODE_META[schedule.acq_mode_id]?.label ?? schedule.acq_mode_id}. Completeness status is automatically validated by the Workflow Engine.`}
        onChanged={onChanged}
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
  const { data: snapshot } = useWorkflowSnapshot(
    MODULE_CODES.LAND_SCHEDULE,
    CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
    schedule.id,
    'unit_office'
  )

  const stages: StageStep[] = snapshot?.assignments && snapshot.assignments.length > 0
    ? snapshot.assignments.map(a => ({
        code: a.id.replace('assignment-', ''),
        label: a.stageName,
        status: a.status === 'CURRENT' ? 'current' : a.status === 'COMPLETED' ? 'done' : 'pending'
      }))
    : [{ code: schedule.state, label: schedule.state, status: 'current' }]

  return (
    <div className="space-y-6">
      <UnifiedWorkflowTimeline
        moduleCode={MODULE_CODES.LAND_SCHEDULE}
        entityId={schedule.id}
        stages={stages}
        maxHeight={550}
      />
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
      const r = await fetch(`/api/milestones/proposal/${schedule.id}`)
      if (!r.ok) throw new Error('Failed to load milestones')
      return r.json()
    }
  })

  const addMilestone = useMutation({
    mutationFn: async (newMilestone: { milestone_type: string; authority: string; reference_no?: string; outcome?: string; remarks?: string; document_id?: string | null }) => {
      const r = await fetch(`/api/milestones/proposal/${schedule.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to record milestone');
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
      const r = await fetch(`/api/milestones/proposal/${schedule.id}/${milestoneId}`, {
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
      const r = await fetch(`/api/milestones/proposal/${schedule.id}/${id}`, {
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

  const isDirectPurchase = schedule.acq_mode_id === 6 // ACQ_MODE_ID.DIRECT_PURCHASE

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
