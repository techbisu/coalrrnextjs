'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SectionCard, StateBadge, DataTable } from '@/components/coalrr'
import type { Column } from '@/components/coalrr'
import { timeAgo } from '@/components/coalrr/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCoalrr } from '@/components/coalrr/store'
import {
  Inbox, Clock, CheckCircle2, AlertTriangle, GitBranch, ShieldCheck, Mail, ArrowRight,
} from 'lucide-react'

interface DashboardData {
  reviewTasks: Array<{ id: string; reviewableType: string; reviewableId: string; role: string; status: string; decidedBy: string | null; decidedAt: string | null; comment: string | null; createdAt: string }>
  grievances: Array<{ id: string; grievanceCode: string; complainantName: string; description: string; slaDueAt: string; resolution: string | null; daysRemaining: number }>
  payrolls: Array<{ id: string; payrollCode: string; projectName: string; state: string; landownerCount: number; totalAward: string; createdAt: string }>
  notifications: Array<{ id: string; type: 'sla' | 'grievance' | 'approval' | 'info'; title: string; message: string; timestamp: string; read: boolean }>
}

async function fetchDashboard(): Promise<DashboardData> {
  const r = await fetch('/api/dashboard')
  if (!r.ok) throw new Error('Failed to load inbox')
  return r.json()
}

const ROLE_LABELS: Record<string, string> = {
  unit_office: 'Unit Office', area_office: 'Area Office',
  gm_planning: 'GM (Planning)', gm_finance: 'GM (Finance)', gm_safety: 'GM (Safety)',
  director: 'Director', cmd: 'CMD', board: 'Board',
}

export function WorkflowInboxView() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })
  const { selectPayroll, setView } = useCoalrr()

  const pendingReviews = data?.reviewTasks.filter((r) => r.status === 'pending') ?? []
  const completedReviews = data?.reviewTasks.filter((r) => r.status !== 'pending') ?? []
  const openGrievances = data?.grievances.filter((g) => !g.resolution) ?? []
  const slaNotifications = data?.notifications.filter((n) => n.type === 'sla') ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Workflow Inbox</h2>
        <p className="text-sm text-muted-foreground">Cross-module approvals · parallel vetting · SLA timers · spec §2.3</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending reviews" value={pendingReviews.length} icon={Clock} color="amber" />
        <StatCard label="Completed" value={completedReviews.length} icon={CheckCircle2} color="emerald" />
        <StatCard label="Open grievances" value={openGrievances.length} icon={AlertTriangle} color="rose" />
        <StatCard label="Active SLA timers" value={slaNotifications.length} icon={GitBranch} color="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pending reviews */}
        <SectionCard title="Pending Reviews" icon={Inbox} description="HQ parallel vetting fan-out — spec §2.3.2">
          {pendingReviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No pending reviews — inbox zero 🎉
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingReviews.map((r) => (
                <li key={r.id} className="rounded-md border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Clock className="h-2.5 w-2.5" /> {ROLE_LABELS[r.role] ?? r.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{r.reviewableType}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.reviewableType === 'CompensationPayroll' && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs text-amber-700"
                      onClick={() => { selectPayroll(r.reviewableId); setView('payroll-builder') }}
                    >
                      Open payroll <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Completed reviews */}
        <SectionCard title="Completed Reviews" icon={CheckCircle2} description="Recent decisions across all modules">
          {completedReviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No completed reviews yet.</p>
          ) : (
            <DataTable
              loading={isLoading}
              columns={[
                { key: 'role', header: 'Role', render: (r) => <Badge variant="outline" className="text-xs">{ROLE_LABELS[r.role] ?? r.role}</Badge> },
                { key: 'status', header: 'Decision', render: (r) => r.status === 'approved' ? (
                  <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-2.5 w-2.5" /> approved</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">rejected</Badge>
                ) },
                { key: 'decidedBy', header: 'By', render: (r) => <span className="text-xs">{r.decidedBy ?? '—'}</span> },
                { key: 'decidedAt', header: 'When', render: (r) => <span className="text-xs text-muted-foreground">{r.decidedAt ? timeAgo(r.decidedAt) : '—'}</span> },
              ] as Column<DashboardData['reviewTasks'][0]>[]}
              data={completedReviews}
              getRowId={(r) => r.id}
              pageSize={5}
              searchable={false}
            />
          )}
        </SectionCard>
      </div>

      {/* Grievances + SLA timers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Open Grievances (14-day SLA)" icon={AlertTriangle} description="Auto-escalates to AGM's superior if unresolved">
          {openGrievances.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No open grievances.</p>
          ) : (
            <ul className="space-y-2">
              {openGrievances.map((g) => (
                <li key={g.id} className="rounded-md border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-rose-700 dark:text-rose-300">{g.grievanceCode}</span>
                    <Badge variant="outline" className={g.daysRemaining < 3 ? 'border-rose-300 bg-rose-100 text-rose-700' : 'border-amber-300 bg-amber-100 text-amber-700'}>
                      <Clock className="mr-1 h-2.5 w-2.5" /> {g.daysRemaining}d left
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium">{g.complainantName}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{g.description}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Active Transparency Windows" icon={GitBranch} description="21-day statutory timer — spec §2.3.3">
          {slaNotifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No active transparency windows.</p>
          ) : (
            <ul className="space-y-2">
              {slaNotifications.map((n) => {
                const days = Math.ceil((new Date(n.timestamp).getTime() + 21 * 86400000 - Date.now()) / 86400000)
                return (
                  <li key={n.id} className="flex items-start gap-2 rounded-md border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900 dark:bg-violet-950/20">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{days}d left</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Active payrolls quick-jump */}
      <SectionCard title="Active Payroll Workflows" icon={ShieldCheck} description="All payrolls with their current state — click to open builder">
        <DataTable
          loading={isLoading}
          columns={[
            { key: 'payrollCode', header: 'Code', sortable: true, render: (r) => <span className="font-mono text-xs font-medium">{r.payrollCode}</span> },
            { key: 'projectName', header: 'Project', sortable: true },
            { key: 'state', header: 'State', render: (r) => <StateBadge state={r.state} /> },
            { key: 'landownerCount', header: 'Landowners', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{r.landownerCount}</span> },
            { key: 'createdAt', header: 'Created', render: (r) => <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span> },
          ] as Column<DashboardData['payrolls'][0]>[]}
          data={data?.payrolls ?? []}
          getRowId={(r) => r.id}
          onRowClick={(r) => { selectPayroll(r.id); setView('payroll-builder') }}
          pageSize={10}
        />
      </SectionCard>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'amber' | 'emerald' | 'rose' | 'violet'
}) {
  const colors = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  }
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${colors[color]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}
