/**
 * Math Engine — Calculators (COALRR spec §2.1, §4).
 *
 * Each calculator implements `CalculatorContract` and is pure & stateless.
 * The orchestrator (`LandCompensationEngine`) composes them.
 */
import Decimal from "decimal.js";
import {
  AcreageValue,
  EMPLOYMENT_GATE_ACRES,
  MoneyValue,
} from "./value-objects";
import {
  CalculatorContract,
  CompensationInput,
  CompensationResult,
  MoneyResult,
  NomineePoolThresholdResult,
} from "./types";

// ════════════════════════════════════════════════════════════════════════════
// SolatiumCalculator
// ════════════════════════════════════════════════════════════════════════════

/**
 * Solatium calculator — implements spec §4 / RFCTLARR Act solatium rule.
 *
 * **Formula:** `solatium = 100% × (Land Value + Asset Value)`
 *
 * Solatium is the statutory "compensation-for-compensation" premium paid on
 * top of the base award. It is computed on BOTH land and asset value (unlike
 * escalation, which is land-only).
 */
export class SolatiumCalculator
  implements CalculatorContract<CompensationInput, MoneyResult>
{
  readonly formulaCode = "solatium_100pct";

  calculate(input: CompensationInput): MoneyResult {
    const base = input.land_value.add(input.asset_value);
    // 100% ⇒ multiply by 1; expressed explicitly for audit clarity.
    const amount = base.multiply(input.multiplication_factor);
    return {
      amount,
      formula: this.formulaCode,
      inputs: {
        land_value: input.land_value.toString(),
        asset_value: input.asset_value.toString(),
        multiplication_factor: input.multiplication_factor,
        ratePct: "100",
      },
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EscalationCalculator
// ════════════════════════════════════════════════════════════════════════════

/**
 * Escalium calculator — implements spec §4 / RFCTLARR escalation rule.
 *
 * **Formula:** `escalation = 12% per annum × Land Value × years_since_notification`
 *
 * The SOP is explicit (§4): escalation accrues on the **BASE LAND VALUE ONLY**.
 * Assets (structures, trees, crops) are excluded — this is a frequent source of
 * audit findings, hence the dedicated calculator with its own formula code.
 */
export class EscalationCalculator
  implements CalculatorContract<CompensationInput, MoneyResult>
{
  readonly formulaCode = "escalation_12pct_land_only";
  /** Statutory annual escalation rate (12% p.a.). */
  static readonly RATE_PER_ANNUM = "0.12";

  calculate(input: CompensationInput): MoneyResult {
    // years_since_notification is already a non-negative integer post-validation.
    const years = new Decimal(input.years_since_notification);
    const landDec = input.land_value.toDecimal();
    // escalation = land × 0.12 × years
    const amount = MoneyValue.from(
      landDec.times(EscalationCalculator.RATE_PER_ANNUM).times(years),
    );
    return {
      amount,
      formula: this.formulaCode,
      inputs: {
        land_value: input.land_value.toString(),
        // explicitly recorded so auditors can verify asset exclusion
        asset_value: input.asset_value.toString(),
        assetExcluded: "true",
        ratePerAnnum: EscalationCalculator.RATE_PER_ANNUM,
        years_since_notification: String(input.years_since_notification),
      },
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LandCompensationEngine (orchestrator)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Orchestrator that composes `SolatiumCalculator` + `EscalationCalculator` and
 * produces the total award for a single payroll line.
 *
 * **Total Award** = land + asset + solatium + escalation (spec §4).
 *
 * Composable calculators + a thin orchestrator = the spec §2.1.3 design: "pure,
 * stateless, composable".
 */
export class LandCompensationEngine
  implements CalculatorContract<CompensationInput, CompensationResult>
{
  readonly formulaCode = "land_compensation_total";
  private readonly solatiumCalc: SolatiumCalculator;
  private readonly escalationCalc: EscalationCalculator;

  constructor(
    solatiumCalc: SolatiumCalculator = new SolatiumCalculator(),
    escalationCalc: EscalationCalculator = new EscalationCalculator(),
  ) {
    this.solatiumCalc = solatiumCalc;
    this.escalationCalc = escalationCalc;
  }

  calculate(input: CompensationInput): CompensationResult {
    const solatium = this.solatiumCalc.calculate(input);
    const escalation = this.escalationCalc.calculate(input);
    const total = input.land_value
      .add(input.asset_value)
      .add(solatium.amount)
      .add(escalation.amount);
    return { input, solatium, escalation, total };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// NomineePoolThresholdCalculator
// ════════════════════════════════════════════════════════════════════════════

/**
 * Nominee-pool threshold calculator — implements the 2.00-acre employment-quota
 * gate (spec §1.3.3 / §9 / §10).
 *
 * Sums the individual share acres of all Form-I claims that nominated the same
 * person, then compares the pool against the statutory 2.00-acre threshold.
 * Crossing the threshold unlocks the employment-application pathway.
 *
 * Pure & stateless: the caller fetches the share list from Prisma, the
 * calculator only does the math.
 */
export class NomineePoolThresholdCalculator {
  /** Statutory threshold (2.00 acres). */
  readonly threshold: AcreageValue = EMPLOYMENT_GATE_ACRES;

  /**
   * @param share_acres list of share-acre strings contributed by Form-I claims.
   */
  calculate(share_acres: ReadonlyArray<string>): NomineePoolThresholdResult {
    const sum = share_acres.reduce(
      (acc, s) => acc.add(AcreageValue.from(s)),
      AcreageValue.zero(),
    );
    const hasCrossedThreshold = sum.isGreaterThanOrEqualTo(this.threshold);
    const remaining = hasCrossedThreshold
      ? AcreageValue.zero()
      : this.threshold.subtract(sum);
    return {
      pooled_acreage: sum,
      threshold: this.threshold,
      hasCrossedThreshold,
      remainingToThreshold: remaining,
    };
  }
}
