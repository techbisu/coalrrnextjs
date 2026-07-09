/**
 * Math Engine — barrel (COALRR spec §2.1).
 *
 * The Math Engine is the platform's compliance auditor. Floats are BANNED;
 * every monetary and acreage quantity flows through `decimal.js`-backed Value
 * Objects. Calculators are pure, stateless, composable, and never touch Prisma.
 *
 * Re-exported here for ergonomic single-import usage:
 *   `import { MoneyValue, SolatiumCalculator } from "@/lib/engines";`
 */
export { InvalidCalculationInputException } from "./exceptions";
export {
  AcreageValue,
  EMPLOYMENT_GATE_ACRES,
  MoneyValue,
} from "./value-objects";
export {
  EscalationCalculator,
  LandCompensationEngine,
  NomineePoolThresholdCalculator,
  SolatiumCalculator,
} from "./calculators";
export { CompensationInput } from "./types";
export type {
  CalculatorContract,
  CompensationResult,
  MathPreviewResult,
  MoneyResult,
  NomineePoolThresholdResult,
} from "./types";
export { MathPreviewAction } from "./preview-action";
