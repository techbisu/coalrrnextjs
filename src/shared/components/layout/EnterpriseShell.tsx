'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, Map, FileText, Calculator, Lock, Users,
  Inbox, ClipboardList, Home, UserPlus, Briefcase, UserCheck, Menu, X, Mountain, ChevronRight, Building2, LogOut
} from 'lucide-react'
import { useAuth } from '@/core/authorization/providers/AuthProvider'
import { useUiState } from '@/providers/UiStateProvider'
import { UrlParser } from '@/lib/url/UrlService'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { cn } from '@/lib/utils'

// Components
import { AuthView } from '@/components/coalrr/views/AuthView'
import { DashboardView } from '@/components/coalrr/views/DashboardView'
import { ProjectMasterView } from '@/modules/project-master/components/ProjectMasterView'
import { FormIWizardView } from '@/components/coalrr/views/FormIWizardView'
import { PayrollBuilderView } from '@/components/coalrr/views/PayrollBuilderView'
import { PaymentLedgerView } from '@/components/coalrr/views/PaymentLedgerView'
import { NominationView } from '@/components/coalrr/views/NominationView'
import { EmploymentView } from '@/components/coalrr/views/EmploymentView'
import { EmploymentWizardView } from '@/components/coalrr/views/EmploymentWizardView'
import { PafCensusView } from '@/components/coalrr/views/PafCensusView'
import { RnrAssetView } from '@/components/coalrr/views/RnrAssetView'
import { WorkflowInboxView } from '@/components/coalrr/views/WorkflowInboxView'
import { AcquisitionView } from '@/modules/land-acquisition/components/AcquisitionView'
import { LanguageSwitcher } from '@/localization/components/LanguageSwitcher'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

const VIEW_MAP: Record<string, React.ComponentType> = {
  'dashboard': DashboardView,
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

const NAV_ITEMS = [
  { key: 'dashboard', icon: 'LayoutDashboard', portals: ['ecl', 'public'], module: 'Core' },
  { key: 'project-master', icon: 'Map', portals: ['ecl'], module: 'Module 1' },
  { key: 'paf-census', icon: 'Users', portals: ['ecl'], module: 'Module 1' },
  { key: 'rnr-asset', icon: 'Home', portals: ['ecl'], module: 'Module 1' },
  { key: 'acquisition', icon: 'FileText', portals: ['ecl'], module: 'Module 2' },
  { key: 'form-i-wizard', icon: 'ClipboardList', portals: ['ecl', 'public'], module: 'Module 3' },
  { key: 'nomination', icon: 'UserPlus', portals: ['ecl', 'public'], module: 'Module 3' },
  { key: 'payroll-builder', icon: 'Calculator', portals: ['ecl'], module: 'Module 4' },
  { key: 'payment-ledger', icon: 'Lock', portals: ['ecl'], module: 'Module 4' },
  { key: 'employment', icon: 'Briefcase', portals: ['ecl', 'public'], module: 'Module 5' },
  { key: 'workflow-inbox', icon: 'Inbox', portals: ['ecl'], module: 'Core' },
]

export const ROUTE_MAP: Record<string, string> = {
  'dashboard': '/',
  'acquisition': '/proposals',
  'payroll-builder': '/payrolls',
  'form-i-wizard': '/claims',
  'project-master': '/projects',
  'workflow-inbox': '/workflows'
}

export function EnterpriseShell({ children }: { children?: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const { view, setView } = useUiState()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const t = useAppTranslation('common')
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    // Only parse URL and setView if we are on the SPA catch-all and NO children are provided
    if (!children) {
      const parsed = UrlParser.parse(pathname)
      if (parsed.view && Object.keys(VIEW_MAP).includes(parsed.view)) {
        setView(parsed.view as any)
      }
    }
  }, [pathname, setView, children])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('shell.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthView />

  const visibleNav = NAV_ITEMS.filter((item) => item.portals.includes(user.portal))
  const currentNav = NAV_ITEMS.find((n) => n.key === view)
  if (!children && user.portal === 'public' && currentNav && !currentNav.portals.includes('public')) {
    setView('form-i-wizard')
  }

  const handleNavClick = (key: string) => {
    const newPath = ROUTE_MAP[key] || `/${key}`
    setSidebarOpen(false)
    router.push(newPath)
    if (!children) {
      setView(key as any)
    }
  }

  // If children are provided, we don't care about VIEW_MAP.
  // We determine 'active' state from the pathname.
  const getActiveState = (key: string) => {
    if (children) {
      const expectedPath = ROUTE_MAP[key] || `/${key}`
      return pathname.startsWith(expectedPath) || (expectedPath === '/' && pathname === '/')
    }
    return view === key
  }

  const ViewComponent = VIEW_MAP[view]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle sidebar">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
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
            <button key={item.key} onClick={() => handleNavClick(item.key)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition', getActiveState(item.key) ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              {t(`nav.${item.key}.label`)}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1 sm:flex">
            <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold', user.portal === 'ecl' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
              {(user.name || user.role || 'User').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="text-left">
              <p className="text-xs font-medium leading-tight">{user.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{user.roleLabel ?? user.role}{user.designation ? ` · ${user.designation}` : ''}</p>
            </div>
          </div>
          <LanguageSwitcher />
          <NotificationCenter userId={user.id} />
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
            fetch('/api/auth/logout', { method: 'POST' }).then(() => {
              window.location.href = '/'
            })
          }} aria-label="Sign out">
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
              const active = getActiveState(item.key)
              return (
                <button key={item.key} onClick={() => handleNavClick(item.key)} className={cn('group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition', active ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'text-foreground hover:bg-muted')}>
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{t(`nav.${item.key}.label`)}</span>
                      <Badge variant="outline" className="h-3.5 px-1 text-[9px] font-mono">{item.module}</Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{t(`nav.${item.key}.desc`)}</p>
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
            {children ? children : (ViewComponent ? <ViewComponent /> : <div className="py-20 text-center text-muted-foreground">Loading…</div>)}
          </div>
        </main>
      </div>
      <footer className="mt-auto border-t border-border/60 bg-card px-4 py-3 text-center text-[11px] text-muted-foreground">
        <p><span className="font-semibold text-foreground">COALRR</span> — Coal Land Acquisition, Rehabilitation &amp; Resettlement Platform · Next.js 16 + TypeScript + Prisma + decimal.js</p>
      </footer>
    </div>
  )
}
