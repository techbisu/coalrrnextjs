/**
 * Math Engine — Immutable Value Objects (COALRR spec §2.1.2).
 *
 * The Math Engine is the system's compliance auditor. Floats are BANNED — every
 * monetary and acreage quantity flows through these Value Objects, which wrap a
 * `decimal.js` Decimal stored internally as a string. This guarantees
 * arbitrary-precision arithmetic end-to-end (Prisma → engine → UI), mirroring
 * the original Laravel/BCMath + PostgreSQL NUMERIC(15,2) design.
 */
import Decimal from "decimal.js";
import { InvalidCalculationInputException } from "./exceptions";

// ════════════════════════════════════════════════════════════════════════════
// Indian-currency formatting helper
// ════════════════════════════════════════════════════════════════════════════

/**
 * Format a decimal string using the Indian numbering system (groups of 2
 * after the first 3 digits), e.g. `1234567.00` → `12,34,567.00`.
 *
 * Pure string manipulation — never crosses into IEEE-754 float territory.
 */
function formatIndianInteger(rawDigits: string): string {
  if (rawDigits.length <= 3) return rawDigits;
  const last3 = rawDigits.slice(-3);
  const rest = rawDigits.slice(0, -3);
  const groups: string[] = [];
  let r = rest;
  while (r.length > 0) {
    const take = r.length >= 2 ? 2 : r.length;
    groups.unshift(r.slice(-take));
    r = r.slice(0, -take);
  }
  return `${groups.join(",")},${last3}`;
}

// ════════════════════════════════════════════════════════════════════════════
// MoneyValue
// ════════════════════════════════════════════════════════════════════════════

/**
 * Immutable Value Object for monetary quantities (INR).
 *
 * Wraps a `decimal.js` Decimal stored as a string internally so that no
 * precision is lost across Prisma TEXT columns, JSON serialization, and the
 * UI. All arithmetic returns a NEW `MoneyValue` instance — the original is
 * never mutated.
 *
 * Spec §2.1.2 — "Floats are banned; use BCMath (here: decimal.js)".
 */
export class MoneyValue {
  /** Raw decimal string, e.g. `"1234567.00"`. */
  private readonly raw: string;

  private constructor(decimal: Decimal) {
    this.raw = decimal.toFixed(2);
    Object.freeze(this);
  }

  /**
   * Construct from any numeric-ish input (string | number | Decimal | MoneyValue).
   * Throws `InvalidCalculationInputException` on non-finite / non-numeric input.
   */
  static from(value: string | number | Decimal | MoneyValue): MoneyValue {
    if (value instanceof MoneyValue) return new MoneyValue(new Decimal(value.raw));
    let d: Decimal;
    try {
      d = new Decimal(value as string | number | Decimal);
    } catch {
      throw new InvalidCalculationInputException(
        "money",
        `Cannot parse "${String(value)}" as a decimal money value`,
      );
    }
    if (!d.isFinite()) {
      throw new InvalidCalculationInputException("money", "Money value must be finite");
    }
    return new MoneyValue(d);
  }

  /** Zero money constant, useful for accumulators. */
  static zero(): MoneyValue {
    return new MoneyValue(new Decimal(0));
  }

  /** The underlying Decimal (defensive copy). */
  toDecimal(): Decimal {
    return new Decimal(this.raw);
  }

  /** Canonical string form, e.g. `"1234567.00"`. Safe for Prisma persistence. */
  toString(): string {
    return this.raw;
  }

  /** Add another MoneyValue; returns a new instance. */
  add(other: MoneyValue): MoneyValue {
    return new MoneyValue(this.toDecimal().plus(other.toDecimal()));
  }

  /** Subtract another MoneyValue; returns a new instance. */
  subtract(other: MoneyValue): MoneyValue {
    return new MoneyValue(this.toDecimal().minus(other.toDecimal()));
  }

  /** Multiply by a scalar (string | number | Decimal); returns a new instance. */
  multiply(factor: string | number | Decimal): MoneyValue {
    return new MoneyValue(this.toDecimal().times(new Decimal(factor)));
  }

  /** Lexicographic comparison; returns -1 / 0 / 1. */
  compareTo(other: MoneyValue): number {
    return this.toDecimal().comparedTo(other.toDecimal());
  }

  /** True if this value equals zero. */
  isZero(): boolean {
    return this.toDecimal().isZero();
  }

  /** True if this value is negative. */
  isNegative(): boolean {
    return this.toDecimal().isNegative();
  }

  /**
   * Human-readable representation using Indian grouping and the ₹ symbol.
   * Example: `"₹12,34,567.00"`.
   */
  format(): string {
    const d = this.toDecimal();
    const sign = d.isNegative() ? "-" : "";
    const abs = d.abs().toFixed(2);
    const [intPart, fracPart] = abs.split(".");
    return `${sign}₹${formatIndianInteger(intPart)}.${fracPart}`;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AcreageValue
// ════════════════════════════════════════════════════════════════════════════

/**
 * Immutable Value Object for land acreage quantities.
 *
 * Same precision discipline as `MoneyValue` — backed by `decimal.js`, stored
 * as a string. Used by the 2.00-acre employment-quota gate (spec §1.3.3 / §10).
 */
export class AcreageValue {
  /** Raw decimal string at 4 dp, e.g. `"12.5000"`. */
  private readonly raw: string;

  private constructor(decimal: Decimal) {
    this.raw = decimal.toFixed(4);
    Object.freeze(this);
  }

  static from(value: string | number | Decimal | AcreageValue): AcreageValue {
    if (value instanceof AcreageValue) return new AcreageValue(new Decimal(value.raw));
    let d: Decimal;
    try {
      d = new Decimal(value as string | number | Decimal);
    } catch {
      throw new InvalidCalculationInputException(
        "acreage",
        `Cannot parse "${String(value)}" as a decimal acreage value`,
      );
    }
    if (!d.isFinite()) {
      throw new InvalidCalculationInputException("acreage", "Acreage value must be finite");
    }
    return new AcreageValue(d);
  }

  static zero(): AcreageValue {
    return new AcreageValue(new Decimal(0));
  }

  toDecimal(): Decimal {
    return new Decimal(this.raw);
  }

  toString(): string {
    return this.raw;
  }

  add(other: AcreageValue): AcreageValue {
    return new AcreageValue(this.toDecimal().plus(other.toDecimal()));
  }

  subtract(other: AcreageValue): AcreageValue {
    return new AcreageValue(this.toDecimal().minus(other.toDecimal()));
  }

  multiply(factor: string | number | Decimal): AcreageValue {
    return new AcreageValue(this.toDecimal().times(new Decimal(factor)));
  }

  compareTo(other: AcreageValue): number {
    return this.toDecimal().comparedTo(other.toDecimal());
  }

  isGreaterThanOrEqualTo(threshold: AcreageValue): boolean {
    return this.toDecimal().gte(threshold.toDecimal());
  }

  isLessThan(threshold: AcreageValue): boolean {
    return this.toDecimal().lt(threshold.toDecimal());
  }

  /**
   * Human-readable representation with 4-dp precision and the "acres" unit.
   * Example: `"12.5000 acres"`.
   */
  format(): string {
    return `${this.raw} acres`;
  }
}

/**
 * The statutory employment-quota threshold (spec §1.3.3 / §10).
 * Pools of ≥ 2.00 acres unlock the employment-application pathway.
 */
export const EMPLOYMENT_GATE_ACRES = AcreageValue.from("2.0000");
