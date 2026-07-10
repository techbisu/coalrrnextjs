/**
 * Docx Engine — Form-data projection & renderer registry (COALRR spec §2.2).
 *
 * This is a minimal stub demonstrating the architecture: a `FormDataProjector`
 * projects a domain record into a structured form DTO, and the
 * `FormRendererRegistry` maps form codes to projectors. Actual `.docx`
 * generation (via docx-templater / carbone) is deferred — `renderForm`
 * returns `{ status: 'ready' }` with the projected data + template path so
 * a later task can plug in the templating step without touching the API surface.
 */

// ════════════════════════════════════════════════════════════════════════════
// Minimal record shape consumed by projectors
// ════════════════════════════════════════════════════════════════════════════

/**
 * Minimal view of a `compensation_payroll` with its lines, sufficient for
 * Form-VII projection. The real Prisma model has more fields — projectors
 * pick only what each form needs, keeping the DTOs lean and stable.
 */
export interface PayrollRecordForForm {
  id: string;
  payroll_code: string;
  project_id: string;
  state: string;
  lines: ReadonlyArray<{
    landowner_name: string;
    plot_reference: string;
    land_value: string;
    asset_value: string;
    solatium_amount: string;
    escalation_amount: string;
    total_award: string;
  }>;
  /** Lookup fields typically denormalised for forms. */
  mouzaName?: string;
  plot_number?: string;
  acquiringColliery?: string;
  adjacent_colliery?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Form-VII DTO
// ════════════════════════════════════════════════════════════════════════════

/** Row in the Form-VII signatory table. */
export interface FormVIISignatoryRow {
  readonly landowner_name: string;
  readonly plot_reference: string;
  readonly total_award: string;
  readonly solatium: string;
  readonly escalation: string;
}

/**
 * Projected Form-VII data (spec §2.2 — Award publication summary).
 * Form-VII is the per-payroll award summary published alongside Form-D ledger
 * entries; it lists each landowner with their award breakdown.
 */
export interface FormVIIData {
  readonly formCode: "form_vii";
  readonly mouzaName: string;
  readonly plot_number: string;
  readonly acquiringColliery: string;
  readonly adjacent_colliery: string;
  readonly generatedAt: string; // ISO 8601
  readonly signatoryRows: ReadonlyArray<FormVIISignatoryRow>;
}

// ════════════════════════════════════════════════════════════════════════════
// FormDataProjector contract
// ════════════════════════════════════════════════════════════════════════════

/**
 * Projector contract — takes a domain record and returns a form-shaped DTO
 * ready for templating. Spec §2.2 design: one projector per statutory form.
 */
export interface FormDataProjector<TData> {
  readonly formCode: string;
  project(record: PayrollRecordForForm): TData;
}

// ════════════════════════════════════════════════════════════════════════════
// FormVIIProjector implementation
// ════════════════════════════════════════════════════════════════════════════

/**
 * Projects a `compensation_payroll` into a `FormVIIData` DTO (spec §2.2).
 *
 * Form-VII is the consolidated award summary that accompanies Form-D ledger
 * publication. This projector extracts the signatory rows (one per landowner
 * line) plus the contextual header fields.
 */
export class FormVIIProjector implements FormDataProjector<FormVIIData> {
  readonly formCode = "form_vii";

  project(record: PayrollRecordForForm): FormVIIData {
    return {
      formCode: "form_vii",
      mouzaName: record.mouzaName ?? "—",
      plot_number: record.plot_number ?? "—",
      acquiringColliery: record.acquiringColliery ?? "—",
      adjacent_colliery: record.adjacent_colliery ?? "—",
      generatedAt: new Date().toISOString(),
      signatoryRows: record.lines.map((line) => ({
        landowner_name: line.landowner_name,
        plot_reference: line.plot_reference,
        total_award: line.total_award,
        solatium: line.solatium_amount,
        escalation: line.escalation_amount,
      })),
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Stub projector (for form codes not yet implemented) — declared BEFORE the
// registry that references it, to avoid temporal-dead-zone errors.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Placeholder projector for forms whose DTO is not yet modelled.
 * Returns the raw record so downstream tasks can plug in real projectors
 * without breaking the registry contract.
 */
class StubProjector implements FormDataProjector<unknown> {
  constructor(readonly formCode: string) {}
  project(record: PayrollRecordForForm): unknown {
    return {
      formCode: this.formCode,
      recordId: record.id,
      payroll_code: record.payroll_code,
      generatedAt: new Date().toISOString(),
      note: "Stub projection — real DTO pending implementation.",
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FormRendererRegistry
// ════════════════════════════════════════════════════════════════════════════

/** Result of `renderForm` — a render descriptor, not bytes. */
export interface FormRenderResult {
  readonly formCode: string;
  readonly data: unknown;
  readonly templatePath: string;
  readonly status: "ready";
}

/**
 * Registry mapping statutory form codes to their projector instances.
 *
 * Spec §2.2 — supported forms today: `form_vii`, `form_1a`, `form_d`,
 * `form_xi`. Only `form_vii` has a projector implemented; the others are
 * pre-registered as stubs so the registry shape is stable for downstream tasks.
 */
export class FormRendererRegistry {
  private readonly projectors = new Map<string, FormDataProjector<unknown>>();
  private readonly templatePaths = new Map<string, string>();

  constructor() {
    // Pre-register the canonical COALRR form codes.
    this.register("form_vii", new FormVIIProjector(), "templates/form_vii.docx");
    this.register("form_1a", new StubProjector("form_1a"), "templates/form_1a.docx");
    this.register("form_d", new StubProjector("form_d"), "templates/form_d.docx");
    this.register("form_xi", new StubProjector("form_xi"), "templates/form_xi.docx");
  }

  /** Register (or override) a projector for a form code. */
  register(
    formCode: string,
    projector: FormDataProjector<unknown>,
    templatePath: string,
  ): void {
    this.projectors.set(formCode, projector);
    this.templatePaths.set(formCode, templatePath);
  }

  /** Look up a projector by form code. */
  resolve(formCode: string): FormDataProjector<unknown> | undefined {
    return this.projectors.get(formCode);
  }

  /**
   * Render the form — projects the record into the form's DTO and returns a
   * render descriptor. Actual `.docx` byte generation is deferred (stub).
   */
  renderForm(formCode: string, record: PayrollRecordForForm): FormRenderResult {
    const projector = this.resolve(formCode);
    if (!projector) {
      throw new Error(`No projector registered for form code "${formCode}"`);
    }
    const data = projector.project(record);
    return {
      formCode,
      data,
      templatePath: this.templatePaths.get(formCode) ?? `templates/${formCode}.docx`,
      status: "ready",
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Top-level convenience: module-level singleton + free function
// ════════════════════════════════════════════════════════════════════════════

/** Process-wide registry instance. */
export const formRendererRegistry = new FormRendererRegistry();

/**
 * Convenience function — projects `record` into the form's DTO and returns
 * the render descriptor. Spec §2.2 — public entrypoint for the API layer.
 */
export function renderForm(
  formCode: string,
  record: PayrollRecordForForm,
): FormRenderResult {
  return formRendererRegistry.renderForm(formCode, record);
}
