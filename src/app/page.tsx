'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { NAV_ITEMS, useCoalrr } from '@/components/coalrr/store'
import { NotificationBell } from '@/components/coalrr'
import { AuthView } from '@/components/coalrr/views/AuthView'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard, Map, FileText, Calculator, Lock, Users, Inbox,
  Mountain, Menu, X, ChevronRight, ClipboardList, LogOut, Building2,
  Home, UserPlus, Briefcase, UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Helper: next/dynamic for named exports (views use named exports, not default)
function nd(loader: () => Promise<Record<string, unknown>>, name: string) {
  return dynamic(() => loader().then(m => ({ default: m[name] })), { ssr: false })
}

const DashboardView = nd(() => import('@/components/coalrr/views/DashboardView'), 'DashboardView')
const ProjectMasterView = nd(() => import('@/components/coalrr/views/ProjectMasterView'), 'ProjectMasterView')
const AcquisitionView = nd(() => import('@/components/coalrr/views/AcquisitionView'), 'AcquisitionView')
const FormIWizardView = nd(() => import('@/components/coalrr/views/FormIWizardView'), 'FormIWizardView')
const PayrollBuilderView = nd(() => import('@/components/coalrr/views/PayrollBuilderView'), 'PayrollBuilderView')
const PaymentLedgerView = nd(() => import('@/components/coalrr/views/PaymentLedgerView'), 'PaymentLedgerView')
const NominationView = nd(() => import('@/components/coalrr/views/NominationView'), 'NominationView')
const EmploymentView = nd(() => import('@/components/coalrr/views/EmploymentView'), 'EmploymentView')
const EmploymentWizardView = nd(() => import('@/components/coalrr/views/EmploymentWizardView'), 'EmploymentWizardView')
const PafCensusView = nd(() => import('@/components/coalrr/views/PafCensusView'), 'PafCensusView')
const RnrAssetView = nd(() => import('@/components/coalrr/views/RnrAssetView'), 'RnrAssetView')
const WorkflowInboxView = nd(() => import('@/components/coalrr/views/WorkflowInboxView'), 'WorkflowInboxView')

const VIEW_MAP: Record<string, React.ComponentType> = {
  'dashboard': DashboardView,
  'project-master': ProjectMasterView,
  'acquisition': AcquisitionView,
  'form-i-wizard': FormIWizardView,
  'payroll-builder': PayrollBuilderView,
  'payment-ledger': PaymentLedgerView,
  'nomination': NominationView,
  'employment': EmploymentView,
  'employment-wizard': EmploymentWizardView,
  'paf-census': PafCensusView,
  'rnr-asset': RnrAssetView,
  'workflow-inbox': WorkflowInboxView,
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Map, FileText, Calculator, Lock, Users, Inbox, ClipboardList,
  Home, UserPlus, Briefcase, UserCheck,
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
})

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <Shell />
    </QueryClientProvider>
  )
}

function Shell() {
  const { user, authChecked, setUser, setAuthChecked, view, setView } = useCoalrr()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me')
        const data = await r.json()
        if (data.user) {
          setUser(data.user)
          if (data.user.portal === 'public') setView('form-i-wizard')
        }
      } catch { /* ignore */ }
      finally { setAuthChecked(true) }
    })()
  }, [setUser, setAuthChecked, setView])

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading COALRR…</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthView />

  const visibleNav = NAV_ITEMS.filter((item) => item.portals.includes(user.portal))
  const currentNav = NAV_ITEMS.find((n) => n.key === view)
  if (user.portal === 'public' && currentNav && !currentNav.portals.includes('public')) {
    setView('form-i-wizard')
  }

  const ViewComponent = VIEW_MAP[view]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle sidebar">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm">
            <Mountain className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight">COALRR</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{user.portal === 'ecl' ? 'ECL Internal Portal' : 'Public Citizen Portal'}</p>
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <nav className="hidden items-center gap-1 md:flex">
          {visibleNav.slice(0, 5).map((item) => (
            <button key={item.key} onClick={() => setView(item.key)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition', view === item.key ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1 sm:flex">
            <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold', user.portal === 'ecl' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="text-left">
              <p className="text-xs font-medium leading-tight">{user.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{user.roleLabel ?? user.role}{user.designation ? ` · ${user.designation}` : ''}</p>
            </div>
          </div>
          <NotificationBell notifications={[]} onMarkAllRead={() => {}} />
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => useCoalrr.getState().logout()} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className={cn('fixed inset-y-14 left-0 z-20 w-64 transform border-r border-border/60 bg-card transition-transform lg:static lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
          <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{user.portal === 'ecl' ? 'ECL Modules' : 'Citizen Portal'}</p>
            {visibleNav.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard
              const active = view === item.key
              return (
                <button key={item.key} onClick={() => { setView(item.key); setSidebarOpen(false) }} className={cn('group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition', active ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'text-foreground hover:bg-muted')}>
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge variant="outline" className="h-3.5 px-1 text-[9px] font-mono">{item.module}</Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{item.description}</p>
                  </div>
                  {active && <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" />}
                </button>
              )
            })}
            <Separator className="my-2" />
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Architecture</p>
              <ul className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
                <li>• Math Engine (decimal.js)</li>
                <li>• Workflow Engine (FSM)</li>
                <li>• Docx Engine (registry)</li>
                <li>• Immutable Form-D Ledger</li>
              </ul>
            </div>
            {user.portal === 'ecl' && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300"><Building2 className="h-3 w-3" /> {user.collieryCode ?? 'ECL'}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Logged in as <span className="font-medium text-foreground">{user.roleLabel ?? user.role}</span></p>
              </div>
            )}
          </nav>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 z-10 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {ViewComponent ? <ViewComponent /> : <div className="py-20 text-center text-muted-foreground">Loading…</div>}
          </div>
        </main>
      </div>
      <footer className="mt-auto border-t border-border/60 bg-card px-4 py-3 text-center text-[11px] text-muted-foreground">
        <p><span className="font-semibold text-foreground">COALRR</span> — Coal Land Acquisition, Rehabilitation &amp; Resettlement Platform · Next.js 16 + TypeScript + Prisma + decimal.js</p>
      </footer>
    </div>
  )
}