// Force reload 1
'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Can } from '@/authorization/components/Can'
import {
  SectionCard, DataTable, StateBadge, SmartChecklist, ApprovalPanel, StatusTimeline, WorkflowActionCommandCenter, PartialAreaInputDialog, ProcessActionCenter, UnifiedWorkflowTimeline, WorkflowTimelineFeed, WorkflowActionBar
} from '@/shared/components/coalrr'
import { useWorkflowSnapshot } from '@/shared/hooks/useWorkflowSnapshot'
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES, resolveWorkflowCode } from '@/core/config/module-codes.config'
import type { WorkflowTransitionOption } from '@/core/workflow/types/snapshot.types'

import { ProposalOverviewSection } from './sections/ProposalOverviewSection'
import { ProposalMetaBreakdownCard } from './sections/ProposalMetaBreakdownCard'
import type {
  Column, AvailableTransition, TimelineNode, ChecklistItem, ChecklistItemStatus, StageStep,
} from '@/shared/components/coalrr'
import { cn } from '@/lib/utils'
import { formatNumber, timeAgo,  } from '@/lib/utils/formatters'
import { useUiState } from '@/providers/UiStateProvider'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { routes } from '@/lib/url/UrlService'
import { PlotScheduleManager } from '@/modules/proposal/components/PlotScheduleManager'
import { MouzaAbstractSection } from '@/modules/proposal/components/MouzaAbstractSection'
import { ProposalCostSheetSection } from '@/modules/proposal/components/ProposalCostSheetSection'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
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
  ClipboardList, Plus, Loader2, ArrowLeft, ArrowRight, MapPin, Building2, Calendar, ShieldCheck,
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
  const [selectedTransition, setSelectedTransition] = React.useState<WorkflowTransitionOption | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

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

  const modeId = (schedule as any).acq_mode_id ? Number((schedule as any).acq_mode_id) : undefined
  const workflowCode = resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, modeId)

  const { data: dbStatesData } = useQuery({
    queryKey: ['workflow-states', workflowCode],
    queryFn: async () => {
      const res = await fetch(`/api/workflow/states?workflowCode=${workflowCode}`)
      if (!res.ok) return []
      const json = await res.json()
      return (json.states || []) as Array<{ state_code: string; label: string; step_order: number; is_terminal: boolean }>
    },
    enabled: Boolean(workflowCode),
  })

  const handleProcessUpdated = () => {
    qc.invalidateQueries({ queryKey: ['schedules'] })
    qc.invalidateQueries({ queryKey: ['schedule', schedule.id] })
    qc.invalidateQueries({ queryKey: ['workflow', 'history', MODULE_CODES.LAND_SCHEDULE, schedule.id] })
    qc.invalidateQueries({ queryKey: ['proposals', schedule.id, 'milestones'] })
    qc.invalidateQueries({ queryKey: ['schedules', schedule.id, 'checklist-status'] })
    qc.invalidateQueries({ queryKey: ['workflow-snapshot', MODULE_CODES.LAND_SCHEDULE, CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, schedule.id] })
    router.refresh()
  }

  // Fully DB-configured dynamic stage progress steps for active acquisition mode
  const currentStateCode = snapshot?.currentState?.stateCode || schedule.state || 'Drafting'
  const currentStepOrder = dbStatesData?.find((s) => s.state_code === currentStateCode)?.step_order ?? 1

  const stages: StageStep[] = (dbStatesData && dbStatesData.length > 0)
    ? dbStatesData.map((s) => ({
        code: s.state_code,
        label: s.label,
        status: s.state_code === currentStateCode
          ? 'current'
          : s.step_order < currentStepOrder
          ? 'done'
          : 'pending',
        order: s.step_order,
      }))
    : snapshot?.assignments && snapshot.assignments.length > 0
    ? snapshot.assignments.map((a) => ({
        code: a.id.replace('assignment-', ''),
        label: a.stageName,
        status: a.status === 'CURRENT' ? 'current' : a.status === 'COMPLETED' ? 'done' : 'pending',
      }))
    : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Unified Timeline Feed & Main Workspace Tabs */}
        <div className="lg:col-span-8 space-y-6">
          <WorkflowTimelineFeed
            moduleCode={MODULE_CODES.LAND_SCHEDULE}
            entityType={CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE}
            entityId={schedule.id}
            userRole={actorRole}
            onExecuteAction={(action) => {
              const isPlot = action.code === 'ADD_PLOT_SCHEDULE'
              const isChecklist = action.code === 'INITIAL_CHECKLIST'
              const targetTab: 'checklist' | 'plots' | 'milestones' = (action.metadata?.targetTab as any) || (isPlot ? 'plots' : 'checklist')
              setActiveTab(targetTab)
            }}
            onRecordMilestone={() => setActiveTab('milestones')}
            onSignDocument={() => setActiveTab('checklist')}
            onExecuteTransition={(t) => {
              setSelectedTransition(t)
              setIsDialogOpen(true)
            }}
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
            onSelectTransition={(t) => {
              setSelectedTransition(t)
              setIsDialogOpen(true)
            }}
          />
          <ProposalMetaBreakdownCard schedule={schedule} />
          <LimitsTab schedule={schedule} />
        </div>
      </div>

      <WorkflowActionCommandCenter
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        proposalId={schedule.id}
        moduleCode={MODULE_CODES.LAND_SCHEDULE}
        entityType={CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE}
        transition={selectedTransition as any}
      />
    </div>
  )
}

