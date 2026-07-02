/**
 * Math Engine — Exception types (COALRR spec §4.2.2).
 *
 * Calculators validate their own DTO inputs at construction time and throw
 * `InvalidCalculationInputException` for any rule violation (negative values,
 * non-numeric strings, missing required fields). The Math Engine NEVER silently
 * coerces bad input — it fails loudly so the UI layer can surface the error.
 */

/**
 * Thrown when a calculator receives input that violates a structural or
 * business rule (e.g. negative money, non-numeric multiplication factor).
 *
 * Spec §4.2.2 — "Calculators validate their own DTO inputs at construction time".
 */
export class InvalidCalculationInputException extends Error {
  /** Machine-readable field path that failed validation, e.g. `landValue`. */
  readonly field: string;

  constructor(field: string, message: string) {
    super(`[InvalidCalculationInput] ${field}: ${message}`);
    this.name = "InvalidCalculationInputException";
    this.field = field;
  }
}
