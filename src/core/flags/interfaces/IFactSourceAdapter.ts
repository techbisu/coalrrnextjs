/**
 * IFactSourceAdapter
 *
 * Domain-specific adapter interface for fetching authoritative domain attributes
 * and computing derived facts for a specific canonical entity type.
 */
export interface IFactSourceAdapter {
  /**
   * The canonical entity type supported by this adapter (e.g. 'acq_land_schedule', 'project').
   */
  readonly entityType: string

  /**
   * Resolves authoritative domain data and derived facts for the specified entityId.
   * Returns a key-value map of facts.
   */
  resolveDomainFacts(entityId: string): Promise<Record<string, any>>
}
