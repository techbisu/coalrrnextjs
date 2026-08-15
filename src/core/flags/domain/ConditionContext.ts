import { ResolvedFactsResult } from '../services/FactResolver'

/**
 * ConditionContext
 *
 * Immutable Value Object encapsulating resolved entity facts for condition evaluation.
 * Safe to consume by Workflow, Checklist, Milestone, and DOCX engines.
 */
export class ConditionContext {
  public readonly entityType: string
  public readonly entityId: string
  private readonly factsMap: Record<string, any>
  private readonly overridesMap: Record<string, { value: any; reason: string | null; source: string | null }>

  constructor(resolved: ResolvedFactsResult) {
    this.entityType = resolved.entityType
    this.entityId = resolved.entityId
    this.factsMap = Object.freeze({ ...resolved.facts })
    this.overridesMap = Object.freeze({ ...resolved.overrides })
  }

  /**
   * Retrieves a fact value by key.
   */
  get<T = any>(key: string, defaultValue?: T): T {
    if (key in this.factsMap) {
      return this.factsMap[key] as T
    }
    return defaultValue as T
  }

  /**
   * Retrieves a fact as a boolean (truthy check).
   */
  getBoolean(key: string, defaultValue = false): boolean {
    const val = this.get(key, defaultValue)
    return Boolean(val)
  }

  /**
   * Checks if a fact key exists in the context.
   */
  has(key: string): boolean {
    return key in this.factsMap
  }

  /**
   * Checks if a specific fact key has been manually overridden.
   */
  isOverridden(key: string): boolean {
    return key in this.overridesMap
  }

  /**
   * Gets the override reason for a specific key, if overridden.
   */
  getOverrideReason(key: string): string | null {
    return this.overridesMap[key]?.reason ?? null
  }

  /**
   * Returns a key-value dictionary of all facts.
   */
  toDictionary(): Record<string, any> {
    return { ...this.factsMap }
  }
}
