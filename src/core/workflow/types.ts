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
/**
 * WorkflowState: Open string type representing any valid workflow state.
 * Legacy states are preserved as string literals for autocompletion.
 */
export type WorkflowState =
  | "Drafting"
  | "UnitSubmitted"
  | "CrossCollieryVerification"
  | "AreaVetting"
  | "HqParallelVetting"
  | "HqVetting"
  | "GmLreReview"
  | "BoardEscalation"
  | "LimitBreached"
  | "BoardApproved"
  | "DocketIssued"
  | "ManuallyApproved"
  | "Published"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Closed"
  | "Sec7Preparation"
  | (string & {});

/**
 * RecordType / EntityType: Open string type for polymorphic process records.
 */
export type RecordType =
  | "compensation_payroll"
  | "form_i_claim"
  | "land_schedule"
  | "employment_application"
  | "LAND_SCHEDULE"
  | "COMPENSATION_PAYROLL"
  | "EMPLOYMENT_APP"
  | "FORM_I_CLAIM"
  | (string & {});

/**
 * ActorRole: Open string type representing workflow roles.
 */
export type ActorRole =
  | "unit_office"
  | "area_office"
  | "gm_planning"
  | "gm_finance"
  | "gm_safety"
  | "hod_legal"
  | "gm_lre"
  | "board"
  | "system"
  | (string & {});

// ════════════════════════════════════════════════════════════════════════════
// Process Platform Runtime Models
// ════════════════════════════════════════════════════════════════════════════

export interface ProcessContext {
  readonly processCode: string;
  readonly moduleCode: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly currentState: WorkflowState;
  readonly businessContext?: Readonly<Record<string, unknown>>;
}

export interface WorkflowTask {
  readonly id: string;
  readonly processInstanceId: string;
  readonly workflowCycleId?: string;
  readonly workflowBranchId?: string;
  readonly stateCode: string;
  readonly taskType: 'REVIEW' | 'VERIFY' | 'SIGN' | 'APPROVE' | 'RECOMMEND' | 'ACKNOWLEDGE' | 'DATA_ENTRY' | 'DOCUMENT_ACTION' | string;
  readonly assignedUserId?: number;
  readonly assignedRole?: ActorRole;
  readonly assignmentScope?: Readonly<Record<string, unknown>>;
  readonly status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  readonly dueAt?: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly completedBy?: number;
}

export interface WorkflowCycle {
  readonly id: string;
  readonly processInstanceId: string;
  readonly cycleNo: number;
  readonly stateCode: string;
  readonly cycleType: 'NORMAL' | 'RETURN' | 'RETRY' | string;
  readonly parentCycleId?: string;
  readonly returnReason?: string;
  readonly status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | string;
  readonly startedAt: Date;
  readonly completedAt?: Date;
}

export interface WorkflowBranch {
  readonly id: string;
  readonly processInstanceId: string;
  readonly workflowCycleId?: string;
  readonly branchKey: string;
  readonly branchType: string;
  readonly targetEntityType?: string;
  readonly targetEntityId?: string;
  readonly status: 'ACTIVE' | 'COMPLETED' | 'RETURNED' | 'CANCELLED' | string;
  readonly isRequired: boolean;
  readonly executionMode: 'PARALLEL' | 'SEQUENTIAL' | string;
  readonly startedAt: Date;
  readonly completedAt?: Date;
}

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
  readonly acqModeId?: string | number;
  readonly workflowCode?: string;
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
