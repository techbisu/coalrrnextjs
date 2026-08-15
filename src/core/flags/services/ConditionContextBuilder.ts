import { FactResolver } from './FactResolver'
import { ConditionContext } from '../domain/ConditionContext'

/**
 * ConditionContextBuilder
 *
 * Service responsible for building immutable ConditionContext objects
 * for any given entityType and entityId using FactResolver.
 */
export class ConditionContextBuilder {
  constructor(private readonly factResolver: FactResolver) {}

  /**
   * Builds an immutable ConditionContext instance for the specified entity.
   */
  async buildContext(entityType: string, entityId: string): Promise<ConditionContext> {
    const resolved = await this.factResolver.resolveFacts(entityType, entityId)
    return new ConditionContext(resolved)
  }
}
