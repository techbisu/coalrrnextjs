/**
 * Workflow Engine — Reusable transition guards (COALRR spec §1.3.3, §2.3).
 *
 * Guards are referenced by BOTH the workflow layer (to gate transitions) AND
 * the validation layer (to surface the same rule as a Zod issue). They are
 * pure functions of `GuardContext` — the caller pre-loads any DB state into
 * `ctx.data` so the engine itself stays Prisma-free.
 */
import { MoneyValue } from "@/lib/engines/math/value-objects";
import { AcreageValue, EMPLOYMENT_GATE_ACRES } from "@/lib/engines/math/value-objects";
import type { GuardContext, GuardResult, TransitionGuard } from "./types";

// ════════════════════════════════════════════════════════════════════════════
// WithinProjectBaselineGuard
// ════════════════════════════════════════════════════════════════════════════

/**
 * Guards the project-budget ceiling (spec §1.3.3 / Module 1 baseline lock).
 *
 * Reads `ctx.data.totalAward` and `ctx.data.budgetCeiling` (both INR strings,
 * or pre-built `MoneyValue`s). Allows the transition only if the cumulative
 * payroll total stays within the project's locked budget ceiling.
 *
 * Breach of this guard is the trigger for the `BoardEscalation` branch
 * (spec §2.3).
 */
export class WithinProjectBaselineGuard implements TransitionGuard {
  readonly name = "within_project_baseline";

  check(ctx: GuardContext): GuardResult {
    const data = ctx.data ?? {};
    const total = toMoney(data.totalAward);
    const ceiling = toMoney(data.budgetCeiling);
    if (!total || !ceiling) {
      return {
        ok: false,
        reason:
          "Baseline guard requires `totalAward` and `budgetCeiling` in context data",
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

/**
 * Inverse of `WithinProjectBaselineGuard` — fires the `BoardEscalation`
 * branch when the payroll breaches the project ceiling (spec §2.3).
 */
export class BaselineBreachedGuard implements TransitionGuard {
  readonly name = "baseline_breached";
  private readonly inner = new WithinProjectBaselineGuard();

  check(ctx: GuardContext): GuardResult {
    const inner = this.inner.check(ctx);
    if (inner.ok) {
      return {
        ok: false,
        reason: "Baseline is intact — escalation branch is not reachable",
      };
    }
    // Inner guard failed ⇒ breach present ⇒ this guard passes.
    return { ok: true };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ChecklistFullySatisfiedGuard
// ════════════════════════════════════════════════════════════════════════════

/**
 * Guards the mode-specific checklist (spec §2 — Land Acquisition).
 *
 * Constructed with a `checklistCode` (e.g. `"CL-1.1"` for direct-purchase,
 * `"CL-1.2"` for CBA Act). Reads `ctx.data.checklist` — a record mapping
 * item-key → `{ complete: boolean }`. Passes only when every item is complete.
 */
export class ChecklistFullySatisfiedGuard implements TransitionGuard {
  readonly name: string;
  constructor(public readonly checklistCode: string) {
    this.name = `checklist_satisfied:${checklistCode}`;
  }

  check(ctx: GuardContext): GuardResult {
    const checklist = (ctx.data?.checklist ?? {}) as Record<
      string,
      { complete?: boolean }
    >;
    const items = Object.entries(checklist);
    if (items.length === 0) {
      return {
        ok: false,
        reason: `Checklist ${this.checklistCode} has no items on record`,
      };
    }
    const incomplete = items.filter(([, v]) => v?.complete !== true);
    if (incomplete.length > 0) {
      return {
        ok: false,
        reason: `Checklist ${this.checklistCode} incomplete: ${incomplete
          .map(([k]) => k)
          .join(", ")}`,
      };
    }
    return { ok: true };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PlotNotAlreadyAcquiredGuard
// ════════════════════════════════════════════════════════════════════════════

/**
 * Guards against double-acquisition of a plot (spec §2 / Module 2).
 *
 * Reads `ctx.data.plotAcquired` (boolean). Passes only when the plot is not
 * already part of a sealed land schedule for the same project.
 */
export class PlotNotAlreadyAcquiredGuard implements TransitionGuard {
  readonly name = "plot_not_acquired";

  check(ctx: GuardContext): GuardResult {
    const acquired = Boolean(ctx.data?.plotAcquired);
    if (acquired) {
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

/**
 * Guards the 2.00-acre employment-quota gate (spec §1.3.3 / §9 / §10).
 *
 * Reads `ctx.data.pooledAcreage` (string or `AcreageValue`). Passes only when
 * the nominee pool's cumulative acreage meets the statutory threshold.
 */
export class ThresholdMetGuard implements TransitionGuard {
  readonly name = "threshold_met_2ac";
  readonly threshold = EMPLOYMENT_GATE_ACRES;

  check(ctx: GuardContext): GuardResult {
    const raw = ctx.data?.pooledAcreage;
    if (raw === undefined || raw === null) {
      return {
        ok: false,
        reason: "Threshold guard requires `pooledAcreage` in context data",
      };
    }
    const pooled = toAcreage(raw);
    if (!pooled) {
      return { ok: false, reason: "Invalid `pooledAcreage` value" };
    }
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

/**
 * Guards the `HqParallelVetting → DirectorConsent` transition (spec §2.3.2).
 *
 * Reads `ctx.data.reviewStatuses` — a record mapping role → `'pending' |
 * 'approved' | 'rejected'`. Passes only when EVERY fanned-out role has
 * decided (not pending). Rejection short-circuits to `ok: false`.
 */
export class ParallelReviewsCompletedGuard implements TransitionGuard {
  readonly name = "parallel_reviews_completed";
  constructor(public readonly roles: ReadonlyArray<string>) {}

  check(ctx: GuardContext): GuardResult {
    const statuses = (ctx.data?.reviewStatuses ?? {}) as Record<
      string,
      string
    >;
    for (const role of this.roles) {
      const status = statuses[role];
      if (!status || status === "pending") {
        return {
          ok: false,
          reason: `Parallel review pending: ${role}`,
        };
      }
      if (status === "rejected") {
        return {
          ok: false,
          reason: `Parallel review rejected by ${role}`,
        };
      }
    }
    return { ok: true };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// helpers
// ════════════════════════════════════════════════════════════════════════════

function toMoney(v: unknown): MoneyValue | null {
  if (v === undefined || v === null) return null;
  if (v instanceof MoneyValue) return v;
  if (typeof v === "string" || typeof v === "number") {
    try {
      return MoneyValue.from(v);
    } catch {
      return null;
    }
  }
  return null;
}

function toAcreage(v: unknown): AcreageValue | null {
  if (v === undefined || v === null) return null;
  if (v instanceof AcreageValue) return v;
  if (typeof v === "string" || typeof v === "number") {
    try {
      return AcreageValue.from(v);
    } catch {
      return null;
    }
  }
  return null;
}
