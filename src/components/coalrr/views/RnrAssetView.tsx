'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, StateBadge, MathPreviewPanel, ApprovalPanel, DataTable } from '@/components/coalrr'
import type { Column, MathPreviewResultLike, AvailableTransition, ReviewTaskView } from '@/components/coalrr'
import { formatINR, formatNumber } from '@/components/coalrr/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Home, Plus, CheckCircle2, AlertCircle, Loader2, FileText, Shield,
  Building, ArrowRight,
} from 'lucide-react'

// ─── PWD / SOR Reference Rates (hardcoded per spec) ──────────────────────────
const SOR_RATES: Record<string, number> = {
  homestead: 350_000,
  shifting_allowance: 50_000,
  cattle_shed: 75_000,
  subsistence_grant: 25_000,
}

const SOR_LABELS: Record<string, string> = {
  homestead: 'Homestead Compensation',
  shifting_allowance: 'Shifting Allowance',
  cattle_shed: 'Cattle Shed Structure',
  subsistence_grant: 'Subsistence Grant',
}

const ENTITLEMENT_OPTIONS = [
  { value: 'homestead', label: 'Homestead Compensation' },
  { value: 'shifting_allowance', label: 'Shifting Allowance' },
  { value: 'cattle_shed', label: 'Cattle Shed Structure' },
  { value: 'subsistence_grant', label: 'Subsistence Grant' },
]

// ─── R&R State Machine ───────────────────────────────────────────────────────
const RNR_STATES: Record<string, { label: string; order: number; description: string }> = {
  Drafting:     { label: 'Drafting',     order: 0, description: 'Building R&R asset proposal lines' },
  Submitted:    { label: 'Submitted',    order: 1, description: 'Awaiting area office verification' },
  UnderReview:  { label: 'Under Review', order: 2, description: 'HQ parallel vetting in progress' },
  Approved:     { label: 'Approved',     order: 3, description: 'Director / CMD approved' },
  Published:    { label: 'Published',    order: 4, description: 'R&R payroll published — immutable' },
}

const RNR_ORDERED_STATES = Object.keys(RNR_STATES) as Array<keyof typeof RNR_STATES>

