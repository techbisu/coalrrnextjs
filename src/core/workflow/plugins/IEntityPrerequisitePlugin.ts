/**
 * IEntityPrerequisitePlugin
 *
 * Generic interface for entity-level prerequisite checks that are
 * NOT captured by the checklist rule system.
 *
 * Examples:
 *  - Land Acquisition: minimum 1 plot schedule entry required
 *  - Any module: custom domain constraint before workflow forwarding
 *
 * ARCHITECTURE:
 * This interface belongs to the CORE workflow plugin contract.
 * Implementations are registered per-module in the EntityPrerequisiteRegistry.
 * The core WorkflowSnapshotQueryService and WorkflowGuardEvaluator call the
 * registry generically — they contain ZERO module-specific logic.
 */
import type { WorkflowPendingAction, WorkflowActionItem } from '../types/snapshot.types'

export interface EntityPrerequisiteContext {
  moduleCode: string
  entityType: string
  entityId: string
  currentState: string
}

export interface EntityPrerequisiteResult {
  /** Whether all prerequisites for this plugin are satisfied */
  allSatisfied: boolean
  /** Actions that are pending (not yet done) */
  pendingActions: WorkflowPendingAction[]
  /** Actions that are completed (for timeline history) */
  completedActions: WorkflowActionItem[]
}

export interface EntityPrerequisiteGuardResult {
  /** Whether the transition should be allowed from a prerequisite standpoint */
  ok: boolean
  /** Human-readable reason if blocked */
  reason?: string
}

export interface IEntityPrerequisitePlugin {
  /**
   * The module code this plugin handles.
   * Use MODULE_CODES constants from module-codes.config.ts.
   */
  readonly moduleCode: string

  /**
   * Evaluates all prerequisites for the entity and returns both
   * pending actions (for the snapshot UI) and completed actions (for timeline).
   *
   * Called by: WorkflowSnapshotQueryService
   */
  evaluate(ctx: EntityPrerequisiteContext): Promise<EntityPrerequisiteResult>

  /**
   * Evaluates whether prerequisites block a workflow transition.
   * Lighter than evaluate() — only needs to return ok/reason.
   *
   * Called by: WorkflowGuardEvaluator
   */
  evaluateForGuard(ctx: EntityPrerequisiteContext): Promise<EntityPrerequisiteGuardResult>
}
