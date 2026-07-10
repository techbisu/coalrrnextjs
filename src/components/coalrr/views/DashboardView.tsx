'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { routes } from '@/lib/url/UrlService'
import { SectionCard, StatTile, DataTable, StateBadge, NotificationBell } from '@/components/coalrr'
import type { Column } from '@/components/coalrr'
import { formatINR, formatNumber, timeAgo,  } from '@/lib/utils/formatters'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { useUiState } from '@/providers/UiStateProvider'
import {
  Building2, MapPin, FileText, Calculator, Lock, Users, AlertTriangle,
  Clock, IndianRupee, Layers, CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface DashboardData {
  stats: {
    projectCount: number; plotCount: number; claimCount: number; payrollCount: number
    ledgerEntryCount: number; nomineePoolCount: number; employmentAppCount: number
    openGrievanceCount: number; pendingReviewCount: number
    totalBudget: string; totalSpent: string; budgetUtilization: string
    totalAcreage: string; totalAwardPending: string
  }
  projects: Array<{ id: string; name: string; colliery_code: string; total_land_limit_acres: string; total_budget_ceiling: string; total_employment_quota: number; locked_at: string | null; scheduleCount: number; payrollCount: number }>
  plots: Array<{ id: string; plot_number: string; mouza: string; land_type: string; area_acres: string; exhausted_area_for_jobs: string; remaining_job_quota: number }>
  payrolls: Array<{ id: string; payroll_code: string; projectName: string; state: string; landowner_count: number; total_award: string; lineCount: number; entry_ts: string }>
  ledger_entries: Array<{ id: string; payee_name: string; amount_land: string; amount_rnr: string; rtgs_utr_reference: string | null; row_hash: string | null; paid_at: string }>
  nomineePools: Array<{ id: string; nominee_name: string; pooled_acreage: string; apply_button_unlocked: boolean; contributionCount: number }>
  employmentApps: Array<{ id: string; application_code: string; form_ix_balance_acres: string; form_x_balance_jobs: number; state: string }>
  grievances: Array<{ id: string; grievance_code: string; complainant_name: string; description: string; sla_due_at: string; resolution: string | null; daysRemaining: number }>
  reviewTasks: Array<{ id: string; reviewable_type: string; role: string; status: string; decided_by: string | null; entry_ts: string }>
  notifications: Array<{ id: string; type: 'sla' | 'grievance' | 'approval' | 'info'; title: string; message: string; timestamp: string; read: boolean }>
  stateDistribution: Record<string, number>
  landTypeDistribution: Record<string, number>
}

async function fetchDashboard(): Promise<DashboardData> {
  const r = await fetch('/api/dashboard')
  if (!r.ok) throw new Error('Failed to load dashboard')
  return r.json()
}

const LAND_TYPE_LABEL: Record<string, string> = {
  forest: 'Forest', got_patta: 'Govt/Patta', tenancy: 'Tenancy', debottar: 'Debottar',
}
const LAND_TYPE_COLOR: Record<string, string> = {
  forest: 'bg-rose-500', got_patta: 'bg-sky-500', tenancy: 'bg-emerald-500', debottar: 'bg-amber-500',
}

export function DashboardView() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })
  const { setView, selectPayroll } = useUiState()

  if (error) return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Failed to load dashboard: {String(error)}</div>

  return (
    <div className="space-y-6">
      {/* Header w/ notifications */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Platform Overview</h2>
          <p className="text-sm text-muted-foreground">Cross-module KPIs across all 10 COALRR modules</p>
        </div>
        <NotificationBell notifications={data?.notifications ?? []} onMarkAllRead={() => {}} />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatTile label="Projects" value={data?.stats.projectCount ?? 0} icon={Building2} accent="amber" sublabel="locked baselines" />
        <StatTile label="Plots" value={data?.stats.plotCount ?? 0} icon={MapPin} accent="emerald" sublabel={data ? `${formatNumber(data.stats.totalAcreage, 4)} acres` : '—'} />
        <StatTile label="Form-I Claims" value={data?.stats.claimCount ?? 0} icon={FileText} accent="violet" />
        <StatTile label="Payrolls" value={data?.stats.payrollCount ?? 0} icon={Calculator} accent="teal" sublabel={data ? formatINR(data.stats.totalAwardPending) : '—'} />
        <StatTile label="Ledger Entries" value={data?.stats.ledgerEntryCount ?? 0} icon={Lock} accent="slate" sublabel="immutable" />
        <StatTile label="Employment Apps" value={data?.stats.employmentAppCount ?? 0} icon={Users} accent="amber" />
      </div>

      {/* Budget + alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Budget Utilization" icon={IndianRupee} description="Project ceiling vs. disbursed (Form-D ledger)">
          {data && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{formatINR(data.stats.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">of {formatINR(data.stats.totalBudget)}</p>
                </div>
                <Badge className={Number(data.stats.budgetUtilization) < 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {data.stats.budgetUtilization}%
                </Badge>
              </div>
              <Progress value={Number(data.stats.budgetUtilization)} className="h-2" indicatorClassName={Number(data.stats.budgetUtilization) < 50 ? 'bg-emerald-500' : 'bg-amber-500'} />
              <p className="text-xs text-muted-foreground">Remaining: <span className="font-medium text-foreground">{formatINR(String(Number(data.stats.totalBudget) - Number(data.stats.totalSpent)))}</span></p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Open Alerts" icon={AlertTriangle} description="SLA timers + grievances + pending reviews">
          {data && (
            <div className="space-y-2">
              <AlertRow icon={AlertTriangle} color="rose" label="Open grievances" value={data.stats.openGrievanceCount} onClick={() => { setView('workflow-inbox'); window.history.pushState(null, '', routes.workflow.list()); }} />
              <AlertRow icon={Clock} color="amber" label="SLA transparency windows" value={data.notifications.filter((n) => n.type === 'sla').length} onClick={() => { setView('form-i-wizard'); window.history.pushState(null, '', routes.claim.list()); }} />
              <AlertRow icon={CheckCircle2} color="violet" label="Pending reviews" value={data.stats.pendingReviewCount} onClick={() => { setView('workflow-inbox'); window.history.pushState(null, '', routes.workflow.list()); }} />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Land Type Distribution" icon={Layers} description="Across all registered plots">
          {data && (
            <div className="space-y-2">
              {Object.entries(data.landTypeDistribution).map(([type, count]) => {
                const total = data.plots.length || 1
                const pct = (count / total) * 100
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-sm ${LAND_TYPE_COLOR[type] ?? 'bg-slate-400'}`} />
                        {LAND_TYPE_LABEL[type] ?? type}
                      </span>
                      <span className="font-medium tabular-nums">{count} plots</span>
                    </div>
                    <Progress value={pct} className="h-1" indicatorClassName={LAND_TYPE_COLOR[type] ?? 'bg-slate-400'} />
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Active payrolls */}
      <SectionCard
        title="Active Payrolls"
        icon={Calculator}
        description="Compensation payroll batches across all states"
        action={<button onClick={() => { setView('payroll-builder'); window.history.pushState(null, '', routes.payroll.list()); }} className="text-xs font-medium text-amber-700 hover:underline">Open builder →</button>}
      >
        <DataTable
          loading={isLoading}
          columns={[
            { key: 'payroll_code', header: 'Code', sortable: true, render: (r) => <span className="font-mono text-xs font-medium">{r.payroll_code}</span> },
            { key: 'projectName', header: 'Project', sortable: true },
            { key: 'state', header: 'State', render: (r) => <StateBadge state={r.state} /> },
            { key: 'landowner_count', header: 'Landowners', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{r.landowner_count}</span> },
            { key: 'total_award', header: 'Total Award', align: 'right', sortable: true, render: (r) => <span className="font-medium tabular-nums">{formatINR(r.total_award)}</span> },
            { key: 'entry_ts', header: 'Created', render: (r) => <span className="text-xs text-muted-foreground">{timeAgo(r.entry_ts)}</span> },
          ] as Column<DashboardData['payrolls'][0]>[]}
          data={data?.payrolls ?? []}
          getRowId={(r) => r.id}
          onRowClick={(r) => { selectPayroll(r.id); setView('payroll-builder'); window.history.pushState(null, '', routes.payroll.details(r.payroll_code)); }}
          pageSize={5}
        />
      </SectionCard>

      {/* Grievances + recent ledger */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Open Grievances" icon={AlertTriangle} description="21-day transparency window objections">
          {data && data.grievances.filter((g) => !g.resolution).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No open grievances 🎉</p>
          ) : (
            <ul className="space-y-2">
              {data?.grievances.filter((g) => !g.resolution).map((g) => (
                <li key={g.id} className="rounded-md border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-rose-700 dark:text-rose-300">{g.grievance_code}</span>
                    <Badge variant="outline" className={g.daysRemaining < 3 ? 'border-rose-300 bg-rose-100 text-rose-700' : 'border-amber-300 bg-amber-100 text-amber-700'}>
                      <Clock className="mr-1 h-2.5 w-2.5" /> {g.daysRemaining}d left
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs font-medium">{g.complainant_name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{g.description}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent Ledger Entries" icon={Lock} description="Hash-chained Form-D payments (immutable)">
          <ul className="space-y-2">
            {data?.ledger_entries.slice(0, 4).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.payee_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {e.row_hash ? `🔒 ${e.row_hash.slice(0, 16)}…` : 'pending'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatINR(String(Number(e.amount_land) + Number(e.amount_rnr)))}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(e.paid_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  )
}

function AlertRow({ icon: Icon, color, label, value, onClick }: {
  icon: React.ComponentType<{ className?: string }>
  color: 'rose' | 'amber' | 'violet'
  label: string
  value: number
  onClick?: () => void
}) {
  const colors = {
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  }
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2 text-left transition hover:border-amber-300 hover:bg-amber-50/40"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </button>
  )
}

export default DashboardView

