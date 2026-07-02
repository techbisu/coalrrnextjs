/**
 * COALRR Engines — top-level barrel (COALRR spec §2).
 *
 * Three engines:
 *   1. MathEngine     — compliance auditor (decimal.js, NO floats)
 *   2. WorkflowEngine — hybrid FSM + side-effect descriptors
 *   3. DocxEngine     — form-data projection & renderer registry
 *
 * All engines are pure, stateless, and Prisma-free. The caller (API route or
 * Livewire-equivalent React component) loads records and persists results;
 * engines never touch the database.
 *
 * @example
 *   import { MoneyValue, CompensationInput, LandCompensationEngine } from "@/lib/engines";
 *   const input = new CompensationInput({
 *     landValue: MoneyValue.from("1000000"),
 *     assetValue: MoneyValue.from("50000"),
 *     yearsSinceNotification: 3,
 *     multiplicationFactor: "1.0000",
 *   });
 *   const result = new LandCompensationEngine().calculate(input);
 */

// ── Math Engine ──────────────────────────────────────────────────────────────
export {
  AcreageValue,
  CompensationInput,
  EMPLOYMENT_GATE_ACRES,
  EscalationCalculator,
  InvalidCalculationInputException,
  LandCompensationEngine,
  MathPreviewAction,
  MoneyValue,
  NomineePoolThresholdCalculator,
  SolatiumCalculator,
} from "./math";
export type {
  CalculatorContract,
  CompensationResult,
  MathPreviewResult,
  MoneyResult,
  NomineePoolThresholdResult,
} from "./math";

// ── Workflow Engine ──────────────────────────────────────────────────────────
export {
  BaselineBreachedGuard,
  ChecklistFullySatisfiedGuard,
  COMPENSATION_PAYROLL_ORDERED_STATES,
  COMPENSATION_PAYROLL_STATES,
  getReviewRolesForState,
  ParallelReviewsCompletedGuard,
  PlotNotAlreadyAcquiredGuard,
  REVIEW_ROLE_FANOUT,
  ThresholdMetGuard,
  WorkflowEngine,
  WorkflowEventCatalog,
  WithinProjectBaselineGuard,
} from "./workflow";
export type {
  ActorRole,
  AttemptTransitionResult,
  GuardContext,
  GuardResult,
  RecordType,
  SideEffect,
  Transition,
  TransitionGuard,
  WorkflowEventName,
  WorkflowState,
  WorkflowStateMeta,
} from "./workflow";

// ── Docx Engine ──────────────────────────────────────────────────────────────
export {
  FormRendererRegistry,
  FormVIIProjector,
  formRendererRegistry,
  renderForm,
} from "./docx";
export type {
  FormDataProjector,
  FormRenderResult,
  FormVIIData,
  FormVIISignatoryRow,
  PayrollRecordForForm,
} from "./docx";
