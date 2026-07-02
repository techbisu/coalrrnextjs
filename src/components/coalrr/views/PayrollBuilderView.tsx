'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, MathPreviewPanel, DataTable, ApprovalPanel, StatusTimeline, StateBadge, SmartChecklist } from '@/components/coalrr'
import type { Column, MathPreviewResultLike, AvailableTransition, ReviewTaskView, TimelineNode, ChecklistItem } from '@/components/coalrr'
import { formatINR, formatNumber, useCoalrr } from '@/components/coalrr/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Calculator, Plus, Trash2, Loader2, FileText, ShieldCheck, Clock, AlertCircle, History, Lock,
} from 'lucide-react'
import { COMPENSATION_PAYROLL_STATES, COMPENSATION_PAYROLL_ORDERED_STATES } from '@/lib/engines'

interface PayrollLine {
  id: string; landownerName: string; plotReference: string
  landValue: string; assetValue: string; solatiumAmount: string; escalationAmount: string
  totalAward: string; yearsSinceNotification: number; formulaSnapshot: string; createdAt: string
}
interface PayrollDetail {
  id: string; payrollCode: string; projectName: string; projectBudgetCeiling: string
  multiplicationFactor: string; state: string; landownerCount: number; totalAward: string
  lines: PayrollLine[]
  reviewTasks: Array<{ id: string; role: string; status: string; decidedBy: string | null; decidedAt: string | null; comment: string | null; createdAt: string }>
  createdAt: string
}

async function fetchPayroll(id: string): Promise<PayrollDetail> {
  const r = await fetch(`/api/payrolls/${id}`)
  if (!r.ok) throw new Error('Failed to load payroll')
  return r.json()
}

async function fetchPayrolls(): Promise<Array<{ id: string; payrollCode: string; state: string; totalAward: string; landownerCount: number }>> {
  const r = await fetch('/api/payrolls')
  if (!r.ok) throw new Error('Failed to load payrolls')
  return r.json()
}

