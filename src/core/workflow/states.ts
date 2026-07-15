/**
 * Workflow Engine — State catalogue + transition graph (COALRR spec §2.3).
 *
 * Single source of truth for the `compensation_payroll` workflow. Both the
 * workflow engine and the UI stepper read from this map; the API layer uses
 * it to validate transitions.
 */
import {
  BaselineBreachedGuard,
  ChecklistFullySatisfiedGuard,
  ParallelReviewsCompletedGuard,
  WithinProjectBaselineGuard,
} from "./guards";
import type { Transition, WorkflowState, WorkflowStateMeta } from "./types";

// ════════════════════════════════════════════════════════════════════════════
// Shared guard instances (stateless, safe to share)
// ════════════════════════════════════════════════════════════════════════════

const baselineGuard = new WithinProjectBaselineGuard();
const baselineBreachedGuard = new BaselineBreachedGuard();
const clFullySatisfiedGuard = new ChecklistFullySatisfiedGuard("CL-1.1");
const parallelReviewsGuard = new ParallelReviewsCompletedGuard([
  "gm_planning",
  "gm_finance",
]);

// ════════════════════════════════════════════════════════════════════════════
// Transition definitions
// ════════════════════════════════════════════════════════════════════════════

const T_DRAFTING__UNIT: Transition = {
  name: "submit_to_unit",
  label: "Submit to Unit Office",
  from: "Drafting",
  to: "UnitSubmitted",
  role: "unit_office",
};

const T_UNIT__AREA: Transition = {
  name: "submit_to_area",
  label: "Forward to Area Vetting",
  from: "UnitSubmitted",
  to: "AreaVetting",
  role: "area_office",
  guard: clFullySatisfiedGuard,
};

const T_AREA__HQ: Transition = {
  name: "submit_to_hq_parallel",
  label: "Submit to HQ Parallel Vetting",
  from: "AreaVetting",
  to: "HqParallelVetting",
  role: "area_office",
  guard: baselineGuard,
};

const T_AREA__BOARD: Transition = {
  name: "escalate_to_board",
  label: "Escalate to Board (baseline breach)",
  from: "AreaVetting",
  to: "BoardEscalation",
  role: "area_office",
  guard: baselineBreachedGuard,
};

const T_HQ__DIRECTOR: Transition = {
  name: "advance_to_director",
  label: "Advance to Director Consent",
  from: "HqParallelVetting",
  to: "DirectorConsent",
  role: "director",
  guard: parallelReviewsGuard,
};

const T_DIRECTOR__CMD: Transition = {
  name: "advance_to_cmd",
  label: "Advance to CMD Approval",
  from: "DirectorConsent",
  to: "CmdApproved",
  role: "cmd",
  guard: baselineGuard,
};

const T_DIRECTOR__BOARD: Transition = {
  name: "escalate_to_board_from_director",
  label: "Escalate to Board (baseline breach)",
  from: "DirectorConsent",
  to: "BoardEscalation",
  role: "director",
  guard: baselineBreachedGuard,
};

const T_CMD__PUBLISHED: Transition = {
  name: "publish",
  label: "Publish Award",
  from: "CmdApproved",
  to: "Published",
  role: "cmd",
};

const T_BOARD__DIRECTOR: Transition = {
  name: "resolve_escalation",
  label: "Resolve Escalation → back to Director",
  from: "BoardEscalation",
  to: "DirectorConsent",
  role: "board",
};

// ════════════════════════════════════════════════════════════════════════════
// State metadata
// ════════════════════════════════════════════════════════════════════════════

/**
 * Full state catalogue for the compensation_payroll workflow.
 * `order` is the linear stepper position (BoardEscalation sits at order 3.5
 * visually because it branches off AreaVetting).
 */
export const COMPENSATION_PAYROLL_STATES: Readonly<
  Record<WorkflowState, WorkflowStateMeta>
> = Object.freeze({
  Drafting: {
    label: "Drafting",
    description:
      "Payroll is being assembled by the unit office. Lines can be added/edited freely.",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    icon: "FileEdit",
    order: 1,
    isTerminal: false,
    allowedTransitions: [T_DRAFTING__UNIT],
  },
  UnitSubmitted: {
    label: "Unit Submitted",
    description:
      "Submitted by the unit office. Awaiting area-office vetting & checklist review.",
    color: "bg-sky-100 text-sky-700 border-sky-300",
    icon: "Send",
    order: 2,
    isTerminal: false,
    allowedTransitions: [T_UNIT__AREA],
  },
  AreaVetting: {
    label: "Area Vetting",
    description:
      "Area office verifies plots, CL items, and baseline. May escalate to Board on breach.",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: "ShieldCheck",
    order: 3,
    isTerminal: false,
    allowedTransitions: [T_AREA__HQ, T_AREA__BOARD],
  },
  HqParallelVetting: {
    label: "HQ Parallel Vetting",
    description:
      "GM (Planning) and GM (Finance) review in parallel. Both must decide before advancing.",
    color: "bg-violet-100 text-violet-700 border-violet-300",
    icon: "GitBranch",
    order: 4,
    isTerminal: false,
    allowedTransitions: [T_HQ__DIRECTOR],
  },
  DirectorConsent: {
    label: "Director Consent",
    description: "Director reviews the consolidated award. May escalate on breach.",
    color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300",
    icon: "UserCheck",
    order: 5,
    isTerminal: false,
    allowedTransitions: [T_DIRECTOR__CMD, T_DIRECTOR__BOARD],
  },
  CmdApproved: {
    label: "CMD Approved",
    description: "CMD has approved the award. Ready for publication to Form-D ledger.",
    color: "bg-teal-100 text-teal-700 border-teal-300",
    icon: "Award",
    order: 6,
    isTerminal: false,
    allowedTransitions: [T_CMD__PUBLISHED],
  },
  Published: {
    label: "Published",
    description:
      "Award published to the immutable Form-D ledger. Transparency window starts.",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: "CheckCircle2",
    order: 7,
    isTerminal: true,
    allowedTransitions: [],
  },
  LimitBreached: {
    label: "Limit Breached (Form-XXII)",
    description: "Proposal exceeded project limits. Pending Board approval.",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: "AlertTriangle",
    order: 3.5,
    isTerminal: false,
    allowedTransitions: [],
  },
  BoardApproved: {
    label: "Board Approved",
    description: "Board has approved the deviation.",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: "CheckCircle",
    order: 3.6,
    isTerminal: false,
    allowedTransitions: [],
  },
  BoardEscalation: {
    label: "Board Escalation",
    description:
      "Project baseline breached. Board reviews and either re-approves (back to Director) or holds.",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: "AlertTriangle",
    order: 8,
    isTerminal: false,
    allowedTransitions: [T_BOARD__DIRECTOR],
  },
});

/** Ordered list (stepper-friendly). */
export const COMPENSATION_PAYROLL_ORDERED_STATES: ReadonlyArray<WorkflowState> =
  Object.freeze(
    (Object.keys(COMPENSATION_PAYROLL_STATES) as WorkflowState[]).sort(
      (a, b) =>
        COMPENSATION_PAYROLL_STATES[a].order -
        COMPENSATION_PAYROLL_STATES[b].order,
    ),
  );