function getTransitionsForState(state: string): AvailableTransition[] {
  const map: Record<string, AvailableTransition[]> = {
    Drafting: [
      { name: 'save_draft',   label: 'Save Draft',        role: 'unit_office' },
      { name: 'submit',       label: 'Submit for Review',  role: 'unit_office' },
    ],
    Submitted: [
      { name: 'begin_review', label: 'Begin Review',       role: 'area_office' },
      { name: 'return_draft', label: 'Return to Drafting', role: 'area_office', guardFailed: null },
    ],
    UnderReview: [
      { name: 'approve',      label: 'Approve',            role: 'gm_finance' },
      { name: 'reject',       label: 'Reject',             role: 'gm_finance' },
    ],
    Approved: [
      { name: 'publish',      label: 'Publish Payroll',    role: 'director' },
    ],
    Published: [],
  }
  return map[state] ?? []
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface RnrLine {
  id: string
  beneficiaryName: string
  entitlementType: string
  valuationAmount: number
  pwdRateReference: string | null
  formulaSnapshot: string | null
  createdAt: string
}

interface RnrPayroll {
  id: string
  payrollCode: string
  projectName: string
  projectId: string
  state: string
  totalValue: number
  lineCount: number
  lines: RnrLine[]
  reviewTasks: Array<{
    id: string
    role: string
    status: string
    decidedBy: string | null
    decidedAt: string | null
    comment: string | null
  }>
  createdAt: string
  updatedAt: string
}

interface ProjectOption {
  id: string
  name: string
  collieryCode: string
}

interface PafRecord {
  id: string
  pafNumber: string
  beneficiaryName: string
  khataNumber: string
  status: string
}

// ─── API helpers ─────────────────────────────────────────────────────────────
async function fetchRnrPayrolls(): Promise<RnrPayroll[]> {
  const r = await fetch('/api/rnr-payrolls')
  if (!r.ok) throw new Error('Failed to load R&R payrolls')
  return r.json()
}

async function fetchRnrPayroll(id: string): Promise<RnrPayroll> {
  const r = await fetch(`/api/rnr-payrolls/${id}`)
  if (!r.ok) throw new Error('Failed to load R&R payroll')
  return r.json()
}

async function createRnrPayroll(projectId: string): Promise<RnrPayroll> {
  const r = await fetch('/api/rnr-payrolls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })
  if (!r.ok) throw new Error('Failed to create R&R payroll')
  return r.json()
}

async function patchRnrPayroll(id: string, body: Record<string, unknown>): Promise<RnrPayroll> {
  const r = await fetch(`/api/rnr-payrolls/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new Error((d as Record<string, string>).error ?? 'Transition failed')
  }
  return r.json()
}

async function addRnrLine(
  payrollId: string,
  body: { beneficiaryName: string; entitlementType: string; valuationAmount: number; pwdRateReference?: string },
): Promise<RnrLine> {
  const r = await fetch(`/api/rnr-payrolls/${payrollId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new Error((d as Record<string, string>).error ?? 'Failed to add line')
  }
  return r.json()
}

async function fetchProjects(): Promise<ProjectOption[]> {
  const r = await fetch('/api/projects')
  if (!r.ok) throw new Error('Failed to load projects')
  return r.json()
}

async function fetchPafRecords(): Promise<PafRecord[]> {
  const r = await fetch('/api/paf')
  if (!r.ok) throw new Error('Failed to load PAF records')
  return r.json()
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function RnrAssetView() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState('build')
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [selectedProjectId, setSelectedProjectId] = React.useState('')
  const [actorRole, setActorRole] = React.useState('unit_office')
  const qc = useQueryClient()

  // ── Queries ──
  const { data: payrolls, isLoading: payrollsLoading } = useQuery({
    queryKey: ['rnr-payrolls'],
    queryFn: fetchRnrPayrolls,
  })

  const { data: projects } = useQuery({
    queryKey: ['projects-rnr'],
    queryFn: fetchProjects,
  })

  const { data: pafRecords } = useQuery({
    queryKey: ['paf-records'],
    queryFn: fetchPafRecords,
  })

  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ['rnr-payroll', selectedId],
    queryFn: () => fetchRnrPayroll(selectedId!),
    enabled: !!selectedId,
  })

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: () => createRnrPayroll(selectedProjectId),
    onSuccess: (p) => {
      toast.success(`R&R Payroll ${p.payrollCode} created`, { description: `Linked to ${p.projectName}` })
      setSelectedId(p.id)
      setCreateDialogOpen(false)
      setSelectedProjectId('')
      qc.invalidateQueries({ queryKey: ['rnr-payrolls'] })
    },
    onError: (e: Error) => toast.error('Creation failed', { description: e.message }),
  })

  const transitionMutation = useMutation({
    mutationFn: async ({ id, transition }: { id: string; transition: string }) => {
      return patchRnrPayroll(id, { transition, actorRole })
    },
    onSuccess: () => {
      toast.success('State transition applied')
      qc.invalidateQueries({ queryKey: ['rnr-payroll', selectedId] })
      qc.invalidateQueries({ queryKey: ['rnr-payrolls'] })
    },
    onError: (e: Error) => toast.error('Transition blocked', { description: e.message }),
  })

  // Auto-select first payroll
  React.useEffect(() => {
    if (!selectedId && payrolls && payrolls.length > 0) {
      setSelectedId(payrolls[0].id)
    }
  }, [selectedId, payrolls])

  // ── Derived ──
  const totalValue = React.useMemo(
    () => payroll?.lines.reduce((sum, l) => sum + l.valuationAmount, 0) ?? 0,
    [payroll?.lines],
  )

  const mathPreview: MathPreviewResultLike | null = React.useMemo(() => {
    if (!payroll || payroll.lines.length === 0) return null
    const base = totalValue
    const solatium = base
    const escalation = Math.round(base * 0.12 * 2) // assumed 2 years for preview
    const t = base + solatium + escalation
    return {
      solatium: formatINR(solatium),
      escalation: formatINR(escalation),
      total: formatINR(t),
      breakdown: { base: formatINR(base), solatium: formatINR(solatium), escalation: formatINR(escalation) },
      formula: `(${formatINR(base)} + ${formatINR(solatium)} + ${formatINR(escalation)}) = ${formatINR(t)}`,
    }
  }, [payroll, totalValue])

  const transitions = React.useMemo(
    () => (payroll ? getTransitionsForState(payroll.state) : []),
    [payroll],
  )

  const reviewTasks: ReviewTaskView[] = React.useMemo(
    () =>
      payroll?.reviewTasks.map((t) => ({
        role: t.role,
        status: t.status as 'pending' | 'approved' | 'rejected',
        decidedBy: t.decidedBy ?? undefined,
        decidedAt: t.decidedAt ?? undefined,
        comment: t.comment ?? undefined,
      })) ?? [],
    [payroll?.reviewTasks],
  )

  const matchScore = React.useMemo(() => {
    if (!payroll) return 0
    const checked = payroll.lines.filter((l) => {
      const sor = SOR_RATES[l.entitlementType]
      if (sor == null) return true
      return Math.abs(l.valuationAmount - sor) / sor <= 0.1
    }).length
    return payroll.lines.length > 0 ? Math.round((checked / payroll.lines.length) * 100) : 0
  }, [payroll])

  // ── Handlers ──
  const handleTransition = (name: string) => {
    if (!selectedId) return
    transitionMutation.mutate({ id: selectedId, transition: name })
  }

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">R&R Asset Proposal</h2>
            <p className="text-sm text-muted-foreground">
              Module M7 · ECL Internal Portal · Rehabilitation &amp; Resettlement Payroll
            </p>
          </div>
        </div>
        {payroll && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-mono text-sm font-semibold">{payroll.payrollCode}</p>
              <p className="text-xs text-muted-foreground">{payroll.projectName}</p>
            </div>
            <StateBadge state={payroll.state} size="md" />
          </div>
        )}
      </div>

      {/* Payroll selector strip */}
      <SectionCard
        title="R&R Payroll"
        icon={Building}
        description="Select an existing payroll or create a new one"
        action={
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create New R&R Payroll
          </Button>
        }
      >
        {payrollsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading payrolls…
          </div>
        ) : !payrolls || payrolls.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No R&R payrolls found. Create one to begin.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {payrolls.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id)
                  setActiveTab('build')
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  p.id === selectedId
                    ? 'border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'border-border bg-card text-muted-foreground hover:border-amber-300 hover:text-foreground'
                }`}
              >
                <span className="font-mono">{p.payrollCode}</span>
                <span className="ml-2 opacity-70">{p.lineCount} lines</span>
                <span className="ml-2 opacity-50">· {formatINR(p.totalValue)}</span>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Create Payroll Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New R&R Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project…" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.collieryCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!selectedProjectId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Tab Panel — only visible when a payroll is selected */}
      {selectedId && payroll && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="build" className="gap-1.5">
              <Building className="h-3.5 w-3.5" />
              Build
            </TabsTrigger>
            <TabsTrigger value="verify" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Verify
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Review
            </TabsTrigger>
          </TabsList>

          {/* ──────────── TAB 1: BUILD (ERP-M7-01) ──────────── */}
          <TabsContent value="build" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Left: Lines table + add line */}
              <div className="space-y-4 lg:col-span-2">
                <BuildLinesSection
                  payroll={payroll}
                  onInvalidate={() => {
                    qc.invalidateQueries({ queryKey: ['rnr-payroll', selectedId] })
                    qc.invalidateQueries({ queryKey: ['rnr-payrolls'] })
                  }}
                  pafRecords={pafRecords ?? []}
                />
              </div>

              {/* Right: Math preview + actions */}
              <div className="space-y-4">
                <MathPreviewPanel
                  result={mathPreview}
                  loading={payrollLoading}
                  formula={mathPreview?.formula}
                  className="sticky top-4"
                />

                {/* Action buttons */}
                <SectionCard title="Actions" icon={ArrowRight} description="Save draft or generate R&R payroll">
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={payroll.state !== 'Drafting' || payroll.lines.length === 0}
                      onClick={() => handleTransition('submit')}
                    >
                      {transitionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Generate R&R Payroll
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                      disabled={payroll.state !== 'Drafting'}
                      onClick={() => handleTransition('save_draft')}
                    >
                      Save Draft
                    </Button>
                    {payroll.state !== 'Drafting' && (
                      <p className="flex items-center gap-1.5 text-xs text-amber-700">
                        <AlertCircle className="h-3 w-3" />
                        Payroll locked in <strong>{RNR_STATES[payroll.state]?.label ?? payroll.state}</strong> state
                      </p>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* ──────────── TAB 2: VERIFY (ERP-M7-02) ──────────── */}
          <TabsContent value="verify" className="mt-4 space-y-4">
            {/* Verification progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">SOR Compliance Score</span>
                <span className={`font-bold tabular-nums ${matchScore >= 80 ? 'text-emerald-600' : matchScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {matchScore}%
                </span>
              </div>
              <Progress
                value={matchScore}
                className="h-2.5"
              />
              <p className="text-xs text-muted-foreground">
                {payroll.lines.length > 0
                  ? `${payroll.lines.filter((l) => {
                      const sor = SOR_RATES[l.entitlementType]
                      if (sor == null) return true
                      return Math.abs(l.valuationAmount - sor) / sor <= 0.1
                    }).length} of ${payroll.lines.length} lines within ±10% of PWD rates`
                  : 'No lines to verify'}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              {/* Left: Editable line items with deviation indicators */}
              <div className="lg:col-span-3">
                <SectionCard
                  title="Line Item Verification"
                  icon={Shield}
                  description="Each line compared against SOR reference rates — deviations flagged"
                >
                  <VerifyLinesTable payroll={payroll} />
                </SectionCard>
              </div>

              {/* Right: SOR Reference Table */}
              <div className="lg:col-span-2">
                <SectionCard
                  title="PWD Rate Reference (SOR)"
                  icon={FileText}
                  description="Standard rates per R&R entitlement category"
                >
                  <div className="space-y-2">
                    {Object.entries(SOR_RATES).map(([key, rate]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium">{SOR_LABELS[key] ?? key}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{key}</p>
                        </div>
                        <span className="font-bold tabular-nums text-amber-700 dark:text-amber-400">
                          {formatINR(rate)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        </span>
                        Within ±10%
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                          <AlertCircle className="h-2.5 w-2.5" />
                        </span>
                        Deviation &gt;10%
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* ──────────── TAB 3: REVIEW (ERP-M7-03) ──────────── */}
          <TabsContent value="review" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {/* Batch summary */}
                <SectionCard
                  title="Batch Summary"
                  icon={FileText}
                  description={`${payroll.payrollCode} · ${payroll.projectName}`}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryTile label="Payroll Code" value={payroll.payrollCode} mono />
                    <SummaryTile label="State" value={RNR_STATES[payroll.state]?.label ?? payroll.state} />
                    <SummaryTile label="Total Value" value={formatINR(totalValue)} accent />
                    <SummaryTile label="Line Count" value={String(payroll.lines.length)} />
                  </div>
                </SectionCard>

                {/* Read-only line items */}
                <SectionCard
                  title="Line Items (Read-Only)"
                  icon={FileText}
                  description={`${payroll.lines.length} entitlement line${payroll.lines.length !== 1 ? 's' : ''} · formula_snapshot attached`}
                >
                  <ReviewLinesTable lines={payroll.lines} />
                </SectionCard>
              </div>

              {/* Right: Approval panel */}
              <div className="space-y-4">
                <SectionCard title="Actor Role" icon={Shield} description="Simulate approver role">
                  <Select value={actorRole} onValueChange={setActorRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit_office">Unit Office</SelectItem>
                      <SelectItem value="area_office">Area Office</SelectItem>
                      <SelectItem value="gm_planning">GM (Planning)</SelectItem>
                      <SelectItem value="gm_finance">GM (Finance)</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="cmd">CMD</SelectItem>
                    </SelectContent>
                  </Select>
                </SectionCard>

                <ApprovalPanel
                  currentState={payroll.state}
                  reviewTasks={reviewTasks}
                  availableTransitions={transitions}
                  actorRole={actorRole}
                  onAction={handleTransition}
                />

                {/* State flow reference */}
                <SectionCard title="State Flow" description="R&R Payroll lifecycle">
                  <div className="space-y-2">
                    {RNR_ORDERED_STATES.map((state, idx) => {
                      const isCurrent = payroll.state === state
                      const isPast = RNR_STATES[payroll.state]?.order > RNR_STATES[state].order
                      return (
                        <React.Fragment key={state}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isCurrent
                                  ? 'bg-amber-500 text-white'
                                  : isPast
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isPast ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span
                              className={`text-sm ${
                                isCurrent ? 'font-semibold text-amber-700 dark:text-amber-300' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/60'
                              }`}
                            >
                              {RNR_STATES[state].label}
                            </span>
                          </div>
                          {idx < RNR_ORDERED_STATES.length - 1 && (
                            <div className="ml-3 h-3 w-px bg-border" />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </SectionCard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Loading state */}
      {selectedId && !payroll && payrollLoading && (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading payroll…
        </div>
      )}
    </div>
  )
}

// ─── Build Tab: Lines Section ─────────────────────────────────────────────────
function BuildLinesSection({
  payroll,
  onInvalidate,
  pafRecords,
}: {
  payroll: RnrPayroll
  onInvalidate: () => void
  pafRecords: PafRecord[]
}) {
  const qc = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    beneficiaryName: '',
    entitlementType: '',
    valuationAmount: '',
    pwdRateReference: '',
  })

  const isDrafting = payroll.state === 'Drafting'

  const addLineMutation = useMutation({
    mutationFn: () => {
      const ref = form.pwdRateReference.trim() || undefined
      return addRnrLine(payroll.id, {
        beneficiaryName: form.beneficiaryName,
        entitlementType: form.entitlementType,
        valuationAmount: Number(form.valuationAmount),
        pwdRateReference: ref,
      })
    },
    onSuccess: (line) => {
      toast.success(`Line added — ${line.beneficiaryName}`, {
        description: `${SOR_LABELS[line.entitlementType] ?? line.entitlementType}: ${formatINR(line.valuationAmount)}`,
      })
      setForm({ beneficiaryName: '', entitlementType: '', valuationAmount: '', pwdRateReference: '' })
      setAddDialogOpen(false)
      onInvalidate()
    },
    onError: (e: Error) => toast.error('Failed to add line', { description: e.message }),
  })

  const deleteLineMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const r = await fetch(`/api/rnr-payrolls/${payroll.id}/lines/${lineId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Failed to delete line')
      return r.json()
    },
    onSuccess: () => {
      toast.success('Line removed')
      onInvalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handlePafSelect = (pafId: string) => {
    const paf = pafRecords.find((r) => r.id === pafId)
    if (paf) {
      setForm((f) => ({ ...f, beneficiaryName: paf.beneficiaryName }))
    }
  }

  const handleEntitlementChange = (value: string) => {
    setForm((f) => ({ ...f, entitlementType: value }))
    // Pre-fill SOR rate
    const sor = SOR_RATES[value]
    if (sor) {
      setForm((f) => ({ ...f, valuationAmount: String(sor), pwdRateReference: value }))
    }
  }

  const columns: Column<RnrLine>[] = [
    {
      key: 'beneficiaryName',
      header: 'Beneficiary',
      sortable: true,
      render: (r) => <span className="font-medium">{r.beneficiaryName}</span>,
    },
    {
      key: 'entitlementType',
      header: 'Entitlement',
      sortable: true,
      render: (r) => (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs dark:bg-amber-950 dark:text-amber-300">
          {SOR_LABELS[r.entitlementType] ?? r.entitlementType}
        </Badge>
      ),
    },
    {
      key: 'valuationAmount',
      header: 'Valuation',
      align: 'right',
      sortable: true,
      render: (r) => <span className="font-semibold tabular-nums">{formatINR(r.valuationAmount)}</span>,
    },
    {
      key: 'pwdRateReference',
      header: 'SOR Ref',
      render: (r) =>
        r.pwdRateReference ? (
          <span className="font-mono text-xs text-muted-foreground">{r.pwdRateReference}</span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        ),
    },
    {
      key: '_actions',
      header: '',
      align: 'right',
      render: (r) =>
        isDrafting ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-rose-600"
            onClick={(e) => {
              e.stopPropagation()
              deleteLineMutation.mutate(r.id)
            }}
            disabled={deleteLineMutation.isPending}
          >
            {deleteLineMutation.variables === r.id && deleteLineMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="text-xs text-rose-500 hover:text-rose-700">Remove</span>
            )}
          </Button>
        ) : null,
    },
  ]

  const lineTotal = payroll.lines.reduce((s, l) => s + l.valuationAmount, 0)

  return (
    <>
      <SectionCard
        title="R&R Payroll Lines"
        icon={FileText}
        description={`${payroll.lines.length} line${payroll.lines.length !== 1 ? 's' : ''} · batch total ${formatINR(lineTotal)}`}
        action={
          isDrafting && (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          )
        }
      >
        <DataTable
          columns={columns}
          data={payroll.lines}
          getRowId={(r) => r.id}
          pageSize={10}
          emptyMessage="No lines added yet. Click 'Add Line' to begin."
        />
        {payroll.lines.length > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
              Batch Total
            </span>
            <span className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-300">
              {formatINR(lineTotal)}
            </span>
          </div>
        )}
      </SectionCard>

      {/* Add Line Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add R&R Entitlement Line</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* PAF lookup */}
            {pafRecords.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  PAF Lookup (optional — auto-fills beneficiary)
                </Label>
                <Select onValueChange={handlePafSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PAF record…" />
                  </SelectTrigger>
                  <SelectContent>
                    {pafRecords
                      .filter((p) => p.status === 'approved')
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.pafNumber} — {p.beneficiaryName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Beneficiary Name</Label>
              <Input
                value={form.beneficiaryName}
                onChange={(e) => setForm((f) => ({ ...f, beneficiaryName: e.target.value }))}
                placeholder="e.g. Ramesh Kumar Sahoo"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Entitlement Type</Label>
              <Select value={form.entitlementType} onValueChange={handleEntitlementChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entitlement category…" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITLEMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} — {formatINR(SOR_RATES[opt.value])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Valuation Amount (₹)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={form.valuationAmount}
                  onChange={(e) => setForm((f) => ({ ...f, valuationAmount: e.target.value }))}
                  placeholder="e.g. 350000"
                  className="pr-20"
                />
                {form.entitlementType && SOR_RATES[form.entitlementType] && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-amber-600">
                    SOR: {formatINR(SOR_RATES[form.entitlementType])}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">PWD Rate Reference (optional)</Label>
              <Input
                value={form.pwdRateReference}
                onChange={(e) => setForm((f) => ({ ...f, pwdRateReference: e.target.value }))}
                placeholder="e.g. homestead, shifting_allowance"
              />
            </div>

            {/* Deviation preview */}
            {form.valuationAmount && form.entitlementType && SOR_RATES[form.entitlementType] ? (
              <DeviationPreview
                actual={Number(form.valuationAmount)}
                expected={SOR_RATES[form.entitlementType]}
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={
                !form.beneficiaryName ||
                !form.entitlementType ||
                !form.valuationAmount ||
                addLineMutation.isPending
              }
              onClick={() => addLineMutation.mutate()}
            >
              {addLineMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Line
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Verify Tab: Lines Table with Deviation ───────────────────────────────────
function VerifyLinesTable({ payroll }: { payroll: RnrPayroll }) {
  const qc = useQueryClient()
  const [editedAmounts, setEditedAmounts] = React.useState<Record<string, string>>({})

  const getAmount = (line: RnrLine): string => {
    return editedAmounts[line.id] ?? String(line.valuationAmount)
  }

  const updateAmount = (lineId: string, value: string) => {
    setEditedAmounts((prev) => ({ ...prev, [lineId]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const amount = Number(editedAmounts[lineId])
      if (isNaN(amount)) throw new Error('Invalid amount')
      const r = await fetch(`/api/rnr-payrolls/${payroll.id}/lines/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valuationAmount: amount }),
      })
      if (!r.ok) throw new Error('Failed to update line')
      return r.json()
    },
    onSuccess: () => {
      toast.success('Line updated')
      qc.invalidateQueries({ queryKey: ['rnr-payroll', payroll.id] })
      qc.invalidateQueries({ queryKey: ['rnr-payrolls'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<RnrLine>[] = [
    {
      key: 'beneficiaryName',
      header: 'Beneficiary',
      sortable: true,
      render: (r) => <span className="font-medium">{r.beneficiaryName}</span>,
    },
    {
      key: 'entitlementType',
      header: 'Entitlement',
      render: (r) => (
        <Badge variant="outline" className="border-border text-xs">
          {SOR_LABELS[r.entitlementType] ?? r.entitlementType}
        </Badge>
      ),
    },
    {
      key: 'valuationAmount',
      header: 'Valuation (editable)',
      align: 'right',
      sortable: true,
      render: (r) => {
        const isLocked = payroll.state !== 'Drafting'
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={getAmount(r)}
              onChange={(e) => updateAmount(r.id, e.target.value)}
              disabled={isLocked}
              className="h-7 w-36 text-right text-sm tabular-nums"
            />
            {!isLocked && editedAmounts[r.id] && Number(editedAmounts[r.id]) !== r.valuationAmount && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50"
                onClick={(e) => {
                  e.stopPropagation()
                  saveMutation.mutate(r.id)
                }}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            )}
          </div>
        )
      },
    },
    {
      key: '_deviation',
      header: 'Status',
      align: 'center',
      render: (r) => {
        const sor = SOR_RATES[r.entitlementType]
        if (sor == null) {
          return (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              No SOR ref
            </Badge>
          )
        }
        const actual = Number(getAmount(r)) || r.valuationAmount
        const deviationPct = ((actual - sor) / sor) * 100
        const isDeviation = Math.abs(deviationPct) > 10

        if (!isDeviation) {
          return (
            <Badge className="border-emerald-300 bg-emerald-50 text-emerald-700 text-xs dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Match
            </Badge>
          )
        }

        return (
          <Badge className="border-amber-400 bg-amber-100 text-amber-800 text-xs dark:bg-amber-950 dark:text-amber-300">
            <AlertCircle className="h-3 w-3" />
            {deviationPct > 0 ? '+' : ''}
            {deviationPct.toFixed(1)}% deviation
          </Badge>
        )
      },
    },
    {
      key: '_sorRate',
      header: 'SOR Rate',
      align: 'right',
      render: (r) => {
        const sor = SOR_RATES[r.entitlementType]
        return sor ? (
          <span className="text-xs tabular-nums text-muted-foreground">{formatINR(sor)}</span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={payroll.lines}
      getRowId={(r) => r.id}
      pageSize={10}
      emptyMessage="No lines to verify."
    />
  )
}

// ─── Review Tab: Read-Only Lines Table ────────────────────────────────────────
function ReviewLinesTable({ lines }: { lines: RnrLine[] }) {
  const columns: Column<RnrLine>[] = [
    {
      key: 'beneficiaryName',
      header: 'Beneficiary',
      sortable: true,
      render: (r) => <span className="font-medium">{r.beneficiaryName}</span>,
    },
    {
      key: 'entitlementType',
      header: 'Entitlement',
      render: (r) => (
        <Badge variant="outline" className="border-border text-xs">
          {SOR_LABELS[r.entitlementType] ?? r.entitlementType}
        </Badge>
      ),
    },
    {
      key: 'valuationAmount',
      header: 'Valuation',
      align: 'right',
      sortable: true,
      render: (r) => <span className="font-semibold tabular-nums">{formatINR(r.valuationAmount)}</span>,
    },
    {
      key: 'pwdRateReference',
      header: 'SOR Ref',
      render: (r) =>
        r.pwdRateReference ? (
          <span className="font-mono text-xs text-muted-foreground">{r.pwdRateReference}</span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        ),
    },
    {
      key: 'formulaSnapshot',
      header: 'Formula Snapshot',
      render: (r) =>
        r.formulaSnapshot ? (
          <span className="max-w-[200px] truncate font-mono text-[11px] text-muted-foreground" title={r.formulaSnapshot}>
            {r.formulaSnapshot}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={lines}
      getRowId={(r) => r.id}
      pageSize={10}
      emptyMessage="No lines in this payroll."
    />
  )
}

// ─── Shared Sub-Components ────────────────────────────────────────────────────

function SummaryTile({
  label,
  value,
  mono,
  accent,
}: {
  label: string
  value: string
  mono?: boolean
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-base font-semibold tabular-nums ${
          mono ? 'font-mono text-sm' : ''
        } ${accent ? 'text-amber-700 dark:text-amber-400' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function DeviationPreview({ actual, expected }: { actual: number; expected: number }) {
  const deviationPct = ((actual - expected) / expected) * 100
  const isDeviation = Math.abs(deviationPct) > 10
  const diff = actual - expected

  return (
    <div
      className={`rounded-lg border p-3 ${
        isDeviation
          ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
          : 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
      }`}
    >
      <div className="flex items-center gap-2">
        {isDeviation ? (
          <AlertCircle className="h-4 w-4 text-amber-600" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
        <span className={`text-sm font-medium ${isDeviation ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
          {isDeviation ? 'Deviation detected' : 'Within SOR tolerance'}
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">SOR Rate</p>
          <p className="font-medium tabular-nums">{formatINR(expected)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Your Value</p>
          <p className="font-medium tabular-nums">{formatINR(actual)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Difference</p>
          <p className={`font-medium tabular-nums ${isDeviation ? 'text-amber-700' : 'text-emerald-700'}`}>
            {diff >= 0 ? '+' : ''}{formatINR(diff)} ({deviationPct > 0 ? '+' : ''}{deviationPct.toFixed(1)}%)
          </p>
        </div>
      </div>
    </div>
  )
}