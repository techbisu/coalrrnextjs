// COALRR shared client types + Zustand store for view navigation + auth
'use client'

import { create } from 'zustand'

export type ViewKey =
  | 'dashboard'
  | 'project-master'   // M1
  | 'acquisition'      // M2
  | 'form-i-wizard'    // M3
  | 'payroll-builder'  // M4
  | 'paf-census'       // M6
  | 'rnr-asset'        // M7
  | 'payment-ledger'   // M8
  | 'nomination'       // M9
  | 'employment'       // M10
  | 'employment-wizard'// M10 (public portal)
  | 'workflow-inbox'

export interface NavItem {
  key: ViewKey
  label: string
  module: string
  icon: string
  description: string
  portals: Array<'ecl' | 'public'>
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',       label: 'Dashboard',            module: 'Overview', icon: 'LayoutDashboard', description: 'Cross-module KPIs, SLA countdowns, and pending approvals', portals: ['ecl'] },
  { key: 'project-master',  label: 'Project Master & GIS', module: 'M1',       icon: 'Map',              description: 'Locked baseline, statutory clearances, GIS boundary', portals: ['ecl'] },
  { key: 'acquisition',     label: 'Land Acquisition',     module: 'M2',       icon: 'ClipboardList',   description: 'Plot acquisition proposals, CL-1 checklists, area/HQ vetting', portals: ['ecl'] },
  { key: 'form-i-wizard',   label: 'Form-I Claim Wizard',  module: 'M3',       icon: 'FileText',         description: 'Public portal multi-step claim submission (21-day timer)', portals: ['public', 'ecl'] },
  { key: 'payroll-builder', label: 'Compensation Payroll', module: 'M4',       icon: 'Calculator',       description: 'Live Math Engine preview, batch award calculation', portals: ['ecl'] },
  { key: 'paf-census',      label: 'PAF Census Register',  module: 'M6',       icon: 'Users',            description: 'Project Affected Families census, photo ID cards, satellite freeze', portals: ['ecl'] },
  { key: 'rnr-asset',       label: 'R&R Asset Proposal',   module: 'M7',       icon: 'Home',             description: 'Homestead, shifting, cattle shed, subsistence grant payrolls', portals: ['ecl'] },
  { key: 'payment-ledger',  label: 'Form-D Payment Ledger',module: 'M8',       icon: 'Lock',             description: 'Immutable hash-chained payment register', portals: ['ecl'] },
  { key: 'nomination',      label: 'Nominee Package Deal', module: 'M9',       icon: 'UserPlus',         description: 'Form-A nomination, nominee pooling toward 2.00-acre threshold', portals: ['public', 'ecl'] },
  { key: 'employment',      label: 'Employment Verification', module: 'M10',   icon: 'Users',            description: '2.00-acre nominee pooling gate, Form-IX/X quota, CL-4 checklist', portals: ['ecl'] },
  { key: 'employment-wizard', label: 'Employment Application', module: 'M10',  icon: 'Briefcase',        description: 'Form-V/VI bio-data wizard, document upload, status tracker', portals: ['public'] },
  { key: 'workflow-inbox',  label: 'Workflow Inbox',       module: 'Cross',    icon: 'Inbox',            description: 'Pending approvals across all modules', portals: ['ecl'] },
]

export interface AuthUser {
  id: string
  portal: 'ecl' | 'public'
  role: string
  email: string | null
  mobile: string | null
  name: string
  designation: string | null
  collieryCode: string | null
  plotId: string | null
  roleLabel?: string
}

export type NominationView = 'list' | 'form' | 'tracking'

interface CoalrrStore {
  view: ViewKey
  selectedPayrollId: string | null
  selectedScheduleId: string | null
  selectedProjectId: string | null
  selectedClaimForNomination: string | null
  selectedPoolId: string | null
  nominationView: NominationView
  actorRole: string
  user: AuthUser | null
  authChecked: boolean
  setView: (v: ViewKey) => void
  selectPayroll: (id: string | null) => void
  selectSchedule: (id: string | null) => void
  selectProject: (id: string | null) => void
  setSelectedClaimForNomination: (id: string | null) => void
  setSelectedPoolId: (id: string | null) => void
  setNominationView: (v: NominationView) => void
  setUser: (u: AuthUser | null) => void
  setAuthChecked: (b: boolean) => void
  setActorRole: (r: string) => void
  logout: () => Promise<void>
}

export const useCoalrr = create<CoalrrStore>((set) => ({
  view: 'dashboard',
  selectedPayrollId: null,
  selectedScheduleId: null,
  selectedProjectId: null,
  selectedClaimForNomination: null,
  selectedPoolId: null,
  nominationView: 'list',
  actorRole: 'area_office',
  user: null,
  authChecked: false,
  setView: (view) => set({ view }),
  selectPayroll: (selectedPayrollId) => set({ selectedPayrollId }),
  selectSchedule: (selectedScheduleId) => set({ selectedScheduleId }),
  selectProject: (selectedProjectId) => set({ selectedProjectId }),
  setSelectedClaimForNomination: (selectedClaimForNomination) => set({ selectedClaimForNomination }),
  setSelectedPoolId: (selectedPoolId) => set({ selectedPoolId }),
  setNominationView: (nominationView) => set({ nominationView }),
  setUser: (user) => set({ user }),
  setAuthChecked: (authChecked) => set({ authChecked }),
  setActorRole: (actorRole) => set({ actorRole }),
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null, view: 'dashboard' })
  },
}))

// ─── Helpers ─────────────────────────────────────────────────────
export function formatINR(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (isNaN(n)) return value as string
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

export function formatNumber(value: string | number, decimals = 2): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (isNaN(n)) return value as string
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: decimals }).format(n)
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}