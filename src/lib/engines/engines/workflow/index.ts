/**
 * Workflow Engine — barrel (COALRR spec §2.3).
 *
 * Hybrid: explicit finite-state machine (legal transitions) + event pipeline
 * for side effects. Guards are referenced by both the workflow and the
 * validation layer (§1.3.3) — re-exported here for cross-layer reuse.
 */
export { WorkflowEventCatalog, REVIEW_ROLE_FANOUT, getReviewRolesForState } from "./events";
export type { WorkflowEventName } from "./events";
export {
  COMPENSATION_PAYROLL_ORDERED_STATES,
  COMPENSATION_PAYROLL_STATES,
} from "./states";
export {
  BaselineBreachedGuard,
  ChecklistFullySatisfiedGuard,
  ParallelReviewsCompletedGuard,
  PlotNotAlreadyAcquiredGuard,
  ThresholdMetGuard,
  WithinProjectBaselineGuard,
} from "./guards";
export { WorkflowEngine } from "./engine";
export type {
  ActorRole,
  AttemptTransitionResult,
  GuardContext,
  GuardResult,
  RecordType,
  SideEffect,
  Transition,
  TransitionGuard,
  WorkflowState,
  WorkflowStateMeta,
} from "./types";