export function PayrollBuilderView() {
  const qc = useQueryClient()
  const { selectedPayrollId, selectPayroll, actorRole, setActorRole } = useCoalrr()
  const { data: payrollList } = useQuery({ queryKey: ['payrolls'], queryFn: fetchPayrolls })

  // Auto-select first payroll if none selected
  React.useEffect(() => {
    if (!selectedPayrollId && payrollList && payrollList.length > 0) {
      selectPayroll(payrollList[0].id)
    }
  }, [selectedPayrollId, payrollList, selectPayroll])

  const { data: payroll, isLoading } = useQuery({
    queryKey: ['payroll', selectedPayrollId],
    queryFn: () => fetchPayroll(selectedPayrollId!),
    enabled: !!selectedPayrollId,
  })

  if (!selectedPayrollId || !payroll) {
    return (
      <div className="space-y-4">
        <Header />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {payrollList?.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPayroll(p.id)}
              className="rounded-lg border border-border/60 bg-card p-4 text-left transition hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium">{p.payrollCode}</span>
                <StateBadge state={p.state} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{p.landownerCount} landowners</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatINR(p.totalAward)}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header payroll={payroll} />

      {/* Payroll selector pills */}
      {payrollList && payrollList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {payrollList.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPayroll(p.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${p.id === selectedPayrollId ? 'border-amber-400 bg-amber-100 text-amber-800' : 'border-border bg-card hover:border-amber-300'}`}
            >
              <span className="font-mono">{p.payrollCode}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Line builder + table */}
        <div className="space-y-4 lg:col-span-2">
          <LineBuilder payroll={payroll} />
          <LinesTable payroll={payroll} />
        </div>

        {/* Right: Math preview + approval + timeline */}
        <div className="space-y-4">
          <LiveMathPreview payroll={payroll} />
          <ApprovalPanelView payroll={payroll} actorRole={actorRole} onRoleChange={setActorRole} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TimelineView payroll={payroll} />
        <ChecklistView payroll={payroll} />
      </div>
    </div>
  )
}

function Header({ payroll }: { payroll?: PayrollDetail }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Compensation Payroll Builder</h2>
        <p className="text-sm text-muted-foreground">Module M4 · Form 1A/1B · live Math Engine preview · spec §1.2.1 Journey A</p>
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
  )
}

function LineBuilder({ payroll }: { payroll: PayrollDetail }) {
  const qc = useQueryClient()
  const [form, setForm] = React.useState({ landownerName: '', plotReference: '', landValue: '', assetValue: '', yearsSinceNotification: 2 })
  const isDrafting = payroll.state === 'Drafting'

  const addLine = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/payrolls/${payroll.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_line', ...form }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to add line')
      return data
    },
    onSuccess: (data) => {
      toast.success(`Line added — total award ${formatINR(data.line.totalAward)}`)
      setForm({ landownerName: '', plotReference: '', landValue: '', assetValue: '', yearsSinceNotification: 2 })
      qc.invalidateQueries({ queryKey: ['payroll', payroll.id] })
      qc.invalidateQueries({ queryKey: ['payrolls'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <SectionCard
      title="Add Compensation Line"
      icon={Plus}
      description={isDrafting ? 'Math Engine computes Solatium (100%) + Escalation (12% p.a. land-only) server-side' : 'Payroll locked — cannot add lines in current state'}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Landowner Name">
          <Input value={form.landownerName} onChange={(e) => setForm({ ...form, landownerName: e.target.value })} placeholder="e.g. Ramesh Kumar Sahoo" disabled={!isDrafting} />
        </Field>
        <Field label="Plot Reference">
          <Input value={form.plotReference} onChange={(e) => setForm({ ...form, plotReference: e.target.value })} placeholder="e.g. P-101" disabled={!isDrafting} />
        </Field>
        <Field label="Years Since Notification">
          <Input type="number" min={0} max={10} value={form.yearsSinceNotification} onChange={(e) => setForm({ ...form, yearsSinceNotification: Number(e.target.value) })} disabled={!isDrafting} />
        </Field>
        <Field label="Land Value (₹)">
          <Input type="number" value={form.landValue} onChange={(e) => setForm({ ...form, landValue: e.target.value })} placeholder="e.g. 3125000" disabled={!isDrafting} />
        </Field>
        <Field label="Asset Value (₹)">
          <Input type="number" value={form.assetValue} onChange={(e) => setForm({ ...form, assetValue: e.target.value })} placeholder="e.g. 450000" disabled={!isDrafting} />
        </Field>
        <div className="flex items-end">
          <Button onClick={() => addLine.mutate()} disabled={!isDrafting || !form.landownerName || !form.landValue || !form.assetValue || addLine.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {addLine.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Line
          </Button>
        </div>
      </div>
      {!isDrafting && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
          <AlertCircle className="h-3 w-3" /> Payroll is in <strong>{payroll.state}</strong> state — submit a workflow transition to roll back to Drafting (not permitted) or create a new payroll.
        </p>
      )}
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

function LinesTable({ payroll }: { payroll: PayrollDetail }) {
  const qc = useQueryClient()
  const deleteLine = useMutation({
    mutationFn: async (lineId: string) => {
      const r = await fetch(`/api/payrolls/${payroll.id}/lines/${lineId}`, { method: 'DELETE' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      toast.success('Line removed')
      qc.invalidateQueries({ queryKey: ['payroll', payroll.id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <SectionCard
      title="Compensation Lines"
      icon={FileText}
      description={`${payroll.landownerCount} landowners · batch total ${formatINR(payroll.totalAward)}`}
      action={<Badge variant="outline" className="font-mono text-xs">factor ×{formatNumber(payroll.multiplicationFactor, 4)}</Badge>}
    >
      <DataTable
        columns={[
          { key: 'landownerName', header: 'Landowner', sortable: true, render: (r) => <span className="font-medium">{r.landownerName}</span> },
          { key: 'plotReference', header: 'Plot', render: (r) => <span className="font-mono text-xs">{r.plotReference}</span> },
          { key: 'yearsSinceNotification', header: 'Yrs', align: 'right', sortable: true, render: (r) => <span className="tabular-nums text-muted-foreground">{r.yearsSinceNotification}</span> },
          { key: 'landValue', header: 'Land', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{formatINR(r.landValue)}</span> },
          { key: 'assetValue', header: 'Asset', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{formatINR(r.assetValue)}</span> },
          { key: 'solatiumAmount', header: 'Solatium', align: 'right', render: (r) => <span className="tabular-nums text-violet-600">{formatINR(r.solatiumAmount)}</span> },
          { key: 'escalationAmount', header: 'Escalation', align: 'right', render: (r) => <span className="tabular-nums text-amber-600">{formatINR(r.escalationAmount)}</span> },
          { key: 'totalAward', header: 'Total', align: 'right', sortable: true, render: (r) => <span className="font-semibold tabular-nums text-emerald-700">{formatINR(r.totalAward)}</span> },
          { key: '_actions', header: '', align: 'right', render: (r) => (
            payroll.state === 'Drafting' ? (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-rose-600" onClick={() => deleteLine.mutate(r.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : <Lock className="h-3 w-3 text-muted-foreground/40" />
          ) },
        ] as Column<PayrollLine>[]}
        data={payroll.lines}
        getRowId={(r) => r.id}
        pageSize={5}
      />
      {payroll.lines.length > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Batch Total (authoritative — persisted in DB)</span>
          <span className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{formatINR(payroll.totalAward)}</span>
        </div>
      )}
    </SectionCard>
  )
}

function LiveMathPreview({ payroll }: { payroll: PayrollDetail }) {
  // Local input state for the live preview (debounced)
  const [preview, setPreview] = React.useState<MathPreviewResultLike | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>()
  const [input, setInput] = React.useState({ landValue: '', assetValue: '', years: 2 })

  // Debounced fetch
  React.useEffect(() => {
    if (!input.landValue && !input.assetValue) { setPreview(null); setError(undefined); return }
    setLoading(true)
    setError(undefined)
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/math/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landValue: input.landValue || '0', assetValue: input.assetValue || '0', yearsSinceNotification: input.years, multiplicationFactor: payroll.multiplicationFactor }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? 'Calculation failed')
        setPreview(data)
      } catch (e) {
        setPreview(null)
        setError(e instanceof Error ? e.message : 'Failed')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [input, payroll.multiplicationFactor])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Land (₹)">
          <Input type="number" value={input.landValue} onChange={(e) => setInput({ ...input, landValue: e.target.value })} placeholder="1000000" className="h-8" />
        </Field>
        <Field label="Asset (₹)">
          <Input type="number" value={input.assetValue} onChange={(e) => setInput({ ...input, assetValue: e.target.value })} placeholder="50000" className="h-8" />
        </Field>
      </div>
      <MathPreviewPanel result={preview} loading={loading} error={error} formula={preview?.formula} />
    </div>
  )
}

function ApprovalPanelView({ payroll, actorRole, onRoleChange }: { payroll: PayrollDetail; actorRole: string; onRoleChange: (r: string) => void }) {
  const qc = useQueryClient()

  // Build available transitions from the workflow state metadata
  const stateMeta = COMPENSATION_PAYROLL_STATES[payroll.state as keyof typeof COMPENSATION_PAYROLL_STATES]
  const transitions: AvailableTransition[] = (stateMeta?.allowedTransitions ?? []).map((t) => ({
    name: t.name,
    label: t.label,
    role: t.role,
    guardFailed: null,
  }))

  const reviewTasks: ReviewTaskView[] = payroll.reviewTasks.map((r) => ({
    role: r.role,
    status: r.status as 'pending' | 'approved' | 'rejected',
    decidedBy: r.decidedBy ?? undefined,
    decidedAt: r.decidedAt ?? undefined,
    comment: r.comment ?? undefined,
  }))

  const transition = useMutation({
    mutationFn: async (transitionName: string) => {
      const r = await fetch(`/api/workflow/CompensationPayroll/${payroll.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition: transitionName, actorRole }),
      })
      const data = await r.json()
      if (!r.ok || !data.ok) throw new Error(data.reason ?? data.error ?? 'Transition failed')
      return data
    },
    onSuccess: (data) => {
      toast.success(`Transitioned to ${data.newStatusLabel}`, { description: data.spawnedTasks?.length ? `Spawned ${data.spawnedTasks.length} review task(s)` : undefined })
      qc.invalidateQueries({ queryKey: ['payroll', payroll.id] })
      qc.invalidateQueries({ queryKey: ['payrolls'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e: Error) => toast.error('Transition blocked', { description: e.message }),
  })

  return (
    <div className="space-y-3">
      <SectionCard title="Actor Role" icon={ShieldCheck} description="Simulate acting as different approvers">
        <select
          value={actorRole}
          onChange={(e) => onRoleChange(e.target.value)}
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
        currentState={payroll.state}
        reviewTasks={reviewTasks}
        availableTransitions={transitions}
        actorRole={actorRole}
        onAction={(name) => transition.mutate(name)}
      />
    </div>
  )
}

function TimelineView({ payroll }: { payroll: PayrollDetail }) {
  const nodes: TimelineNode[] = COMPENSATION_PAYROLL_ORDERED_STATES.map((state) => {
    const meta = COMPENSATION_PAYROLL_STATES[state]
    const currentState = payroll.state as keyof typeof COMPENSATION_PAYROLL_STATES
    const isBranch = state === 'BoardEscalation'
    let status: TimelineNode['status'] = 'pending'
    if (meta.order < COMPENSATION_PAYROLL_STATES[currentState].order) status = 'done'
    else if (state === currentState) status = 'current'
    else if (isBranch && currentState === 'BoardEscalation') status = 'current'

    // Find a review task that matches this state for actor/timestamp
    const taskForState = payroll.reviewTasks.find((rt) => rt.status === 'approved' && rt.decidedAt)
    return {
      state,
      label: meta.label,
      status,
      timestamp: status === 'done' && taskForState?.decidedAt ? new Date(taskForState.decidedAt).toLocaleDateString('en-IN') : undefined,
      actor: status === 'done' && taskForState?.decidedBy ? taskForState.decidedBy : undefined,
      note: status === 'current' ? meta.description : undefined,
      isBranch,
    }
  })

  return (
    <SectionCard title="Workflow Timeline" icon={History} description="Finite state machine — spec §2.3.1">
      <StatusTimeline nodes={nodes} maxheight={400} />
    </SectionCard>
  )
}

function ChecklistView({ payroll }: { payroll: PayrollDetail }) {
  // Synthesize checklist items based on payroll state
  const items: ChecklistItem[] = [
    { key: 'cl-1.1', label: 'CL-1.1: Plot schedule verified against LIS', required: true, status: payroll.state === 'Drafting' ? 'pending' : 'complete', helpText: 'Cross-checked plot numbers, khata, area with master registry' },
    { key: 'cl-1.2', label: 'CL-1.2: Land valuation per PWD rate chart', required: true, status: payroll.lines.length > 0 ? 'complete' : 'pending', helpText: 'Within ±10% of PWD rate — substantiation gate' },
    { key: 'cl-1.3', label: 'CL-1.3: Asset valuation (homestead/trees/wells)', required: true, status: payroll.lines.length > 0 ? 'complete' : 'pending' },
    { key: 'cl-1.4', label: 'CL-1.4: Multiplication factor documented', required: false, status: 'complete', documentId: 'doc-mf-001' },
    { key: 'cl-3',   label: 'CL-3: Bank account & IFSC verified', required: true, status: payroll.state === 'Drafting' ? 'in_progress' : 'complete' },
    { key: 'cl-5',   label: 'CL-5: Solatium & escalation computed (Math Engine)', required: true, status: payroll.lines.length > 0 ? 'complete' : 'pending', helpText: 'formula_snapshot JSONB attached per line' },
  ]

  return (
    <SectionCard title="Compliance Checklist" icon={ShieldCheck} description="SmartChecklist — 'Forward' bound to completion (spec §1.1.1)">
      <SmartChecklist
        code="CL-1"
        items={items}
        hideForward={payroll.state !== 'Drafting'}
        forwardLabel="Submit to Unit"
      />
      <Separator className="my-3" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        Spec §1.3.3: hard statutory locks render as disabled UI, not post-submit errors.
      </div>
    </SectionCard>
  )
}
