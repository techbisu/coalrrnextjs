/**
 * Math Engine — DTOs & Calculator contracts (COALRR spec §2.1, §4.2.2).
 *
 * All Data Transfer Objects here are readonly (immutable). Calculators never
 * touch Prisma — they consume these pure DTOs and emit pure DTOs, which makes
 * them trivially testable and reusable on both server and client.
 */
import Decimal from "decimal.js";
import { InvalidCalculationInputException } from "./exceptions";
import { AcreageValue, MoneyValue } from "./value-objects";

// ════════════════════════════════════════════════════════════════════════════
// Calculator contract
// ════════════════════════════════════════════════════════════════════════════

/**
 * Contract implemented by every calculator in the Math Engine.
 *
 * Each calculator is pure & stateless — same input ⇒ same output, no side
 * effects. Composable by design so an orchestrator can chain them.
 *
 * Spec §2.1 — "the Math Engine is the system's compliance auditor".
 */
export interface CalculatorContract<TInput, TResult> {
  /** Identifier of the SOP formula this calculator implements. */
  readonly formulaCode: string;
  /** Run the calculation; never throws for valid input (validated upstream). */
  calculate(input: TInput): TResult;
}

// ════════════════════════════════════════════════════════════════════════════
// Compensation DTOs
// ════════════════════════════════════════════════════════════════════════════

/**
 * Validated, immutable input bundle for the Land Compensation calculators.
 *
 * Construction-time validation enforces spec §4.2.2 — "Calculators validate
 * their own DTO inputs at construction time". Any rule violation throws
 * `InvalidCalculationInputException` (negative money, non-numeric factor, etc).
 *
 * Spec §4 (Module 4) — Land Compensation Payroll.
 */
export class CompensationInput {
  readonly land_value: MoneyValue;
  readonly asset_value: MoneyValue;
  readonly years_since_notification: number;
  readonly multiplication_factor: string;

  constructor(args: {
    land_value: MoneyValue;
    asset_value: MoneyValue;
    years_since_notification: number;
    multiplication_factor: string;
  }) {
    if (!args.land_value) throwInvalid("land_value", "is required");
    if (!args.asset_value) throwInvalid("asset_value", "is required");
    if (args.land_value.isNegative()) throwInvalid("land_value", "must not be negative");
    if (args.asset_value.isNegative()) throwInvalid("asset_value", "must not be negative");

    if (
      typeof args.years_since_notification !== "number" ||
      !Number.isFinite(args.years_since_notification) ||
      args.years_since_notification < 0
    ) {
      throwInvalid(
        "years_since_notification",
        "must be a non-negative finite number",
      );
    }

    if (!args.multiplication_factor || args.multiplication_factor.trim() === "") {
      throwInvalid("multiplication_factor", "is required");
    }
    let factorDecimal: Decimal;
    try {
      factorDecimal = new Decimal(args.multiplication_factor);
    } catch {
      throwInvalid(
        "multiplication_factor",
        `Cannot parse "${args.multiplication_factor}" as a decimal`,
      );
      return; // unreachable — throwInvalid always throws
    }
    if (!factorDecimal.isFinite() || factorDecimal.lt(0)) {
      throwInvalid("multiplication_factor", "must be a finite, non-negative decimal");
    }

    this.land_value = args.land_value;
    this.asset_value = args.asset_value;
    this.years_since_notification = Math.floor(args.years_since_notification);
    this.multiplication_factor = args.multiplication_factor;
    Object.freeze(this);
  }
}

/** Result of a single calculator (solatium or escalation). */
export interface MoneyResult {
  /** The computed amount. */
  readonly amount: MoneyValue;
  /** SOP formula identifier, e.g. `"solatium_100pct"`. */
  readonly formula: string;
  /** Snapshot of the inputs that produced this amount (audit trail). */
  readonly inputs: Readonly<Record<string, string>>;
}

/** Composite result produced by the `LandCompensationEngine` orchestrator. */
export interface CompensationResult {
  readonly input: CompensationInput;
  readonly solatium: MoneyResult;
  readonly escalation: MoneyResult;
  /** land + asset + solatium + escalation (spec §4 total award). */
  readonly total: MoneyValue;
}

// ════════════════════════════════════════════════════════════════════════════
// Nominee Pool DTOs
// ════════════════════════════════════════════════════════════════════════════

/** Result of the 2.00-acre pooling-gate calculator. */
export interface NomineePoolThresholdResult {
  readonly pooled_acreage: AcreageValue;
  readonly threshold: AcreageValue;
  readonly hasCrossedThreshold: boolean;
  /** Zero or positive gap to the threshold (zero when crossed). */
  readonly remainingToThreshold: AcreageValue;
}

// ════════════════════════════════════════════════════════════════════════════
// UI-facing flat DTO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Flat DTO the React `MathPreviewPanel` renders. All values are pre-formatted
 * strings so the component stays dumb (no arithmetic on the client).
 */
export interface MathPreviewResult {
  readonly solatium: string;
  readonly escalation: string;
  readonly total: string;
  readonly breakdown: {
    readonly base: string;
    readonly solatium: string;
    readonly escalation: string;
  };
  /** Human-readable formula summary for the audit tooltip. */
  readonly formula: string;
}

// ════════════════════════════════════════════════════════════════════════════
// helpers
// ════════════════════════════════════════════════════════════════════════════

function throwInvalid(field: string, message: string): never {
  throw new InvalidCalculationInputException(field, message);
}
