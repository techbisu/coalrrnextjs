import { IEntityFlagRepository } from '../interfaces/IEntityFlagRepository'
import { IFactSourceAdapter } from '../interfaces/IFactSourceAdapter'
import { EntityFlagRecord } from '../types/entity-flag.types'
import { normalizeCheckableEntityType } from '@/core/config/module-codes.config'

export interface ResolvedFactsResult {
  entityType: string
  entityId: string
  facts: Record<string, any>
  overrides: Record<string, { value: any; reason: string | null; source: string | null }>
  rawFlags: EntityFlagRecord[]
}

/**
 * FactResolver
 *
 * Unified orchestrator that merges:
 * 1. Authoritative Domain Data
 * 2. Derived Facts (computed dynamic properties)
 * 3. Persisted Entity Flags (public.entity_flag)
 *
 * Giving precedence to persisted entity_flag values, especially when `is_overridden === true`.
 */
export class FactResolver {
  private adapters = new Map<string, IFactSourceAdapter>()

  constructor(private readonly flagRepository: IEntityFlagRepository) {}

  /**
   * Registers a domain fact source adapter for a specific entity type.
   */
  registerAdapter(adapter: IFactSourceAdapter): void {
    const normalizedType = this.normalizeEntityType(adapter.entityType)
    this.adapters.set(normalizedType, adapter)
  }

  /**
   * Normalizes raw entity type strings to canonical CHECKABLE_ENTITY_TYPES values.
   */
  normalizeEntityType(rawType: string): string {
    return normalizeCheckableEntityType(rawType)
  }

  /**
   * Resolves all facts for the given entityType and entityId.
   */
  async resolveFacts(entityType: string, entityId: string): Promise<ResolvedFactsResult> {
    const normalizedType = this.normalizeEntityType(entityType)
    if (!entityId || typeof entityId !== 'string') {
      throw new Error('entity_id is required')
    }

    // 1. Fetch domain facts & derived facts from registered adapter (if available)
    let domainFacts: Record<string, any> = {}
    const adapter = this.adapters.get(normalizedType)
    if (adapter) {
      domainFacts = (await adapter.resolveDomainFacts(entityId)) || {}
    }

    // 2. Fetch persisted entity flags from repository
    const storedFlags = await this.flagRepository.getAll(normalizedType, entityId)

    // 3. Merge facts with precedence
    const mergedFacts: Record<string, any> = { ...domainFacts }
    const overrides: Record<string, { value: any; reason: string | null; source: string | null }> = {}

    for (const flag of storedFlags) {
      mergedFacts[flag.flag_code] = flag.flag_value
      if (flag.is_overridden) {
        overrides[flag.flag_code] = {
          value: flag.flag_value,
          reason: flag.override_reason ?? null,
          source: flag.source,
        }
      }
    }

    return {
      entityType: normalizedType,
      entityId,
      facts: mergedFacts,
      overrides,
      rawFlags: storedFlags,
    }
  }
}
