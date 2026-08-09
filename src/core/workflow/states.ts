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
  label: "Submit for Colliery & Unit Office Verification",
  from: "Drafting",
  to: "UnitSubmitted",
  role: "unit_office",
};

const T_UNIT__RETURN: Transition = {
  name: "return_to_unit",
  label: "Verify Annexure Plots & Forward Back to Initiating Unit",
  from: "UnitSubmitted",
  to: "Drafting",
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

const T_HQ_PLANNING__GMLRE: Transition = {
  name: "advance_to_gmlre_planning",
  label: "Verified & approved",
  from: "HqParallelVetting",
  to: "GmLreReview",
  role: "gm_planning",
  guard: parallelReviewsGuard,
};

const T_HQ_FINANCE__GMLRE: Transition = {
  name: "advance_to_gmlre_finance",
  label: "Verified & approved",
  from: "HqParallelVetting",
  to: "GmLreReview",
  role: "gm_finance",
  guard: parallelReviewsGuard,
};

const T_HQ_SAFETY__GMLRE: Transition = {
  name: "advance_to_gmlre_safety",
  label: "Verified & approved",
  from: "HqParallelVetting",
  to: "GmLreReview",
  role: "gm_safety",
  guard: parallelReviewsGuard,
};

const T_HQ_LEGAL__GMLRE: Transition = {
  name: "advance_to_gmlre_legal",
  label: "Verified & approved",
  from: "HqParallelVetting",
  to: "GmLreReview",
  role: "hod_legal",
  guard: parallelReviewsGuard,
};

const T_HQ__GMLRE: Transition = {
  name: "advance_to_gmlre",
  label: "Advance to GM LRE Consolidation",
  from: "HqParallelVetting",
  to: "GmLreReview",
  role: "gm_lre",
  guard: parallelReviewsGuard,
};

const T_GMLRE__SEC7_PREP: Transition = {
  name: "advance_to_sec7_prep",
  label: "Advance to Section 7 Preparation (Automated)",
  from: "GmLreReview",
  to: "Sec7Preparation",
  role: "gm_lre",
};

const T_GMLRE__DOCKET: Transition = {
  name: "issue_docket",
  label: "Issue Proposal Docket",
  from: "GmLreReview",
  to: "DocketIssued",
  role: "gm_lre",
};

const T_DOCKET__MANUAL: Transition = {
  name: "approve_manually",
  label: "Manual Approval & Sign-off",
  from: "DocketIssued",
  to: "ManuallyApproved",
  role: "gm_lre",
};

const T_MANUAL__PUBLISHED: Transition = {
  name: "publish",
  label: "Publish Award (Manual Forwarding Complete)",
  from: "ManuallyApproved",
  to: "Published",
  role: "gm_lre",
};

const T_GMLRE__PUBLISHED: Transition = {
  name: "publish_direct",
  label: "Publish Award (Direct)",
  from: "GmLreReview",
  to: "Published",
  role: "gm_lre",
};

const T_BOARD__GMLRE: Transition = {
  name: "resolve_escalation",
  label: "Resolve Escalation → back to GM LRE",
  from: "BoardEscalation",
  to: "GmLreReview",
  role: "board",
};

const T_AREA__RETURN_UNIT: Transition = {
  name: "return_to_unit",
  label: "Return to Initiating Unit for Revision",
  from: "AreaVetting",
  to: "Drafting",
  role: "area_office",
};

const T_HQ_PLANNING__RETURN_AREA: Transition = {
  name: "return_to_area",
  label: "Return to Area Office for Revision",
  from: "HqParallelVetting",
  to: "AreaVetting",
  role: "gm_planning",
};

const T_HQ_FINANCE__RETURN_AREA: Transition = {
  name: "return_to_area_finance",
  label: "Return to Area Office for Revision",
  from: "HqParallelVetting",
  to: "AreaVetting",
  role: "gm_finance",
};

const T_GMLRE__RETURN_HQ: Transition = {
  name: "return_to_hq",
  label: "Return to HQ Vetting for Revision",
  from: "GmLreReview",
  to: "HqParallelVetting",
  role: "gm_lre",
};

const T_BOARD__RETURN_AREA: Transition = {
  name: "return_to_area_from_board",
  label: "Return to Area Office for Revision",
  from: "BoardEscalation",
  to: "AreaVetting",
  role: "board",
};

const T_UNIT__CROSS_COLLIERY: Transition = {
  name: "forward_for_cross_colliery",
  label: "Forward for Cross-Colliery Boundary & Form-VII Vetting",
  from: "UnitSubmitted",
  to: "CrossCollieryVerification",
  role: "unit_office",
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
      "Plot schedule & compliance items assembled by initiating unit. Requires cross-colliery verification & 100% CL-1 completion before forwarding to Area.",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    icon: "FileEdit",
    order: 1,
    isTerminal: false,
    allowedTransitions: [T_DRAFTING__UNIT],
  },
  UnitSubmitted: {
    label: "Unit Submitted & Cross-Colliery Verification",
    description:
      "Plot schedule forwarded to adjacent colliery for overlap checking, Annexure A/B/C tagging & Form-VII reconciliation.",
    color: "bg-sky-100 text-sky-700 border-sky-300",
    icon: "Send",
    order: 2,
    isTerminal: false,
    allowedTransitions: [T_UNIT__CROSS_COLLIERY],
  },
  CrossCollieryVerification: {
    label: "Cross-Colliery Verification",
    description: "Plot schedule verified across adjacent colliery boundaries for LIS overlaps.",
    color: "bg-cyan-100 text-cyan-700 border-cyan-300",
    icon: "GitCompare",
    order: 2.5,
    isTerminal: false,
    allowedTransitions: [T_UNIT__AREA, T_UNIT__RETURN],
  },
  AreaVetting: {
    label: "Area Vetting",
    description:
      "Area office verifies plots, CL items, and baseline. May escalate to Board on breach.",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: "ShieldCheck",
    order: 3,
    isTerminal: false,
    allowedTransitions: [T_AREA__HQ, T_AREA__BOARD, T_AREA__RETURN_UNIT],
  },
  HqParallelVetting: {
    label: "HQ Parallel Vetting",
    description:
      "GM (Planning), GM (Safety), GM (Finance), and HOD (Legal) review in parallel. All must decide before advancing.",
    color: "bg-violet-100 text-violet-700 border-violet-300",
    icon: "GitBranch",
    order: 4,
    isTerminal: false,
    allowedTransitions: [T_HQ_PLANNING__GMLRE, T_HQ_FINANCE__GMLRE, T_HQ_SAFETY__GMLRE, T_HQ_LEGAL__GMLRE, T_HQ__GMLRE, T_HQ_PLANNING__RETURN_AREA, T_HQ_FINANCE__RETURN_AREA],
  },
  HqVetting: {
    label: "HQ Vetting",
    description: "Headquarters level vetting and clearance.",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    icon: "Building",
    order: 4.5,
    isTerminal: false,
    allowedTransitions: [T_HQ__GMLRE],
  },
  GmLreReview: {
    label: "GM LRE Consolidation",
    description: "GM (LRE) consolidates recommendations and advances the file to terminal state.",
    color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300",
    icon: "UserCheck",
    order: 5,
    isTerminal: false,
    allowedTransitions: [T_GMLRE__DOCKET, T_GMLRE__PUBLISHED, T_GMLRE__RETURN_HQ, T_GMLRE__SEC7_PREP],
  },
  Sec7Preparation: {
    label: "Section 7 Preparation",
    description: "Section 4 Notification completed. Preparing for Section 7 Gazette.",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: "FileText",
    order: 5.1,
    isTerminal: false,
    allowedTransitions: [], // Transitions from here depend on further workflow modeling
  },
  DocketIssued: {
    label: "Docket Issued",
    description: "Proposal docket generated and issued for final vetting and execution.",
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    icon: "FileText",
    order: 5.5,
    isTerminal: false,
    allowedTransitions: [T_DOCKET__MANUAL],
  },
  ManuallyApproved: {
    label: "Manually Approved",
    description: "Manual sign-off and approval completed prior to ledger publishing.",
    color: "bg-teal-100 text-teal-700 border-teal-300",
    icon: "Award",
    order: 5.8,
    isTerminal: false,
    allowedTransitions: [T_MANUAL__PUBLISHED],
  },
  Published: {
    label: "Published",
    description:
      "Digital workflow complete. Forwarded manually. Award published to the immutable Form-D ledger.",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: "CheckCircle2",
    order: 6,
    isTerminal: true,
    allowedTransitions: [],
  },
  Approved: {
    label: "Approved",
    description: "Proposal fully approved.",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: "CheckCircle",
    order: 6.5,
    isTerminal: true,
    allowedTransitions: [],
  },
  Rejected: {
    label: "Rejected",
    description: "Proposal rejected during vetting.",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: "XCircle",
    order: 7,
    isTerminal: true,
    allowedTransitions: [],
  },
  Cancelled: {
    label: "Cancelled",
    description: "Proposal cancelled by initiator.",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    icon: "Ban",
    order: 8,
    isTerminal: true,
    allowedTransitions: [],
  },
  Closed: {
    label: "Closed",
    description: "Proposal file closed.",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: "Archive",
    order: 9,
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
      "Project baseline breached. Board reviews and either re-approves (back to GM LRE) or holds.",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: "AlertTriangle",
    order: 3.5,
    isTerminal: false,
    allowedTransitions: [T_BOARD__GMLRE, T_BOARD__RETURN_AREA],
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
