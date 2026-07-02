'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, StateBadge, SmartChecklist, ApprovalPanel, StatusTimeline, DataTable } from '@/components/coalrr'
import type { Column, ChecklistItem, ChecklistItemStatus, AvailableTransition, ReviewTaskView } from '@/components/coalrr'
import { formatINR, formatNumber } from '@/components/coalrr/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  Users, TrendingUp, CheckCircle2, AlertCircle, Lock, ArrowLeft, Loader2,
  BarChart3, Shield, FileText, Clock, Award, Briefcase, Eye,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────
interface EmploymentApp {
  id: string; applicationCode: string; projectName: string; nomineeName: string
  state: string; formIxBalanceAcres: string; formXBalanceJobs: number
  livePooledAcreage: string; threshold: string; hasCrossedThreshold: boolean
  remainingToThreshold: string; applyButtonUnlocked: boolean; exceptionFlags: string | null
  contributionCount: number; createdAt: string; updatedAt?: string | null
  contributions: Array<{ shareAcres: string; claimantName: string; plotNumber: string }>
}

const EMPLOYMENT_STATES = [
  'Drafting', 'Submitted', 'MathVerification', 'CL4Checklist',
  'AwaitingHQ', 'Approved', 'TransparencyWindow', 'Completed', 'Rejected',
] as const

