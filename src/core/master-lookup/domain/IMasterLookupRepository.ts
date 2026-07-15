import { MasterOption } from '../types'

export interface FindOptionsParams {
  master: string
  labelField: string
  valueField: string
  dependencies?: Record<string, string | number>
  searchQuery?: string
  activeOnly?: boolean
}

export interface IMasterLookupRepository {
  findOptions(params: FindOptionsParams): Promise<MasterOption[]>
}
