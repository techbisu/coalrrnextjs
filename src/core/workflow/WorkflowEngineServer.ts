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
import { normalizeModuleCode, resolveWorkflowCode, MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'
import { workflowGuardEvaluator } from './services/WorkflowGuardEvaluator'
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
   * Evaluates all transition guards & stage prerequisites (Plots, Checklist, Documents).
   * Use in API routes / Use Cases / Snapshot for the authoritative available transition graph.
   */
  async getAvailableTransitionsAsync(
    ctx: GuardContext
  ): Promise<ReadonlyArray<Transition>> {
    const workflowCode = ctx.workflowCode || resolveWorkflowCode(ctx.recordType, ctx.acqModeId)
    let all = await loadWorkflowTransitions(workflowCode)
    if (all.length === 0 && workflowCode !== MODULE_CODES.COMPENSATION_PAYROLL) {
      all = await loadWorkflowTransitions(MODULE_CODES.COMPENSATION_PAYROLL)
    }

    const candidateTransitions = all.filter((t) => t.from === ctx.currentState)
    const satisfiedTransitions: Transition[] = []

    for (const t of candidateTransitions) {
      const evalResult = await workflowGuardEvaluator.evaluateTransition({
        moduleCode: ctx.recordType,
        entityType: ctx.entityType || CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
        entityId: ctx.recordId,
        currentState: ctx.currentState,
        userContext: { userId: ctx.userId, role: ctx.actorRole },
        transition: { ...t, workflowCode },
      })

      if (evalResult.ok) {
        satisfiedTransitions.push(t)
      }
    }

    return satisfiedTransitions
  }

  /**
   * DB-backed version of attemptTransition.
   * Loads the transition graph from DB (cached), applies full guard evaluation.
   * Use in API route / UseCase handlers for authoritative enforcement.
   * Never throws — returns { ok: false, reason } on failure.
   */
  async attemptTransitionAsync(
    ctx: GuardContext,
    transitionName: string
  ): Promise<AttemptTransitionResult> {
    const workflowCode = ctx.workflowCode || resolveWorkflowCode(ctx.recordType, ctx.acqModeId)
    let all = await loadWorkflowTransitions(workflowCode)
    if (all.length === 0 && workflowCode !== MODULE_CODES.COMPENSATION_PAYROLL) {
      all = await loadWorkflowTransitions(MODULE_CODES.COMPENSATION_PAYROLL)
    }

    const transition = all.find(
      (t) => t.from === ctx.currentState && t.name === transitionName
    )

    if (!transition) {
      return {
        ok: false,
        reason: `No transition "${transitionName}" defined from state "${ctx.currentState}"`,
      }
    }

    // 1. Evaluate Full Prerequisites & Guard Rules
    const evalResult = await workflowGuardEvaluator.evaluateTransition({
      moduleCode: ctx.recordType,
      entityType: ctx.entityType || CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      entityId: ctx.recordId,
      currentState: ctx.currentState,
      userContext: { userId: ctx.userId, role: ctx.actorRole },
      transition: { ...transition, workflowCode },
    })

    if (!evalResult.ok) {
      return {
        ok: false,
        failedGuard: 'transition_prerequisites',
        reason: evalResult.reason ?? `Transition "${transitionName}" blocked by guard`,
      }
    }

    // 2. Evaluate Global Required Recommendations Guard
    const { RequiredRecommendationsFulfilledGuard } = await import('./guards')
    const reqRecGuard = new RequiredRecommendationsFulfilledGuard()
    const reqRecResult = reqRecGuard.check({
      ...ctx,
      data: {
        ...ctx.data,
        targetTransitionName: transitionName,
        targetTransitionId: `${transition.from}->${transition.to}:${transition.name}`,
      },
    })
    if (!reqRecResult.ok) {
      return {
        ok: false,
        failedGuard: reqRecGuard.name,
        reason: reqRecResult.reason ?? 'Required recommendation pending',
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
