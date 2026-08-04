/**
 * WorkflowEngineServer — server-only wrapper around WorkflowEngine.
 *
 * Adds DB-backed async methods (loadWorkflowTransitions, cached with 60s TTL).
 * The base WorkflowEngine stays client-safe (no DB imports).
 *
 * Import from API routes and Use Cases ONLY — never from Client Components.
 * The 'server-only' guard causes a build error on any accidental client import.
 */
import 'server-only'
import { WorkflowEngine } from './engine'
import { loadWorkflowTransitions, invalidateWorkflowCache } from './WorkflowTransitionLoader'
import { normalizeModuleCode } from '@/core/config/module-codes.config'
import type {
  AttemptTransitionResult,
  GuardContext,
  RecordType,
  Transition,
} from './types'

export class WorkflowEngineServer extends WorkflowEngine {
  /**
   * DB-backed version of getAvailableTransitions.
   * Loads from `workflow_transitions` table (cached, 60s TTL).
   * Use in API routes / Use Cases for the authoritative transition graph.
   */
  async getAvailableTransitionsAsync(
    ctx: GuardContext
  ): Promise<ReadonlyArray<Transition>> {
    const workflowCode = normalizeModuleCode(ctx.recordType)
    let all = await loadWorkflowTransitions(workflowCode)
    if (all.length === 0 && workflowCode !== 'COMPENSATION_PAYROLL') {
      all = await loadWorkflowTransitions('COMPENSATION_PAYROLL')
    }
    return all.filter((t) => t.from === ctx.currentState && t.role === ctx.actorRole)
  }

  /**
   * DB-backed version of attemptTransition.
   * Loads the transition graph from DB (cached), applies guard.
   * Use in API route / UseCase handlers for authoritative enforcement.
   * Never throws — returns { ok: false, reason } on failure.
   */
  async attemptTransitionAsync(
    ctx: GuardContext,
    transitionName: string
  ): Promise<AttemptTransitionResult> {
    const available = await this.getAvailableTransitionsAsync(ctx)
    const transition = available.find((t) => t.name === transitionName)

    if (!transition) {
      return {
        ok: false,
        reason: `No authorised transition "${transitionName}" from state "${ctx.currentState}" for role "${ctx.actorRole}"`,
      }
    }

    if (transition.guard) {
      const result = transition.guard.check(ctx)
      if (!result.ok) {
        return {
          ok: false,
          failedGuard: transition.guard.name,
          reason: result.reason ?? 'Guard rejected transition',
        }
      }
    }

    return { ok: true, newState: transition.to }
  }

  /** Force-invalidate the DB transition cache (call after admin edits a transition). */
  invalidateCache(workflowCode?: string): void {
    invalidateWorkflowCache(workflowCode)
  }
}

/** Shared singleton for API routes / Use Cases. */
export const workflowEngineServer = new WorkflowEngineServer()
