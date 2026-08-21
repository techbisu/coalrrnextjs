/**
 * EntityPrerequisiteRegistry
 *
 * Singleton registry for IEntityPrerequisitePlugin implementations.
 *
 * ARCHITECTURE:
 * - Core services (WorkflowSnapshotQueryService, WorkflowGuardEvaluator)
 *   call this registry generically using moduleCode.
 * - Module-specific plugins are registered at application startup via Container.ts.
 * - The registry contains ZERO module-specific logic — it is a pure dispatcher.
 *
 * Usage (registration in Container.ts):
 *   entityPrerequisiteRegistry.register(new PlotSchedulePrerequisitePlugin())
 *
 * Usage (query in core services):
 *   const result = await entityPrerequisiteRegistry.evaluate(ctx)
 */
import { normalizeModuleCode } from '@/core/config/module-codes.config'
import type {
  IEntityPrerequisitePlugin,
  EntityPrerequisiteContext,
  EntityPrerequisiteResult,
  EntityPrerequisiteGuardResult,
} from './IEntityPrerequisitePlugin'

export class EntityPrerequisiteRegistry {
  private readonly plugins = new Map<string, IEntityPrerequisitePlugin>()

  /**
   * Register a prerequisite plugin for a module.
   * Call this from Container.ts during application bootstrap.
   */
  register(plugin: IEntityPrerequisitePlugin): void {
    const key = normalizeModuleCode(plugin.moduleCode)
    this.plugins.set(key, plugin)
    // Also store unnormalized raw code just in case
    this.plugins.set(plugin.moduleCode, plugin)
  }

  /**
   * Evaluate all prerequisites for the entity.
   * Returns empty/satisfied result if no plugin is registered for the module.
   *
   * Called by: WorkflowSnapshotQueryService
   */
  async evaluate(ctx: EntityPrerequisiteContext): Promise<EntityPrerequisiteResult> {
    const key = normalizeModuleCode(ctx.moduleCode)
    const plugin = this.plugins.get(key) || this.plugins.get(ctx.moduleCode)
    if (!plugin) {
      return { allSatisfied: true, pendingActions: [], completedActions: [] }
    }
    return plugin.evaluate(ctx)
  }

  /**
   * Evaluate whether prerequisites block a workflow transition.
   * Returns { ok: true } if no plugin is registered for the module.
   *
   * Called by: WorkflowGuardEvaluator
   */
  async evaluateForGuard(ctx: EntityPrerequisiteContext): Promise<EntityPrerequisiteGuardResult> {
    const key = normalizeModuleCode(ctx.moduleCode)
    const plugin = this.plugins.get(key) || this.plugins.get(ctx.moduleCode)
    if (!plugin) {
      return { ok: true }
    }
    return plugin.evaluateForGuard(ctx)
  }

  /** Returns whether a plugin is registered for the given moduleCode */
  hasPlugin(moduleCode: string): boolean {
    const key = normalizeModuleCode(moduleCode)
    return this.plugins.has(key) || this.plugins.has(moduleCode)
  }
}

/**
 * Singleton instance — import this in Container.ts to register plugins
 * and in core services to query.
 */
export const entityPrerequisiteRegistry = new EntityPrerequisiteRegistry()
