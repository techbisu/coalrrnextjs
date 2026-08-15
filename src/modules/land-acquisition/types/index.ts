import { ACQ_MODE_ID } from '@/core/config/module-codes.config'

export const MODE_META: Record<number, { label: string; checklistCode: string; color: string }> = {
  [ACQ_MODE_ID.CBA]:             { label: 'CBA (A&D) Act, 1957',      checklistCode: 'CL-1.1', color: 'border-rose-300 bg-rose-50 text-rose-700' },
  [ACQ_MODE_ID.DIRECT_PURCHASE]: { label: 'Direct Purchase / Tenancy',    checklistCode: 'CL-1.2', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  [ACQ_MODE_ID.RFCTLARR]:        { label: 'RFCTLARR Act, 2013', checklistCode: 'CL-1.3', color: 'border-violet-300 bg-violet-50 text-violet-700' },
  [ACQ_MODE_ID.LEASE_TENANCY]:   { label: 'Draft Project Expansion',     checklistCode: 'CL-1.4', color: 'border-teal-300 bg-teal-50 text-teal-700' },
}

export const MODES: number[] = [ACQ_MODE_ID.DIRECT_PURCHASE, ACQ_MODE_ID.CBA, ACQ_MODE_ID.RFCTLARR, ACQ_MODE_ID.LEASE_TENANCY]
export const STANDARD_ACQ_MODES: number[] = [ACQ_MODE_ID.DIRECT_PURCHASE, ACQ_MODE_ID.CBA, ACQ_MODE_ID.RFCTLARR]

export const ANNEXURE_META: Record<'A' | 'B' | 'C', { label: string; color: string; desc: string }> = {
  A: { label: 'A', color: 'border-emerald-300 bg-emerald-50 text-emerald-700',     desc: 'Fully Clear (can acquire fully)' },
  B: { label: 'B', color: 'border-amber-300 bg-amber-50 text-amber-700',           desc: 'Fully Purchased (cannot acquire)' },
  C: { label: 'C', color: 'border-rose-300 bg-rose-50 text-rose-700',              desc: 'Partially Purchased (available area only)' },
}

export const LAND_TYPE_COLOR: Record<string, string> = {
  Forest:    'border-rose-300 bg-rose-50 text-rose-700',
  Govt:      'border-teal-300 bg-teal-50 text-teal-700',
  Patta:     'border-teal-300 bg-teal-50 text-teal-700',
  Tenancy:   'border-emerald-300 bg-emerald-50 text-emerald-700',
  Debottar:  'border-amber-300 bg-amber-50 text-amber-700',
}

export interface ScheduleListItem {
  id: string
  schedule_code: string
  project_id: string
  projectName: string
  ecl_proj_cd: string | null
  acq_mode_id: number
  state: string
  proposal_title: string
  description: string
  total_area_acres: string
  notification_date: string | null
  itemSummary: { total: number; annexure_a: number; annexure_b: number; annexure_c: number }
  entry_ts: string
  proposed_by: string
  proposed_by_role: string
  area_office: string
  mine_cd: string
  adjacent_colliery: string
}

export interface LandTypeBreakdownItem {
  primary_name: string
  primary_area: number
  use_purpose?: string
  sub_types: Array<{
    sub_name: string
    area_to_acquire: number
  }>
}

export interface ScheduleItem {
  id: string
  plot_id: string
  plot_number: string
  opt_plot_number?: string
  mouza: string
  jl_no?: string
  total_ror_area: number
  to_be_acquired_area: number
  land_type: string
  land_types_breakdown?: LandTypeBreakdownItem[]
  area_acres: string
  annexure_tag: 'A' | 'B' | 'C'
  is_active: boolean
}

export interface ModeChecklistPayload {
  checklistCode: string
  items: Array<{ key: string; label: string; required: boolean; status: string }>
}

export interface ScheduleDetail {
  id: string
  schedule_code: string
  project_state_lgd: string
  projectMouzas: string[]
  project_id: string
  projectName: string
  projectBudgetCeiling: string
  projectLandLimit: string
  projectEmploymentQuota: string
  acq_mode_id: number
  state: string
  proposal_title: string
  description: string
  total_area_acres: string
  notification_date: string | null
  mode_specific_checklist: string
  /** True when the unit office has explicitly locked the plot schedule via the Lock button. */
  plots_locked: boolean
  items: ScheduleItem[]
  entry_ts: string
  proposed_by: string
  proposed_by_role: string
  area_office: string
  mine_cd: string
  adjacent_colliery?: string
}
