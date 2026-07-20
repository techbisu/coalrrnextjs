# Translation / i18n Rule

## Mandatory — no hardcoded user-facing text, anywhere
- EVERY page, component, and module MUST use the localization service for any
  user-facing text (labels, buttons, headings, messages, errors, status names, enum labels)
- NEVER hardcode a string like `"Approve"` or `"Pending"` directly in JSX/TSX —
  always resolve it through the translation function/hook (e.g. `t("proposal.status.pending")`)
- This applies to: UI components, form labels, table headers, toast/error messages,
  validation error messages (see validation.md), email/PDF templates, seed data labels

## Before creating any new page/component/module
1. search_graph for the existing translation hook/service (per src/localization/services/)
   — reuse it, never build a second i18n mechanism
2. Define translation keys using a consistent namespace: `<module>.<entity>.<field/label>`
   e.g. `proposal.status.approved`, `project.form.title`, `payroll.error.invalidDate`

## Seed — module-wise translation sync (mandatory)
- Every module with user-facing labels/enums/status values MUST have a matching section
  in prisma/seed/translations.seed.ts, organized by module — never a flat unstructured list
- Translation seed structure per module:
translations.seed.ts
└── <module>: { <entity>: { <field>: { en: "...", <other-locales>: "..." } } }
    - Whenever a new module/entity/field with user-facing text is added:
    1. Add the translation key usage in the component (t("<key>"))
    2. Add the corresponding entry in translations.seed.ts under that module's section
    3. Both MUST happen in the SAME task — a module without its translation seed entries
        is treated as an INCOMPLETE task, not a follow-up
    - NEVER skip translation seeding "for now" or leave a TODO — if genuinely not needed,
    state explicitly why (e.g. "internal-only field, never shown in UI")

    ## Enforcement check (self-report required)
    After building/editing any page or module, explicitly confirm:
    "Translations used: [list of keys]. Seed updated: [yes, section: <module>] or [no, reason: ...]"

    ## Forbidden
    - Never hardcode English (or any language) text directly in components
    - Never add a translation key without adding it to translations.seed.ts in the same task
    - Never create a per-module or per-page separate translation seed file — all translations
    stay in the single translations.seed.ts, organized by module section, so lookups stay
    centralized and consistent