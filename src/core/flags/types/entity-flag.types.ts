export interface EntityFlagRecord {
  id: string
  entity_type: string
  entity_id: string
  flag_code: string
  flag_value: any
  source: string | null
  is_overridden?: boolean
  override_reason?: string | null
  entry_ts: Date
  updt_ts: Date
  entry_by: string | null
  updt_by: string | null
}

export interface SetEntityFlagParams {
  entityType: string
  entityId: string
  flagCode: string
  flagValue: any
  source?: string
  isOverridden?: boolean
  overrideReason?: string | null
  entryBy?: string
}

export interface SetEntityFlagOptions {
  source?: string
  isOverridden?: boolean
  overrideReason?: string | null
  entryBy?: string
}
