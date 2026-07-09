/**
 * Workflow Engine — Main orchestrator (COALRR spec §2.3).
 *
 * Hybrid: explicit finite-state machine (legal transitions) + declarative
 * side-effect descriptors. Pure & Prisma-free — the caller persists state and
 * enacts the side-effects. NEVER throws on a blocked transition; returns
 * `{ ok: false, reason }` so the UI can render a disabled button + tooltip
 * (spec §2.3.1).
 */
import { getReviewRolesForState } from "./events";
import { COMPENSATION_PAYROLL_STATES } from "./states";
import type {
  AttemptTransitionResult,
  GuardContext,
  RecordType,
  SideEffect,
  Transition,
  WorkflowState,
  WorkflowStateMeta,
} from "./types";

// ════════════════════════════════════════════════════════════════════════════
// WorkflowEngine
// ════════════════════════════════════════════════════════════════════════════

/**
 * State machine driver for COALRR records. Today only `CompensationPayroll`
 * has a fully modelled pipeline; other record types fall back to the same
 * catalogue (extensible by passing a different state map in the constructor).
 */
export class WorkflowEngine {
  constructor(
    private readonly stateMaps: Readonly<
      Partial<Record<RecordType, Readonly<Record<string, WorkflowStateMeta>>>>
    > = {
      CompensationPayroll: COMPENSATION_PAYROLL_STATES,
      FormIClaim: COMPENSATION_PAYROLL_STATES,
      LandSchedule: COMPENSATION_PAYROLL_STATES,
      EmploymentApplication: COMPENSATION_PAYROLL_STATES,
    },
  ) {}

  /**
   * Returns the metadata map for a record type (used by the stepper UI).
   */
  getStates(recordType: RecordType): Readonly<Record<string, WorkflowStateMeta>> {
    return this.stateMaps[recordType] ?? COMPENSATION_PAYROLL_STATES;
  }

  /**
   * Returns the metadata for a specific state of a record type.
   */
  getStateMeta(
    recordType: RecordType,
    state: WorkflowState,
  ): WorkflowStateMeta | undefined {
    return this.getStates(recordType)[state];
  }

  /**
   * Returns the transitions an actor is authorised to fire from the record's
   * current state. Role-filtered so the UI only shows relevant buttons.
   */
  getAvailableTransitions(ctx: GuardContext): ReadonlyArray<Transition> {
    const meta = this.getStateMeta(ctx.recordType, ctx.currentState);
    if (!meta) return [];
    return meta.allowedTransitions.filter((t) => t.role === ctx.actorRole);
  }

  /**
   * Finds a transition by `name` from the current state (regardless of role —
   * the role check is applied inside this method too).
   */
  findTransition(
    ctx: GuardContext,
    transitionName: string,
  ): Transition | undefined {
    return this.getAvailableTransitions(ctx).find(
      (t) => t.name === transitionName,
    );
  }

  /**
   * Attempts to fire `transitionName` from the record's current state.
   *
   * **Never throws.** Returns `{ ok: true, newState }` on success, or
   * `{ ok: false, reason }` (with optional `failedGuard` name) on failure.
   * The UI renders the latter as a disabled button with a tooltip (§2.3.1).
   */
  attemptTransition(
    ctx: GuardContext,
    transitionName: string,
  ): AttemptTransitionResult {
    const transition = this.findTransition(ctx, transitionName);
    if (!transition) {
      return {
        ok: false,
        reason: `No authorised transition "${transitionName}" from state "${ctx.currentState}" for role "${ctx.actorRole}"`,
      };
    }

    if (transition.guard) {
      const result = transition.guard.check(ctx);
      if (!result.ok) {
        return {
          ok: false,
          failedGuard: transition.guard.name,
          reason: result.reason ?? "Guard rejected transition",
        };
      }
    }

    return { ok: true, newState: transition.to };
  }

  /**
   * Returns the list of side-effect descriptors that should fire when a record
   * enters `newState`. The caller (API route / Livewire-equivalent component)
   * actually enacts them — keeping the engine pure & testable.
   */
  fireSideEffects(
    ctx: GuardContext,
    newState: WorkflowState,
  ): ReadonlyArray<SideEffect> {
    const effects: SideEffect[] = [];

    switch (newState) {
      case "HqParallelVetting": {
        const roles = getReviewRolesForState(newState);
        if (roles.length > 0) {
          effects.push({ type: "spawn_review_tasks", roles });
        }
        effects.push({
          type: "notify",
          channel: "in_app",
          template: "parallel_review_requested",
        });
        break;
      }
      case "DirectorConsent":
        effects.push({
          type: "notify",
          channel: "in_app",
          template: "director_consent_requested",
        });
        break;
      case "CmdApproved":
        effects.push({
          type: "notify",
          channel: "in_app",
          template: "cmd_approved",
        });
        break;
      case "Published": {
        // Transparency window starts at publication (spec §3 / Module 3).
        effects.push({ type: "start_transparency_timer", durationDays: 21 });
        effects.push({
          type: "publish_to_ledger",
          ledgerCode: "form_d",
        });
        effects.push({
          type: "notify",
          channel: "sms",
          template: "award_published",
        });
        effects.push({
          type: "notify",
          channel: "email",
          template: "award_published",
        });
        break;
      }
      case "BoardEscalation":
        effects.push({
          type: "notify",
          channel: "in_app",
          template: "board_escalation_triggered",
        });
        effects.push({
          type: "notify",
          channel: "email",
          template: "board_escalation_triggered",
        });
        break;
      default:
        // Drafting / UnitSubmitted / AreaVetting — no automated side-effects.
        break;
    }

    return effects;
  }
}
