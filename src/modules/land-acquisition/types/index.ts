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
  scheduleCode: string
  projectId: string
  projectName: string
  acquisitionMode: AcquisitionMode
  state: string
  proposalTitle: string
  description: string
  totalAreaAcres: string
  notificationDate: string | null
  itemSummary: { total: number; annexureA: number; annexureB: number; annexureC: number }
  createdAt: string
  proposedBy: string
  proposedByRole: string
  areaOffice: string
  collieryCode: string
  adjacentColliery: string
}

export interface ScheduleItem {
  id: string
  plotId: string
  plotNumber: string
  mouza: string
  landType: string
  areaAcres: string
  annexureTag: 'A' | 'B' | 'C'
  isActive: boolean
}

export interface ModeChecklistPayload {
  checklistCode: string
  items: Array<{ key: string; label: string; required: boolean; status: string }>
}

export interface ScheduleDetail {
  id: string
  scheduleCode: string
  projectId: string
  projectName: string
  acquisitionMode: AcquisitionMode
  state: string
  proposalTitle: string
  description: string
  proposedBy: string
  proposedByRole: string
  areaOffice: string
  collieryCode: string
  adjacentColliery: string
  totalAreaAcres: string
  notificationDate: string | null
  annexureA: string
  annexureB: string
  annexureC: string
  modeSpecificChecklist: string
  items: ScheduleItem[]
  createdAt: string
}
