import { EntityFlagRecord, SetEntityFlagOptions, SetEntityFlagParams } from '../types/entity-flag.types'

export interface IEntityFlagRepository {
  get(entityType: string, entityId: string, flagCode: string): Promise<EntityFlagRecord | null>
  getAll(entityType: string, entityId: string): Promise<EntityFlagRecord[]>
  set(
    entityType: string,
    entityId: string,
    flagCode: string,
    flagValue: any,
    options?: SetEntityFlagOptions
  ): Promise<EntityFlagRecord>
  setDirect(params: SetEntityFlagParams): Promise<EntityFlagRecord>
  delete(entityType: string, entityId: string, flagCode: string): Promise<boolean>
  exists(entityType: string, entityId: string, flagCode: string): Promise<boolean>
}
