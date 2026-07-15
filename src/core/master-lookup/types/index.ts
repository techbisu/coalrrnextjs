export interface MasterOption {
  value: string | number
  label: string
  payload?: Record<string, any> // Original row data for advanced formatting or cascading
}

export interface LookupConfig {
  master: string
  dependsOn?: Record<string, string | number | null | undefined>
  searchQuery?: string
  activeOnly?: boolean
  selectedValues?: string[]
  language?: string
  page?: number
  pageSize?: number
}

export interface MasterLookupProps {
  master: string
  value?: string | number | null | (string | number)[]
  onChange?: (val: string | number | null | (string | number)[]) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  activeOnly?: boolean
  isMulti?: boolean
  language?: string
  dependsOn?: Record<string, string | number | null | undefined>
  className?: string
  
  // Events
  onLoaded?: (options: MasterOption[]) => void
  onError?: (error: Error) => void
  onClear?: () => void
}

export interface MasterFormLookupProps extends Omit<MasterLookupProps, 'value' | 'onChange'> {
  name: string
  control: any // from react-hook-form
  required?: boolean
}