const STATE_META: Record<string, { color: string; label: string }> = {
  Drafting: { color: 'bg-slate-100 text-slate-700', label: 'Draft' },
  Submitted: { color: 'bg-amber-100 text-amber-700', label: 'Submitted' },
  MathVerification: { color: 'bg-sky-100 text-sky-700', label: 'Math Verification' },
  CL4Checklist: { color: 'bg-violet-100 text-violet-700', label: 'CL-4 Checklist' },
  AwaitingHQ: { color: 'bg-orange-100 text-orange-700', label: 'Awaiting HQ' },
  Approved: { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  TransparencyWindow: { color: 'bg-cyan-100 text-cyan-700', label: 'Transparency Window' },
  Completed: { color: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
  Rejected: { color: 'bg-rose-100 text-rose-700', label: 'Rejected' },
  Returned: { color: 'bg-amber-100 text-amber-700', label: 'Returned' },
}

const CL4_ITEMS: ChecklistItem[] = [
  { key: 'form_ix_x_clearance', label: 'Form-IX/X Balance Clearance', required: true, status: 'pending' },
  { key: 'identity_verification', label: 'Nominee Identity Verification', required: true, status: 'pending' },
  { key: 'education_certificate', label: 'Education Certificate Verified', required: true, status: 'pending' },
  { key: 'relationship_confirmation', label: 'Family Relationship Confirmation (Form-VI)', required: true, status: 'pending' },
  { key: 'no_duplicity', label: 'No Duplicity / Single Application Check', required: true, status: 'pending' },
  { key: 'quota_available', label: 'Employment Quota Available (Form-X)', required: true, status: 'pending' },
  { key: 'exception_counseling', label: 'Female Nominee Counseling (if applicable)', required: false, status: 'skipped' },
  { key: 'pwd_clearance', label: 'PWD Category Clearance (if applicable)', required: false, status: 'skipped' },
  { key: 'project_eligibility', label: 'Project Employment Quota Not Exhausted', required: true, status: 'pending' },
]

async function fetchEmployment(): Promise<EmploymentApp[]> {
  const r = await fetch('/api/employment')
  if (!r.ok) throw new Error('Failed to load employment applications')
  return r.json()
}

// ─── Main Component ────────────────────────────────────────────
export function EmploymentView() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState('All')

  const { data: apps, isLoading } = useQuery({ queryKey: ['employment'], queryFn: fetchEmployment })

  if (isLoading) return <div className="space-y-4"><div className="h-40 animate-pulse rounded-lg bg-muted" /><div className="h-60 animate-pulse rounded-lg bg-muted" /></div>

  const selected = selectedId ? apps?.find((a) => a.id === selectedId) : null
  const filtered = filter === 'All' ? (apps ?? []) : (apps ?? []).filter((a) => a.state === filter)

  // Count per status
  const statusCounts = EMPLOYMENT_STATES.reduce((acc, s) => { acc[s] = (apps ?? []).filter((a) => a.state === s).length; return acc }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Employment Verification</h2>
          <p className="text-sm text-muted-foreground">Module M10 · Form-IX/X quota · CL-4 checklist gating · HQ approval</p>
        </div>
        {selected && (
          <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Inbox</Button>
        )}
      </div>

      {!selected ? (
        /* ─── ERP-M10-01: Application Inbox ─── */
        <div className="space-y-4">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setFilter('All')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === 'All' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>All ({apps?.length ?? 0})</button>
            {EMPLOYMENT_STATES.map((s) => {
              const c = statusCounts[s] ?? 0
              if (c === 0) return null
              return (
                <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === s ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {STATE_META[s]?.label ?? s} ({c})
                </button>
              )
            })}
          </div>

          {/* Application Cards */}
          {filtered.length === 0 ? (
            <SectionCard title="No Applications Found" icon={Briefcase} description={filter !== 'All' ? `No applications with status "${STATE_META[filter]?.label ?? filter}"` : 'No employment applications submitted yet'}>
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Users className="mx-auto mb-3 h-8 w-8 opacity-30" />
                <p>Applications will appear here once nominees cross the 2.00-acre threshold.</p>
              </div>
            </SectionCard>
          ) : (
            <div className="space-y-3">
              {filtered.map((app) => {
                const meta = STATE_META[app.state] ?? { color: 'bg-slate-100 text-slate-700', label: app.state }
                const pooled = Number(app.livePooledAcreage) || 0
                const pct = Math.min(100, (pooled / 2) * 100)
                return (
                  <div key={app.id} className="rounded-lg border border-border/60 bg-card p-4 transition hover:border-amber-300/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{app.applicationCode}</span>
                          <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{app.projectName} · <span className="font-medium text-foreground">{app.nomineeName}</span></p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Progress value={pct} className="h-2 w-24" indicatorClassName={app.hasCrossedThreshold ? 'bg-emerald-500' : 'bg-amber-500'} />
                            <span className="font-mono text-xs tabular-nums">{formatNumber(app.livePooledAcreage, 4)} ac</span>
                          </div>
                          {app.hasCrossedThreshold ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-amber-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{app.contributionCount} shares</span>
                        <Button size="sm" onClick={() => setSelectedId(app.id)}><Eye className="mr-1.5 h-3.5 w-3.5" /> Open</Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── Detail Sub-views ─── */
        <EmploymentDetailView app={selected} onBack={() => setSelectedId(null)} />
      )}
    </div>
  )
}

// ─── Detail View (Balance Review / CL-4 / HQ Approval) ──────────
function EmploymentDetailView({ app, onBack }: { app: EmploymentApp; onBack: () => void }) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = React.useState('balance')

  // Determine which tab to show based on state
  React.useEffect(() => {
    if (['Drafting', 'Submitted', 'MathVerification'].includes(app.state)) setActiveTab('balance')
    else if (app.state === 'CL4Checklist') setActiveTab('cl4')
    else if (['AwaitingHQ', 'Approved', 'TransparencyWindow', 'Completed'].includes(app.state)) setActiveTab('hq')
  }, [app.state])

  const transitionMutation = useMutation({
    mutationFn: async ({ state, comment }: { state: string; comment?: string }) => {
      const r = await fetch(`/api/employment/${app.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, comment }) })
      if (!r.ok) throw new Error('Failed to transition')
      return r.json()
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employment'] }); toast.success('Application updated') },
    onError: (e) => toast.error(e.message),
  })

  const timelineNodes = [
    { label: 'Submitted', done: ['Submitted', 'MathVerification', 'CL4Checklist', 'AwaitingHQ', 'Approved', 'TransparencyWindow', 'Completed'].includes(app.state) },
    { label: 'Math Verification', done: ['MathVerification', 'CL4Checklist', 'AwaitingHQ', 'Approved', 'TransparencyWindow', 'Completed'].includes(app.state), active: app.state === 'MathVerification' },
    { label: 'CL-4 Checklist', done: ['CL4Checklist', 'AwaitingHQ', 'Approved', 'TransparencyWindow', 'Completed'].includes(app.state), active: app.state === 'CL4Checklist' },
    { label: 'HQ Approval', done: ['Approved', 'TransparencyWindow', 'Completed'].includes(app.state), active: app.state === 'AwaitingHQ' },
    { label: 'Transparency Window', done: ['TransparencyWindow', 'Completed'].includes(app.state), active: app.state === 'TransparencyWindow' },
    { label: 'Appointment Letter', done: app.state === 'Completed' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">{app.applicationCode}</span>
              <Badge variant="outline" className={STATE_META[app.state]?.color}>{STATE_META[app.state]?.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{app.projectName} · nominee: <span className="font-medium text-foreground">{app.nomineeName}</span></p>
          </div>
          <StatusTimeline nodes={timelineNodes} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="balance"><BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Balance Review</TabsTrigger>
          <TabsTrigger value="cl4" disabled={app.state === 'Drafting' || app.state === 'Submitted'}><Shield className="mr-1.5 h-3.5 w-3.5" /> CL-4 Checklist</TabsTrigger>
          <TabsTrigger value="hq" disabled={!['CL4Checklist', 'AwaitingHQ', 'Approved', 'TransparencyWindow', 'Completed'].includes(app.state)}><Award className="mr-1.5 h-3.5 w-3.5" /> HQ Approval</TabsTrigger>
        </TabsList>

        {/* ─── ERP-M10-02: Balance Review ─── */}
        <TabsContent value="balance" className="space-y-4 mt-4">
          {/* Info Tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SectionCard title="Pooled Acreage" icon={TrendingUp}>
              <p className="text-2xl font-bold tabular-nums">{formatNumber(app.livePooledAcreage, 4)} <span className="text-sm font-normal text-muted-foreground">ac</span></p>
              <p className="text-xs text-muted-foreground">Threshold: {app.threshold} ac</p>
            </SectionCard>
            <SectionCard title="Threshold Status" icon={app.hasCrossedThreshold ? CheckCircle2 : Lock}>
              <Badge className={app.hasCrossedThreshold ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                {app.hasCrossedThreshold ? 'Threshold Met' : 'Below Threshold'}
              </Badge>
              {!app.hasCrossedThreshold && <p className="mt-1 text-xs text-amber-700">{app.remainingToThreshold} ac remaining</p>}
            </SectionCard>
            <SectionCard title="Form-IX Balance" icon={FileText}>
              <p className="text-2xl font-bold tabular-nums">{formatNumber(app.formIxBalanceAcres, 4)} <span className="text-sm font-normal text-muted-foreground">ac</span></p>
              <p className="text-xs text-muted-foreground">Frozen snapshot</p>
            </SectionCard>
            <SectionCard title="Form-X Jobs" icon={Briefcase}>
              <p className="text-2xl font-bold tabular-nums">{app.formXBalanceJobs}</p>
              <p className="text-xs text-muted-foreground">Remaining quota</p>
            </SectionCard>
          </div>

          {/* Form-IX Depleting Bar */}
          <SectionCard title="Form-IX — Area Exhaustion" icon={BarChart3}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Total Project Area</span>
                <span className="font-mono tabular-nums">17.7000 ac</span>
              </div>
              <Progress value={Math.min(100, (Number(app.formIxBalanceAcres) / 17.7) * 100)} className="h-4" indicatorClassName="bg-emerald-500" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exhausted for jobs</span>
                <span className="font-mono font-semibold tabular-nums">{formatNumber(app.formIxBalanceAcres, 4)} ac</span>
              </div>
            </div>
          </SectionCard>

          {/* Form-X Depleting Bar */}
          <SectionCard title="Form-X — Employment Quota" icon={Briefcase}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Total Employment Quota</span>
                <span className="font-mono tabular-nums">115 jobs</span>
              </div>
              <Progress value={Math.min(100, ((115 - app.formXBalanceJobs) / 115) * 100)} className="h-4" indicatorClassName="bg-amber-500" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Already Exhausted</span>
                <span className="font-mono font-semibold tabular-nums">{115 - app.formXBalanceJobs} jobs</span>
              </div>
            </div>
          </SectionCard>

          {/* Snapshot Notice */}
          <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
              These figures are locked as of the verification date and will not change even if other project balances later change (spec §3.1.1).
            </AlertDescription>
          </Alert>

          {/* Contributions */}
          <SectionCard title="Pool Contributions" icon={Users}>
            <div className="space-y-2">
              {app.contributions.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-border/60 bg-card px-3 py-2">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{c.claimantName}</p><p className="font-mono text-[11px] text-muted-foreground">plot {c.plotNumber}</p></div>
                  <Badge variant="outline" className="tabular-nums">{formatNumber(c.shareAcres, 4)} ac</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Total</span>
                <span className="font-mono text-sm font-bold tabular-nums text-emerald-700">{formatNumber(app.livePooledAcreage, 4)} ac</span>
              </div>
            </div>
          </SectionCard>

          {/* Action */}
          {app.state === 'MathVerification' && (
            <div className="flex justify-end">
              <Button onClick={() => transitionMutation.mutate({ state: 'CL4Checklist' })} disabled={transitionMutation.isPending}>
                {transitionMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Shield className="mr-1.5 h-3.5 w-3.5" />}
                Proceed to CL-4 Checklist
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ─── ERP-M10-03: CL-4 Checklist ─── */}
        <TabsContent value="cl4" className="space-y-4 mt-4">
          <SectionCard title="CL-4 Gating Checklist" icon={Shield} description="All required items must be complete before forwarding to HQ">
            <SmartChecklist
              items={CL4_ITEMS.map((item) => ({
                ...item,
                status: item.key === 'form_ix_x_clearance' ? 'complete' as ChecklistItemStatus : item.status,
              }))}
              onItemUpdate={() => {}}
              readOnly={['AwaitingHQ', 'Approved', 'TransparencyWindow', 'Completed'].includes(app.state)}
            />
          </SectionCard>
          {app.state === 'CL4Checklist' && (
            <div className="flex justify-end">
              <Button onClick={() => transitionMutation.mutate({ state: 'AwaitingHQ' })} disabled={transitionMutation.isPending}>
                {transitionMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ArrowLeft className="mr-1.5 h-3.5 w-3.5 rotate-180" />}
                Forward to HQ
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ─── ERP-M10-04: HQ Approval ─── */}
        <TabsContent value="hq" className="space-y-4 mt-4">
          <SectionCard title="Full Application Detail (Form-XI Composite)" icon={FileText}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Application Code</p><p className="font-mono text-sm font-semibold">{app.applicationCode}</p></div>
              <div><p className="text-xs text-muted-foreground">Project</p><p className="text-sm font-medium">{app.projectName}</p></div>
              <div><p className="text-xs text-muted-foreground">Nominee</p><p className="text-sm font-medium">{app.nomineeName}</p></div>
              <div><p className="text-xs text-muted-foreground">Pooled Acreage</p><p className="font-mono text-sm">{formatNumber(app.livePooledAcreage, 4)} ac</p></div>
              <div><p className="text-xs text-muted-foreground">Form-IX Balance</p><p className="font-mono text-sm">{formatNumber(app.formIxBalanceAcres, 4)} ac</p></div>
              <div><p className="text-xs text-muted-foreground">Form-X Jobs</p><p className="font-mono text-sm">{app.formXBalanceJobs} remaining</p></div>
              <div><p className="text-xs text-muted-foreground">Contributions</p><p className="text-sm">{app.contributionCount} family shares</p></div>
              <div><p className="text-xs text-muted-foreground">State</p><Badge variant="outline" className={STATE_META[app.state]?.color}>{STATE_META[app.state]?.label}</Badge></div>
            </div>
          </SectionCard>

          {app.exceptionFlags && (
            <SectionCard title="Exception Flags" icon={AlertCircle}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(JSON.parse(app.exceptionFlags)).map(([k, v]) => (
                  <Badge key={k} variant="outline" className={v ? 'border-amber-300 bg-amber-100 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                    {k}: {v ? 'triggered' : 'n/a'}
                  </Badge>
                ))}
              </div>
            </SectionCard>
          )}

          {app.state === 'TransparencyWindow' && (
            <Alert className="border-cyan-200 bg-cyan-50/50 dark:border-cyan-900 dark:bg-cyan-950/20">
              <Clock className="h-4 w-4 text-cyan-600" />
              <AlertDescription className="text-xs text-cyan-800 dark:text-cyan-300">
                Transparency window is active. The 21-day public notice period allows any objections before the appointment letter is issued.
              </AlertDescription>
            </Alert>
          )}

          <SectionCard title="Approval Action" icon={Award}>
            <div className="space-y-3">
              {app.state === 'AwaitingHQ' && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => transitionMutation.mutate({ state: 'Approved' })} disabled={transitionMutation.isPending}>
                    {transitionMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                    Approve &amp; Start Transparency Window
                  </Button>
                  <Button variant="outline" onClick={() => transitionMutation.mutate({ state: 'Returned', comment: 'Returned for additional verification' })} disabled={transitionMutation.isPending}>
                    Return for Correction
                  </Button>
                </div>
              )}
              {app.state === 'Approved' && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Application approved. Transparency window started. Appointment letter will be issued after the 21-day period.</p>
                  </div>
                </div>
              )}
              {app.state === 'Completed' && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Process complete. Appointment letter issued.</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
export default EmploymentView
