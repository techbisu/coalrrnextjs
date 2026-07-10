export type AcquisitionMode = 'cba_act' | 'direct_purchase' | 'rfctlarr' | 'patta'

export const MODE_META: Record<AcquisitionMode, { label: string; checklistCode: string; color: string }> = {
  cba_act:         { label: 'CBA Act, 1957',      checklistCode: 'CL-1.1', color: 'border-rose-300 bg-rose-50 text-rose-700' },
  direct_purchase: { label: 'Direct Purchase',    checklistCode: 'CL-1.2', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  rfctlarr:        { label: 'RFCTLARR Act, 2013', checklistCode: 'CL-1.3', color: 'border-violet-300 bg-violet-50 text-violet-700' },
  patta:           { label: 'Patta Transfer',     checklistCode: 'CL-1.4', color: 'border-teal-300 bg-teal-50 text-teal-700' },
}

export const MODES: AcquisitionMode[] = ['cba_act', 'direct_purchase', 'rfctlarr', 'patta']

export const ANNEXURE_META: Record<'A' | 'B' | 'C', { label: string; color: string; desc: string }> = {
  A: { label: 'A', color: 'border-emerald-300 bg-emerald-50 text-emerald-700',     desc: 'Govt. land' },
  B: { label: 'B', color: 'border-amber-300 bg-amber-50 text-amber-700',           desc: 'Private tenancy' },
  C: { label: 'C', color: 'border-rose-300 bg-rose-50 text-rose-700',              desc: 'Forest/Debottar' },
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
  acquisition_mode: AcquisitionMode
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
  colliery_code: string
  adjacent_colliery: string
}

export interface ScheduleItem {
  id: string
  plot_id: string
  plot_number: string
  mouza: string
  land_type: string
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
  project_id: string
  projectName: string
  acquisition_mode: AcquisitionMode
  state: string
  proposal_title: string
  description: string
  proposed_by: string
  proposed_by_role: string
  area_office: string
  colliery_code: string
  adjacent_colliery: string
  total_area_acres: string
  notification_date: string | null
  annexure_a: string
  annexure_b: string
  annexure_c: string
  mode_specific_checklist: string
  items: ScheduleItem[]
  entry_ts: string
}
