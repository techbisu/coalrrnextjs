/**
 * Workflow Engine — Reusable transition guards (COALRR spec §1.3.3, §2.3).
 *
 * Guards are pure functions of `GuardContext`. The caller pre-loads any DB
 * state into `ctx.data` so the engine stays Prisma-free.
 *
 * GUARD_REGISTRY maps the `guard_key` strings stored in `workflow_transitions`
 * DB rows to concrete guard instances. Add new guards here.
 */
import { MoneyValue } from "@/lib/engines/math/value-objects";
import { AcreageValue, EMPLOYMENT_GATE_ACRES } from "@/lib/engines/math/value-objects";
import type { GuardContext, GuardResult, TransitionGuard } from "./types";

// ════════════════════════════════════════════════════════════════════════════
// WithinProjectBaselineGuard
// ════════════════════════════════════════════════════════════════════════════

/**
 * Guards the project-budget ceiling (spec §1.3.3 / Module 1 baseline lock).
 * Reads `ctx.data.total_award` and `ctx.data.budgetCeiling`.
 * Breach triggers the `BoardEscalation` branch (spec §2.3).
 */
export class WithinProjectBaselineGuard implements TransitionGuard {
  readonly name = "within_project_baseline";

  check(ctx: GuardContext): GuardResult {
    const data = ctx.data ?? {};
    const total = toMoney(data.total_award);
    const ceiling = toMoney(data.budgetCeiling);
    if (!total || !ceiling) {
      return {
        ok: false,
        reason: "Baseline guard requires `total_award` and `budgetCeiling` in context data",
      };
    }
    if (total.compareTo(ceiling) > 0) {
      return {
        ok: false,
        reason: `Payroll total ${total.format()} exceeds project ceiling ${ceiling.format()}`,
      };
    }
    return { ok: true };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BaselineBreachedGuard (inverse — used to enter BoardEscalation)
// ════════════════════════════════════════════════════════════════════════════

export class BaselineBreachedGuard implements TransitionGuard {
  readonly name = "baseline_breached";
  private readonly inner = new WithinProjectBaselineGuard();

  check(ctx: GuardContext): GuardResult {
    const inner = this.inner.check(ctx);
    if (inner.ok) {
      return { ok: false, reason: "Baseline is intact — escalation branch is not reachable" };
    }
    return { ok: true };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ChecklistFullySatisfiedGuard
// ════════════════════════════════════════════════════════════════════════════

/**
 * Guards the mode-specific checklist (spec §2 — Land Acquisition).
 * Constructed with `checklistCode` (e.g. "CL-1.1"). Reads `ctx.data.checklist`.
 */
export class ChecklistFullySatisfiedGuard implements TransitionGuard {
  readonly name: string;
  constructor(public readonly checklistCode: string) {
    this.name = `checklist_satisfied:${checklistCode}`;
  }

  check(ctx: GuardContext): GuardResult {
    const checklist = (ctx.data?.checklist ?? {}) as Record<string, { complete?: boolean }>;
    const items = Object.entries(checklist);
    if (items.length === 0) {
      return { ok: false, reason: `Checklist ${this.checklistCode} has no items on record` };
    }
    const incomplete = items.filter(([, v]) => v?.complete !== true);
    if (incomplete.length > 0) {
      return {
        ok: false,
        reason: `Checklist ${this.checklistCode} incomplete: ${incomplete.map(([k]) => k).join(", ")}`,
      };
    }
    return { ok: true };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PlotNotAlreadyAcquiredGuard
// ════════════════════════════════════════════════════════════════════════════

/** Guards against double-acquisition of a plot (spec §2 / Module 2). */
export class PlotNotAlreadyAcquiredGuard implements TransitionGuard {
  readonly name = "plot_not_acquired";

  check(ctx: GuardContext): GuardResult {
    if (Boolean(ctx.data?.plotAcquired)) {
      return {
        ok: false,
        reason: "Plot is already part of a sealed land schedule (double acquisition blocked)",
      };
    }
    return { ok: true };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ThresholdMetGuard
// ════════════════════════════════════════════════════════════════════════════

/** Guards the 2.00-acre employment-quota gate (spec §1.3.3 / §9 / §10). */
export class ThresholdMetGuard implements TransitionGuard {
  readonly name = "threshold_met_2ac";
  readonly threshold = EMPLOYMENT_GATE_ACRES;

  check(ctx: GuardContext): GuardResult {
    const raw = ctx.data?.pooled_acreage;
    if (raw === undefined || raw === null) {
      return { ok: false, reason: "Threshold guard requires `pooled_acreage` in context data" };
    }
    const pooled = toAcreage(raw);
    if (!pooled) return { ok: false, reason: "Invalid `pooled_acreage` value" };
    if (!pooled.isGreaterThanOrEqualTo(this.threshold)) {
      return {
        ok: false,
        reason: `Pooled acreage ${pooled.format()} below threshold ${this.threshold.format()}`,
      };
    }
    return { ok: true };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ParallelReviewsCompletedGuard
// ════════════════════════════════════════════════════════════════════════════

/** Guards the HqParallelVetting → DirectorConsent transition (spec §2.3.2). */
export class ParallelReviewsCompletedGuard implements TransitionGuard {
  readonly name = "parallel_reviews_completed";
  constructor(public readonly roles: ReadonlyArray<string>) {}

  check(ctx: GuardContext): GuardResult {
    const statuses = (ctx.data?.reviewStatuses ?? {}) as Record<string, string>;
    for (const role of this.roles) {
      const status = statuses[role];
      if (!status || status === "pending") {
        return { ok: false, reason: `Parallel review pending: ${role}` };
      }
      if (status === "rejected" || status === "returned") {
        return { ok: false, reason: `Parallel review rejected/returned by ${role}` };
      }
    }
    return { ok: true };
  }

  /**
   * Short-circuit check: returns true immediately if ANY review department rejected/returned the proposal,
   * avoiding unnecessary pending review wait times.
   */
  hasAnyRejection(ctx: GuardContext): { isRejected: boolean; rejectedBy?: string } {
    const statuses = (ctx.data?.reviewStatuses ?? {}) as Record<string, string>;
    for (const role of this.roles) {
      const status = statuses[role];
      if (status === "rejected" || status === "returned") {
        return { isRejected: true, rejectedBy: role };
      }
    }
    return { isRejected: false };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GUARD_REGISTRY
// Maps the `guard_key` column in `workflow_transitions` DB rows to guard
// instances. Add new guards here — WorkflowTransitionLoader resolves by key.
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// ChecklistContextFreshnessGuard
// ════════════════════════════════════════════════════════════════════════════

export class ChecklistContextFreshnessGuard implements TransitionGuard {
  readonly name = "checklist_context_freshness";

  check(ctx: GuardContext): GuardResult {
    const isStale = Boolean(ctx.data?.isContextStale);
    if (isStale) {
      return {
        ok: false,
        reason: "Checklist context is stale (entity data modified). Re-evaluation required before forwarding.",
      };
    }
    return { ok: true };
  }
}

export const GUARD_REGISTRY: Record<string, TransitionGuard> = {
  WithinProjectBaseline:    new WithinProjectBaselineGuard(),
  BaselineBreached:         new BaselineBreachedGuard(),
  ChecklistFullySatisfied:  new ChecklistFullySatisfiedGuard("CL-1.1"),
  ChecklistContextFreshness: new ChecklistContextFreshnessGuard(),
  ParallelReviewsCompleted: new ParallelReviewsCompletedGuard(["gm_planning", "gm_safety", "gm_finance", "hod_legal"]),
  PlotNotAcquired:          new PlotNotAlreadyAcquiredGuard(),
  ThresholdMet2Ac:          new ThresholdMetGuard(),
}

// ════════════════════════════════════════════════════════════════════════════
// helpers
// ════════════════════════════════════════════════════════════════════════════

function toMoney(v: unknown): MoneyValue | null {
  if (v === undefined || v === null) return null;
  if (v instanceof MoneyValue) return v;
  if (typeof v === "string" || typeof v === "number") {
    try { return MoneyValue.from(v); } catch { return null; }
  }
  return null;
}

function toAcreage(v: unknown): AcreageValue | null {
  if (v === undefined || v === null) return null;
  if (v instanceof AcreageValue) return v;
  if (typeof v === "string" || typeof v === "number") {
    try { return AcreageValue.from(v); } catch { return null; }
  }
  return null;
}