function PendingActionBanner({
  schedule,
  actorRole,
  snapshot,
  onSelectTab,
  onActionTriggered,
  onSelectTransition,
}: {
  schedule: ScheduleDetail;
  actorRole: string;
  snapshot?: any;
  onSelectTab: (tab: 'checklist' | 'plots' | 'milestones') => void;
  onActionTriggered?: () => void;
  onSelectTransition?: (transition: WorkflowTransitionOption) => void;
}) {
  const qc = useQueryClient()
  const pendingActions = snapshot?.currentAssignment?.pendingActions || []
  const availableTransitions = snapshot?.availableTransitions || []

  const actionableByMe = pendingActions.filter((p: any) => p.classification === 'ACTIONABLE_BY_ME' && p.status !== 'COMPLETED')
  const waitingOnOthers = pendingActions.filter((p: any) => p.classification === 'WAITING_ON_ASSIGNEE' && p.status !== 'COMPLETED')
  const incompletePendingCount = pendingActions.filter((p: any) => p.status !== 'COMPLETED').length
  const isAllPendingWorkCompleted = incompletePendingCount === 0
  const isMyActionCompleted = actionableByMe.length === 0

  const [selectedTransition, setSelectedTransition] = React.useState<WorkflowTransitionOption | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const verify = useMutation({
    mutationFn: async ({ transitionName, comments, file, targetRecipientId }: any) => {
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

      const payload: any = { 
        moduleCode: MODULE_CODES.LAND_SCHEDULE,
        entityType: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
        entityId: schedule.id,
        transition: transitionName,
        role: actorRole,
        comments: comments || `Transitioned via UI`,
        document_id: uploadedDocId
      }
      if (targetRecipientId) payload.mine_cd = targetRecipientId

      const r = await fetch(`/api/workflow/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? data.message ?? 'Transition failed')
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
    <SectionCard title="My Pending Actions" icon={ShieldCheck} description="State transition actions for your active role">
      <div className="space-y-4">
        {/* Status Summary Banner */}
        {isAllPendingWorkCompleted ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>All Stage Tasks Completed (100%)</span>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              Prerequisites met. Select a transition action below to advance or return the proposal.
            </p>
          </div>
        ) : isMyActionCompleted && waitingOnOthers.length > 0 ? (
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 dark:bg-sky-950/30 dark:border-sky-900 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-900 dark:text-sky-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600" />
              <span>Your Stage Actions Completed</span>
            </div>
            <p className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
              Your signatures & prerequisites are complete. Proposal is awaiting{' '}
              <span className="font-semibold">{waitingOnOthers[0]?.requiredPermission?.split('.').pop()?.replace(/[-_]/g, ' ') || 'the next signatory'}</span>.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 dark:bg-amber-950/30 dark:border-amber-900 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pending Tasks Incomplete ({incompletePendingCount} Remaining)</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              You must complete all mandatory checklist rules and plot schedule locks before state transition actions become available.
            </p>
          </div>
        )}

        {/* Intra-Stage Forwarding / Handover Action */}
        <div className="pt-1 space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Intra-Stage Forwarding
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-between h-9 px-3.5 text-xs font-semibold border-sky-300 text-sky-800 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300"
            onClick={() => {
              onSelectTransition?.({
                name: 'forward_for_signature',
                label: 'Forward for Next Signature',
                transitionId: 'handover_for_signature',
                fromState: schedule.state || 'UnitSubmitted',
                toState: schedule.state || 'UnitSubmitted',
                to: schedule.state || 'UnitSubmitted',
                routingType: 'HANDOVER',
                guards: { canExecute: true, blockingReasons: [] },
                destination: {
                  state: schedule.state || 'UnitSubmitted',
                  label: 'Next Signatory / Colliery Manager',
                  targetRole: 'Colliery Manager / Unit Office',
                },
                recipient: {
                  required: false,
                  selectionType: 'USER',
                  allowedAreaCds: [],
                  allowedMineCds: [],
                },
                reason: { required: true },
                supportingDocument: { allowed: true, required: false },
              } as any);
            }}
          >
            <span className="flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-sky-600" />
              Forward for Next Signature
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-sky-500" />
          </Button>
        </div>

        {/* Transition Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Available Workflow Transitions
          </div>

          {availableTransitions.length === 0 ? (
            <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground italic flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              No transitions available from this state.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {availableTransitions.map((t: WorkflowTransitionOption) => {
                const isReturn = t.name.toLowerCase().includes('return') || t.name.toLowerCase().includes('reject');

                const btn = (
                  <Button
                    key={t.transitionId || t.name}
                    size="sm"
                    disabled={!isAllPendingWorkCompleted}
                    className={cn(
                      'w-full justify-between h-9 px-3.5 text-xs font-semibold shadow-xs transition-all',
                      isReturn
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white',
                      !isAllPendingWorkCompleted && 'opacity-60 cursor-not-allowed bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                    )}
                    onClick={() => isAllPendingWorkCompleted && onSelectTransition && onSelectTransition(t)}
                  >
                    <span>{t.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                );

                if (!isAllPendingWorkCompleted) {
                  return (
                    <TooltipProvider key={t.transitionId || t.name} delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>{btn}</div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="text-xs max-w-xs font-medium bg-slate-900 text-slate-100 border border-slate-800 shadow-2xl p-3 rounded-lg">
                          <div className="flex items-center gap-1.5 font-bold text-amber-400">
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            Complete all stage tasks first
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            All 6 current-stage signatures and prerequisites must be completed before advancing to the next workflow state.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return btn;
              })}
            </div>
          )}
        </div>
      </div>
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
  const isLocked = schedule.plots_locked
  
  // Logic: Users cannot edit while verification is running.
  // Exception: Area GM can edit/delete disputed plots when the workflow is frozen by a grievance/overlap.
  // For this prototype, we'll assume the presence of grievances means frozen.
  const hasGrievances = (schedule as any).grievances?.some((g: any) => !g.resolution)
  const isAGM = user?.roles.includes('area_gm')
  const canEdit = (isDrafting && !isLocked) || (hasGrievances && isAGM)

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

  const lockSchedule = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/proposals/${schedule.id}/plots/lock`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to lock schedule')
      return data
    },
    onSuccess: () => {
      toast.success('Plot schedule locked', {
        description: 'The plot schedule has been finalised and is now part of the workflow record.',
      })
      onChanged()
    },
    onError: (e: Error) => toast.error('Lock failed', { description: e.message }),
  })

  const updateStatus = useMutation({
    mutationFn: async ({
      plot_no,
      status,
      total_poss_area,
      to_be_acquired_area,
      remarks,
      landTypeAdjustments,
    }: {
      plot_no: string
      status: string
      total_poss_area?: number
      to_be_acquired_area?: number
      remarks?: string
      landTypeAdjustments?: Array<{ land_type_name: string; area_to_acquire: number }>
    }) => {
      const r = await fetch(`/api/proposals/${schedule.id}/plots/${plot_no}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acq_status: status,
          total_poss_area,
          to_be_acquired_area,
          remarks,
          landTypeAdjustments,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to update status')
      return data
    },
    onSuccess: () => {
      toast.success('Adjacent colliery status updated')
      setPartialPlot(null)
      qc.invalidateQueries({ queryKey: ['mouza-abstract', schedule.id] })
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



      {/* Mouza-Wise Land Abstract Section */}
      <MouzaAbstractSection proposalId={schedule.id} />

      {/* Proposal Financial Cost Calculation Sheet Section */}
      <ProposalCostSheetSection proposalId={schedule.id} />

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Schedule Items (Plots)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isDrafting && !isLocked
                ? `${schedule.items.length} plot(s) · total ${formatNumber(schedule.total_area_acres, 4)} acres · automatically locked on workflow transition`
                : isLocked
                ? `Schedule locked — ${schedule.items.length} plot(s) · ${formatNumber(schedule.total_area_acres, 4)} acres`
                : `Schedule locked in ${schedule.state} — plots cannot be added or removed`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PlotScheduleManager 
              proposalId={schedule.id} 
              isDrafting={isDrafting && !isLocked} 
              projectStateLgd={schedule.project_state_lgd}
              projectMouzas={schedule.projectMouzas}
              editPlotId={editPlotId}
              setEditPlotId={setEditPlotId}
              onChanged={onChanged} 
            />
          </div>
        </div>

        {/* Locked banner */}
        {isLocked && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
            <Lock className="h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <span className="font-semibold">Plot Schedule Locked</span>
              <span className="ml-1 text-muted-foreground">— {schedule.items.length} plot(s) · {formatNumber(schedule.total_area_acres, 4)} acres. This step is marked complete in the workflow timeline.</span>
            </div>
          </div>
        )}

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
        landTypesBreakdown={
          partialPlot?.land_types_breakdown?.map(lt => ({
            land_type_name: lt.primary_name,
            total_area: lt.primary_area
          })) || (partialPlot ? [{ land_type_name: partialPlot.land_type || 'Tenancy', total_area: Number(partialPlot.area_acres || 0) }] : [])
        }
        onSubmit={async ({ totalPossArea, toBeAcquiredArea, remarks, landTypeAdjustments }) => {
          if (partialPlot) {
            await updateStatus.mutateAsync({
              plot_no: partialPlot.plot_id || partialPlot.plot_number,
              status: 'PARTIALLY_PURCHASED',
              total_poss_area: totalPossArea,
              to_be_acquired_area: toBeAcquiredArea,
              remarks,
              landTypeAdjustments,
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
