/**
 * Math Engine — `MathPreviewAction` facade (COALRR spec §2.1.4).
 *
 * The React `MathPreviewPanel` component needs a single flat DTO to render.
 * This facade wraps the relevant orchestrator (today: `LandCompensationEngine`)
 * and produces a `MathPreviewResult`. Keeping this as a thin seam means the
 * UI layer never imports individual calculators — only this action — so the
 * SOP formulas can evolve without ripple changes in components.
 */
import { LandCompensationEngine } from "./calculators";
import { CompensationInput, MathPreviewResult } from "./types";

/**
 * Thin facade invoked by the `MathPreviewPanel` React component on every
 * keystroke in the payroll builder. Returns pre-formatted strings so the UI
 * does zero arithmetic.
 */
export class MathPreviewAction {
  private readonly engine: LandCompensationEngine;

  constructor(engine: LandCompensationEngine = new LandCompensationEngine()) {
    this.engine = engine;
  }

  /**
   * Recompute the full solatium + escalation + total preview.
   * Throws `InvalidCalculationInputException` if `input` is structurally bad —
   * the caller (UI) is expected to validate before invoking.
   */
  preview(input: CompensationInput): MathPreviewResult {
    const result = this.engine.calculate(input);
    const base = input.landValue.add(input.assetValue);
    return {
      solatium: result.solatium.amount.format(),
      escalation: result.escalation.amount.format(),
      total: result.total.format(),
      breakdown: {
        base: base.format(),
        solatium: result.solatium.amount.format(),
        escalation: result.escalation.amount.format(),
      },
      formula:
        "total = (land + asset) + solatium[100%×(land+asset)] + escalation[12%×land×years]",
    };
  }
}
