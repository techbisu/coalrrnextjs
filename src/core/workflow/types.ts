/**
 * Workflow Engine — Core types (COALRR spec §2.3).
 *
 * Hybrid design (spec §2.3): an explicit finite-state machine for legal state
 * transitions + an event/listener pipeline for side effects. The engine never
 * throws on a blocked transition — it returns `{ ok: false, ... }` so the UI
 * can render a disabled button with a tooltip (spec §2.3.1).
 */

// ════════════════════════════════════════════════════════════════════════════
// Workflow state
// ════════════════════════════════════════════════════════════════════════════

/**
 * All states reachable by a `compensation_payroll` record (spec §2.3 / Module 4).
 *
 * Happy path:
 *   Drafting → UnitSubmitted → AreaVetting → HqParallelVetting →
 *   DirectorConsent → CmdApproved → Published
 *
 * Branch: `BoardEscalation` is reachable from `AreaVetting` and
 * `DirectorConsent` when the project baseline is breached.
 */
export type WorkflowState =
  | "Drafting"
  | "UnitSubmitted"
  | "AreaVetting"
  | "HqParallelVetting"
  | "DirectorConsent"
  | "CmdApproved"
  | "Published"
  | "BoardEscalation";

/**
 * Record types that participate in a workflow (spec §2.3 polymorphic).
 * Each may eventually have its own state set; today only `compensation_payroll`
 * has the full pipeline modelled.
 */
export type RecordType =
  | "compensation_payroll"
  | "form_i_claim"
  | "land_schedule"
  | "employment_application";

/**
 * Roles that can drive transitions (mirrors Prisma `workflow_review_task.role`).
 */
export type ActorRole =
  | "unit_office"
  | "area_office"
  | "gm_planning"
  | "gm_finance"
  | "gm_safety"
  | "director"
  | "cmd"
  | "board";

// ════════════════════════════════════════════════════════════════════════════
// Guard types
// ════════════════════════════════════════════════════════════════════════════

/**
 * Context object passed to every guard. The `data` payload is opaque to the
 * engine — each guard extracts what it needs. The caller (UI / API route) is
 * responsible for pre-loading any DB state required by the guard so the engine
 * itself stays Prisma-free (spec §1.3.3 — "guards are referenced by both the
 * workflow and the validation layer").
 */
export interface GuardContext {
  readonly recordId: string;
  readonly recordType: RecordType;
  readonly actorRole: ActorRole;
  readonly currentState: WorkflowState;
  readonly data?: Readonly<Record<string, unknown>>;
}

/** Outcome of a single guard check. */
export interface GuardResult {
  readonly ok: boolean;
  /** Human-readable reason shown in the UI tooltip when `ok: false`. */
  readonly reason?: string;
}

/**
 * A reusable transition guard. Stateful guards (e.g. `ChecklistFullySatisfiedGuard`)
 * take their static config in the constructor; per-record data flows through
 * `GuardContext.data`.
 */
export interface TransitionGuard {
  readonly name: string;
  check(ctx: GuardContext): GuardResult;
}

// ════════════════════════════════════════════════════════════════════════════
// Transition types
// ════════════════════════════════════════════════════════════════════════════

/**
 * A single legal state transition. `name` is the user-facing action label
 * (e.g. `"submit_to_area"`). `guard?` is optional — when absent the transition
 * is always allowed (subject to role match).
 */
export interface Transition {
  /** Machine name, e.g. `"submit_to_unit"`. */
  readonly name: string;
  /** UI label, e.g. `"Submit to Unit Office"`. */
  readonly label: string;
  readonly from: WorkflowState;
  readonly to: WorkflowState;
  /** role authorised to fire this transition. */
  readonly role: ActorRole;
  /** Optional guard(s) that must pass before the transition fires. */
  readonly guard?: TransitionGuard;
}

/** Metadata describing a state for UI rendering. */
export interface WorkflowStateMeta {
  readonly label: string;
  readonly description: string;
  /** Tailwind classes / hex — used by the `<StateBadge>` component. */
  readonly color: string;
  /** Lucide icon name (string; resolved in the UI layer). */
  readonly icon: string;
  /** Linear order for stepper rendering. */
  readonly order: number;
  readonly isTerminal: boolean;
  /** Transitions allowed FROM this state. */
  readonly allowedTransitions: ReadonlyArray<Transition>;
}

// ════════════════════════════════════════════════════════════════════════════
// Transition attempt result
// ════════════════════════════════════════════════════════════════════════════

/**
 * Result of `WorkflowEngine.attemptTransition`. NEVER an exception — the UI
 * renders a disabled button + tooltip from the `reason` field (spec §2.3.1).
 */
export type AttemptTransitionResult =
  | { readonly ok: true; readonly newState: WorkflowState }
  | {
      readonly ok: false;
      readonly failedGuard?: string;
      readonly reason: string;
    };

// ════════════════════════════════════════════════════════════════════════════
// Side-effect descriptors
// ════════════════════════════════════════════════════════════════════════════

/**
 * Declarative side-effect descriptor returned by `fireSideEffects`. The caller
 * (API route / Livewire-equivalent component) actually enacts them — keeping
 * the engine pure & testable.
 */
export type SideEffect =
  | {
      readonly type: "spawn_review_tasks";
      readonly roles: ReadonlyArray<string>;
    }
  | {
      readonly type: "start_transparency_timer";
      readonly durationDays: number;
    }
  | {
      readonly type: "notify";
      readonly channel: "in_app" | "sms" | "email";
      readonly template?: string;
    }
  | {
      readonly type: "lock_baseline";
      readonly scope: "project" | "plot";
    }
  | {
      readonly type: "publish_to_ledger";
      readonly ledgerCode: string;
    };
