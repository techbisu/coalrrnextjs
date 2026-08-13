/**
 * Generic Core Workflow Platform — Routing Resolver Registry.
 * 
 * Decouples module-specific routing dropdown options (e.g. Adjacent Colliery selection for LAP)
 * from shared workflow dialog components.
 */

export interface RoutingOption {
  readonly value: string;
  readonly label: string;
  readonly metadata?: Record<string, unknown>;
}

export type RoutingOptionsResolver = (
  entityType: string,
  entityId: string,
  context?: Record<string, unknown>
) => Promise<RoutingOption[]>;

class RoutingResolverRegistry {
  private resolvers = new Map<string, RoutingOptionsResolver>();

  register(sourceKey: string, resolver: RoutingOptionsResolver): void {
    this.resolvers.set(sourceKey, resolver);
  }

  async resolve(
    sourceKey: string,
    entityType: string,
    entityId: string,
    context?: Record<string, unknown>
  ): Promise<RoutingOption[]> {
    const resolver = this.resolvers.get(sourceKey);
    if (!resolver) {
      return [];
    }
    return resolver(entityType, entityId, context);
  }
}

export const routingResolverRegistry = new RoutingResolverRegistry();
