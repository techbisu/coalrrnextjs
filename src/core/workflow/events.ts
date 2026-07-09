/**
 * Workflow Engine — Event catalogue + role fan-out (COALRR spec §2.3.2).
 *
 * The original Laravel/Livewire design used `LivewireEvents::DOCUMENT_VAULTED`
 * style named constants dispatched across components. We mirror that pattern
 * here so any consumer (React state, Zustand store, server-sent event, etc.)
 * can subscribe to a stable string channel.
 */

/**
 * Stable string constants for workflow events. Consumers subscribe by these
 * names — keeping them in one place lets us rename internal channels without
 * ripple changes.
 */
export const WorkflowEventCatalog = Object.freeze({
  /** A workflow transition succeeded (new state recorded). */
  WORKFLOW_TRANSITIONED: "workflow.transitioned",
  /** A document was vaulted (uploaded + virus-scanned + linked to a record). */
  DOCUMENT_VAULTED: "document.vaulted",
  /** A checklist item's completion status changed. */
  CHECKLIST_PROGRESS_UPDATED: "checklist.progress-updated",
  /** The MathPreviewPanel recomputed the live award. */
  MATH_PREVIEW_RECOMPUTED: "math.preview-recomputed",
  /** A parallel-review task was decided; the orchestrator checks completion. */
  PARALLEL_REVIEW_COMPLETED: "workflow.parallel-review-completed",
} as const);

export type WorkflowEventName =
  (typeof WorkflowEventCatalog)[keyof typeof WorkflowEventCatalog];

/**
 * Per spec §2.3.2 — when a `CompensationPayroll` enters `HqParallelVetting`,
 * the workflow fans out parallel review tasks to both GM roles.
 */
export const REVIEW_ROLE_FANOUT: Readonly<Record<string, ReadonlyArray<string>>> =
  Object.freeze({
    HqParallelVetting: ["gm_planning", "gm_finance"],
  });

/**
 * Convenience: get the fan-out roles for a state, or `[]` if the state has no
 * fan-out.
 */
export function getReviewRolesForState(
  state: string,
): ReadonlyArray<string> {
  return REVIEW_ROLE_FANOUT[state] ?? [];
}
