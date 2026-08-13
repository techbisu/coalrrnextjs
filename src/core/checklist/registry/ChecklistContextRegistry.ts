import { IChecklistContextResolver } from '../interfaces/IChecklistContextResolver';
import { GenericEntityContextResolver } from '../services/GenericEntityContextResolver';

/**
 * ChecklistContextRegistry
 *
 * Maps module codes to context resolvers used to populate `show_if` rule
 * evaluation and document generation variable injection.
 *
 * CHANGED: `getResolver` now falls back to a GenericEntityContextResolver
 * instead of throwing. This means any module configured purely via DB
 * (process_definition, checklist_requirement_rule) will work without
 * registering a custom TypeScript resolver class.
 *
 * Module-specific resolvers can still be registered to provide richer context
 * (e.g., domain entity objects with computed properties). They take priority.
 */
export class ChecklistContextRegistry {
  private resolvers = new Map<string, IChecklistContextResolver>();

  register(moduleCode: string, resolver: IChecklistContextResolver) {
    this.resolvers.set(moduleCode, resolver);
  }

  getResolver(moduleCode: string): IChecklistContextResolver {
    const resolver = this.resolvers.get(moduleCode);
    if (resolver) return resolver;

    // Fallback: generic resolver that reads context from process_definition config
    console.info(`[ChecklistContextRegistry] No specific resolver for module "${moduleCode}". Falling back to GenericEntityContextResolver.`);
    return new GenericEntityContextResolver(moduleCode);
  }

  hasResolver(moduleCode: string): boolean {
    return this.resolvers.has(moduleCode);
  }
}
