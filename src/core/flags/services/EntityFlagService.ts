import { IEntityFlagRepository } from '../interfaces/IEntityFlagRepository'
import { EntityFlagRecord, SetEntityFlagOptions } from '../types/entity-flag.types'
import { SetEntityFlagSchema } from '@/shared/schemas/entity-flag.schema'
import { normalizeCheckableEntityType } from '@/core/config/module-codes.config'
import { Audit } from '@/core/audit/services/AuditService'

/**
 * EntityFlagService
 *
 * Provides backend infrastructure for persisting and querying business flags/facts.
 * Standardizes entity_type normalization against canonical application constants.
 *
 * NOTE: Contains ZERO business decision logic or automatic flag calculations.
 */
export class EntityFlagService {
  constructor(private readonly repository: IEntityFlagRepository) {}

  /**
   * Normalizes raw entity type strings to canonical CHECKABLE_ENTITY_TYPES values.
   */
  normalizeEntityType(rawType: string): string {
    return normalizeCheckableEntityType(rawType)
  }

  async get(entityType: string, entityId: string, flagCode: string): Promise<EntityFlagRecord | null> {
    const normalizedType = this.normalizeEntityType(entityType)
    if (!entityId || typeof entityId !== 'string') throw new Error('entity_id is required')
    if (!flagCode || typeof flagCode !== 'string') throw new Error('flag_code is required')

    return this.repository.get(normalizedType, entityId, flagCode)
  }

  async getAll(entityType: string, entityId: string): Promise<EntityFlagRecord[]> {
    const normalizedType = this.normalizeEntityType(entityType)
    if (!entityId || typeof entityId !== 'string') throw new Error('entity_id is required')

    return this.repository.getAll(normalizedType, entityId)
  }

  async set(
    entityType: string,
    entityId: string,
    flagCode: string,
    flagValue: any,
    options?: SetEntityFlagOptions
  ): Promise<EntityFlagRecord> {
    const normalizedType = this.normalizeEntityType(entityType)

    // Validate params with Zod schema
    const validationResult = SetEntityFlagSchema.safeParse({
      entityType: normalizedType,
      entityId,
      flagCode,
      flagValue,
      source: options?.source ?? 'SYSTEM',
      isOverridden: options?.isOverridden ?? false,
      overrideReason: options?.overrideReason ?? null,
      entryBy: options?.entryBy ?? 'system',
    })

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map((i) => i.message).join(', ')
      throw new Error(`Validation failed for entity_flag: ${errorMsg}`)
    }

    const record = await this.repository.set(normalizedType, entityId, flagCode, flagValue, options)

    // Log audit event for flag set / override mutation
    Audit.logCustomAction({
      activity: `[ENTITY_FLAG_SET] Entity flag '${flagCode}' set for ${normalizedType}:${entityId} (Value: ${JSON.stringify(flagValue)}${options?.isOverridden ? `, Overridden: true, Reason: ${options.overrideReason}` : ''})`,
      userId: options?.entryBy ?? 'system',
    }).catch((err) => console.error('[EntityFlagService] Failed to log audit action:', err))

    return record
  }

  async delete(entityType: string, entityId: string, flagCode: string): Promise<boolean> {
    const normalizedType = this.normalizeEntityType(entityType)
    if (!entityId) throw new Error('entity_id is required')
    if (!flagCode) throw new Error('flag_code is required')

    const success = await this.repository.delete(normalizedType, entityId, flagCode)

    if (success) {
      Audit.logCustomAction({
        activity: `[ENTITY_FLAG_DELETE] Entity flag '${flagCode}' deleted for ${normalizedType}:${entityId}`,
        userId: 'system',
      }).catch((err) => console.error('[EntityFlagService] Failed to log audit action:', err))
    }

    return success
  }

  async exists(entityType: string, entityId: string, flagCode: string): Promise<boolean> {
    const normalizedType = this.normalizeEntityType(entityType)
    if (!entityId) throw new Error('entity_id is required')
    if (!flagCode) throw new Error('flag_code is required')

    return this.repository.exists(normalizedType, entityId, flagCode)
  }
}
