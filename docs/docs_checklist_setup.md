# Checklist Setup Guide

> [!IMPORTANT]
> **Read AGENTS.md before touching anything.**
> Key rules that apply here:
> - `MODULE_CODES.X` from `module-codes.config.ts` — never raw strings in code
> - SQL only for manual review — do NOT auto-run `prisma migrate dev`
> - After DB change: `npx prisma db pull && npx prisma generate`
> - Checklist items live in `master.checklist_requirement_rule` (note: `master` schema, not `public`)

---

## How the Checklist Engine Works

The checklist system is driven by a single table:

```
master.checklist_requirement_rule  → defines what items exist, their type, conditions, display order
public.checklist_submission        → stores user's responses/completions per entity
```

When `GenericChecklistWorkspace` renders, it:
1. Loads rules for `module_code = MODULE_CODES.YOUR_MODULE` from `checklist_requirement_rule`
2. Evaluates `show_if` JSON rule against the entity's context (from `process_definition.config_json`)
3. Renders only items where `show_if` passes (or where `show_if` is null = always show)
4. Marks items green/complete when a `checklist_submission` row exists with `status = 'COMPLETED'`

**Zero TypeScript changes for new checklist items — only DB inserts.**

---

## The `checklist_requirement_rule` Table

| Column | Type | Description |
|---|---|---|
| `chk_code` | `VARCHAR(50)` | **Unique** machine code. Convention: `CL-<MODULE>-<SEQ>` e.g. `CL-FC-01` |
| `module_code` | `VARCHAR(50)` | Must equal `MODULE_CODES.YOUR_MODULE` exactly |
| `requirement_type` | `VARCHAR(30)` | See types below |
| `title` | `VARCHAR(255)` | Item label shown in the UI checklist |
| `description` | `TEXT` | Help text / tooltip |
| `input_schema` | `Json` | Type-specific config (template code, options list, min/max, etc.) |
| `show_if` | `Json` | Conditional visibility rule — `null` means always show |
| `inherit_from` | `Json` | Copy value from parent entity context |
| `sync_to_parent` | `Json` | Write submitted value back to parent entity |
| `min_responses_required` | `INT` | How many submissions needed to mark complete (default 1) |
| `is_mandatory` | `BOOLEAN` | If `true`, transition guards block until this item is submitted |
| `display_order` | `INT` | Sort order within the checklist |
| `is_active` | `BOOLEAN` | Set `false` to soft-delete |

---

| `generated_document` | Generates a DOCX from template | `{ "template_code": "FORM_XXII_TEMPLATE", "label": "Generate Form-XXII" }` |

---

## Background DOCX Generation & Signature Engine

For `generated_document` checklist items, document rendering is processed asynchronously in the background via `JobDispatcherService`.

### 1. Status Lifecycle
- `DRAFT` / `INCOMPLETE`: Initial editable workspace or ungenerated template.
- `QUEUED`: Request claimed atomically by server (`updateMany({ where: { status: { notIn: ['QUEUED', 'GENERATING'] } }, data: { status: 'QUEUED' } })`) and job enqueued.
- `GENERATING`: Worker actively resolving data via `ResolverRegistry` and rendering buffer using `DocxGeneratorEngine` (`Docxtemplater` + `PizZip`).
- `COMPLETED`: Document generated and all required digital signatures applied.
- `FAILED`: Render/upload error caught safely.

### 2. Safe Post-Upload File Replacement
When regenerating a document, `GenerateDocumentUseCase` captures the `oldFileId`, uploads the new generated `.docx` buffer via `uploadFileUseCase`, updates `document_instance.generated_docx_path` with `newFileId`, and ONLY THEN cleans up `oldFileId`. If generation fails, the previous valid document remains intact.

### 3. Dispatch Fallback Safety
If `jobDispatcher.dispatch()` fails after an atomic `QUEUED` claim, the API conditionally rolls `status` back to `DRAFT` (only if still `QUEUED`), ensuring the document is never permanently locked.

### 4. Realtime Updates
Upon generation completion, `generateDocument.job.ts` writes a `DOCUMENT_GENERATED` event to `db.outbox_events`. The SSE stream pushes this event to client browsers, automatically refreshing `<GeneratedDocumentField />` badges and invalidating TanStack Query caches without page reload.

---

## Step 0 — Ensure Module Code is Registered

```ts
// src/core/config/module-codes.config.ts
export const MODULE_CODES = {
  // ...existing...
  FOREST_CLEARANCE: 'FOREST_CLEARANCE',  // ← add new module here FIRST
} as const

export const CHECKABLE_ENTITY_TYPES = {
  // ...existing...
  FOREST_CLEARANCE: 'forest_clearance',  // ← add entity type
} as const
```

---

## Step 1 — Insert Basic Checklist Items (No Conditions)

These items always show regardless of entity state.

```sql
-- Always-visible mandatory checklist items for Forest Clearance module

INSERT INTO master.checklist_requirement_rule
  (chk_code, module_code, requirement_type, title, description, input_schema,
   show_if, is_mandatory, display_order, is_active, entry_by)
VALUES

  -- Item 1: Upload the application form (document upload)
  ('CL-FC-01', 'FOREST_CLEARANCE', 'document',
   'Upload Signed Application Form',
   'Upload the signed forest clearance application (Part-I). Must be on official letterhead.',
   '{"label": "Upload Application Form (PDF)"}',
   NULL,          -- show_if = NULL means: always show
   true, 10, true, 'system'),

  -- Item 2: Confirm survey complete (boolean)
  ('CL-FC-02', 'FOREST_CLEARANCE', 'boolean',
   'Confirm Demarcation Survey Completed',
   'The forest boundary demarcation survey has been conducted and certified.',
   '{"label": "Survey Completed", "trueLabel": "Yes - Completed", "falseLabel": "No"}',
   NULL,
   true, 20, true, 'system'),

  -- Item 3: Record land area (number input)
  ('CL-FC-03', 'FOREST_CLEARANCE', 'number',
   'Total Forest Area (in hectares)',
   'Enter the precise forest area being diverted as per the survey report.',
   '{"label": "Forest Area (ha)", "min": 0.01, "max": 50000}',
   NULL,
   true, 30, true, 'system'),

  -- Item 4: Date of DFO inspection (date picker)
  ('CL-FC-04', 'FOREST_CLEARANCE', 'date',
   'Date of DFO Field Inspection',
   'Record the date on which the Divisional Forest Officer conducted the site inspection.',
   '{"label": "Inspection Date"}',
   NULL,
   true, 40, true, 'system'),

  -- Item 5: Upload DFO report (document)
  ('CL-FC-05', 'FOREST_CLEARANCE', 'document',
   'Upload DFO Inspection Report',
   'Signed inspection report from the DFO after site visit.',
   '{"label": "Upload DFO Report (PDF)"}',
   NULL,
   true, 50, true, 'system'),

  -- Item 6: Auto-generated DOCX Form-XXII document (generated_document)
  ('CL-FC-06', 'FOREST_CLEARANCE', 'generated_document',
   'Generate Form-XXII Draft Clearance Package',
   'System-generated Form-XXII document package compiled from plot & land schedule data.',
   '{"template_code": "FORM_XXII", "label": "Generate Form-XXII Draft", "buttonText": "Generate Form-XXII"}',
   NULL,
   true, 60, true, 'system');
```

---

## Step 1b — Manual Submission SQL Insert Example

To manually seed or test a completed checklist submission for an entity:

```sql
-- Insert a completed submission for a document checklist item
INSERT INTO public.checklist_submission
  (id, chk_code, checkable_id, checkable_type, status, user_id, user_input_json, updt_ts)
VALUES
  (gen_random_uuid(),
   'CL-FC-01',                               -- chk_code from checklist_requirement_rule
   '11111111-1111-1111-1111-111111111111',   -- entity ID (e.g., Proposal ID)
   'forest_clearance',                        -- CHECKABLE_ENTITY_TYPES.FOREST_CLEARANCE
   'COMPLETED',                               -- status: 'COMPLETED' or 'PENDING'
   'user_system_admin',
   '{"file_id": "file_fc_01_pdf", "file_name": "Forest_Application_Signed.pdf"}',
   NOW());
```
```

---

## Step 2 — Conditional Items (`show_if`)

`show_if` is a JSON rule that is evaluated against the entity context resolved by
`GenericEntityContextResolver` (reading from `process_definition.config_json.context_fields`).

### `show_if` Rule Format

```json
// Single condition
{ "field": "has_wildlife_sanctuary", "op": "eq", "value": true }

// AND — all conditions must be true
{ "and": [
  { "field": "forest_type", "op": "eq", "value": "RESERVED" },
  { "field": "land_area_ha", "op": "gt", "value": 5 }
]}

// OR — any one condition must be true
{ "or": [
  { "field": "has_wildlife_sanctuary", "op": "eq", "value": true },
  { "field": "land_area_ha", "op": "gt", "value": 40 }
]}
```

### Supported operators

| `op` | Meaning |
|---|---|
| `eq` | Equals |
| `neq` | Not equals |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `in` | Value is in array |
| `nin` | Value is not in array |
| `exists` | Field is not null/undefined |

---

### Example: Conditional Items Based on Entity Context

These items only appear when specific conditions are met.

```sql
INSERT INTO master.checklist_requirement_rule
  (chk_code, module_code, requirement_type, title, description, input_schema,
   show_if, is_mandatory, display_order, is_active, entry_by)
VALUES

  -- Item 6: Only show if land is near a wildlife sanctuary
  ('CL-FC-06', 'FOREST_CLEARANCE', 'document',
   'Upload Wildlife Warden NOC',
   'Required when the project site is within 10km of a wildlife sanctuary or national park.',
   '{"label": "Upload Wildlife NOC (PDF)"}',
   '{"field": "has_wildlife_sanctuary", "op": "eq", "value": true}',
   -- ↑ Only shown when entity.has_wildlife_sanctuary === true
   true, 60, true, 'system'),

  -- Item 7: Only show for large diversions (> 5 hectares)
  ('CL-FC-07', 'FOREST_CLEARANCE', 'document',
   'Upload Compensatory Afforestation (CA) Plan',
   'Required for forest diversions exceeding 5 hectares. Must be approved by CAMPA.',
   '{"label": "Upload CA Plan (PDF)"}',
   '{"field": "land_area_ha", "op": "gt", "value": 5}',
   -- ↑ Only shown when entity.land_area_ha > 5
   true, 70, true, 'system'),

  -- Item 8: Only show for reserved forests (not protected forests)
  ('CL-FC-08', 'FOREST_CLEARANCE', 'select',
   'Select Type of Forest Division (Reserved Forest only)',
   'Classification applies only to Reserved Forest categories.',
   '{"label": "Forest Division Type", "options": ["Division A", "Division B", "Division C"]}',
   '{"field": "forest_type", "op": "eq", "value": "RESERVED"}',
   -- ↑ Only shown when entity.forest_type === 'RESERVED'
   false, 80, true, 'system'),

  -- Item 9: Only show when BOTH conditions are true (AND)
  ('CL-FC-09', 'FOREST_CLEARANCE', 'document',
   'Upload Tribal Rights Certificate (Section 7 of FRA)',
   'Required when area exceeds 5ha AND has scheduled tribe land.',
   '{"label": "Upload FRA Certificate (PDF)"}',
   '{"and": [{"field": "land_area_ha", "op": "gt", "value": 5}, {"field": "has_tribal_land", "op": "eq", "value": true}]}',
   true, 90, true, 'system'),

  -- Item 10: Show for EITHER condition (OR)
  ('CL-FC-10', 'FOREST_CLEARANCE', 'document',
   'Upload Board Resolution or CMD Approval',
   'Required for wildlife sanctuary proximity OR large-scale diversions > 40ha.',
   '{"label": "Upload Board/CMD Approval (PDF)"}',
   '{"or": [{"field": "has_wildlife_sanctuary", "op": "eq", "value": true}, {"field": "land_area_ha", "op": "gt", "value": 40}]}',
   true, 100, true, 'system');
```

---

## Step 3 — Generated Document Items (DocxEngine Integration)

For items that generate a DOCX file from a template, use `requirement_type = 'generated_document'`.
The `template_code` in `input_schema` must match a row in `public.document_template`.

```sql
INSERT INTO master.checklist_requirement_rule
  (chk_code, module_code, requirement_type, title, description, input_schema,
   show_if, is_mandatory, display_order, is_active, entry_by)
VALUES
  -- Generated document: auto-fills Form-FC-Part-II from entity context
  ('CL-FC-11', 'FOREST_CLEARANCE', 'generated_document',
   'Generate Part-II Proposal (Form FC)',
   'System-generated Part-II application using project data. Review and download before submission.',
   '{"template_code": "FORM_FC_PART2_TEMPLATE", "label": "Generate Part-II Form"}',
   -- ↑ template_code must exist in public.document_template
   NULL,
   true, 110, true, 'system');
```

The `GenericEntityContextResolver` provides the variables to the DocxEngine automatically
by reading `process_definition.config_json.context_fields`.

---

## Step 4 — Configure Entity Context for `show_if` Evaluation

For `show_if` conditions to work, `process_definition.config_json` must declare
which table fields to expose as context variables:

```sql
-- Ensure process_definition exists and has correct context_fields
INSERT INTO public.process_definition
  (process_code, module_code, name, version, status, is_active, config_json, entry_by)
VALUES (
  'FOREST_CLEARANCE',
  'FOREST_CLEARANCE',    -- MODULE_CODES.FOREST_CLEARANCE
  'Forest Clearance Application Process',
  1, 'ACTIVE', true,
  '{
    "context_table": "forest_clearance_application",
    "context_id_field": "application_id",
    "context_fields": [
      "land_area_ha",
      "forest_type",
      "has_wildlife_sanctuary",
      "has_tribal_land",
      "district_code"
    ]
  }',
  'system'
)
ON CONFLICT (process_code) DO UPDATE SET config_json = EXCLUDED.config_json;
-- ↑ The show_if engine reads these exact field names from the entity table
```

> [!NOTE]
> The `context_fields` names in `config_json` must exactly match the column names in `context_table`.
> The `show_if` rule `{ "field": "has_wildlife_sanctuary", ... }` looks up this same field name.

---

## Step 5 — Checklist Submission Flow (How Completion Is Tracked)

When a user submits a checklist item, a row is created in `public.checklist_submission`:

```
checkable_type  = CHECKABLE_ENTITY_TYPES.FOREST_CLEARANCE  ('forest_clearance')
checkable_id    = <the entity UUID>
requirement_id  = <chk_id UUID from checklist_requirement_rule>
status          = 'COMPLETED' | 'SUBMITTED' | 'APPROVED'
```

An item is considered **complete** when `status IN ('COMPLETED', 'SUBMITTED', 'APPROVED')`.

The `ChecklistFullySatisfied` guard (used in `workflow_transitions.guard_key`) will block
workflow transitions until ALL `is_mandatory = true` items for the module have a submission.

---

## Conditional Checklist Patterns Summary

| Pattern | How to implement |
|---|---|
| Always show | `show_if = NULL` |
| Show for one condition | `show_if = {"field": "X", "op": "eq", "value": Y}` |
| Show when ALL of N conditions true | `show_if = {"and": [...]}` |
| Show when ANY of N conditions true | `show_if = {"or": [...]}` |
| Mandatory always | `is_mandatory = true`, `show_if = NULL` |
| Mandatory only when visible | `is_mandatory = true` + `show_if = {...}` — guard only counts this item if the condition is true for this entity |
| Optional info capture | `is_mandatory = false` — shown in checklist, not required for workflow |
| Generated document | `requirement_type = 'generated_document'`, `input_schema.template_code` matches `document_template.template_code` |

---

## Verification Checklist

After inserting:

- [ ] `module_code` in all rows matches `MODULE_CODES.X` exactly (case-sensitive)
- [ ] `chk_code` values are unique across the entire `checklist_requirement_rule` table (not just per module)
- [ ] All `show_if` JSON is valid JSON (use a JSON linter)
- [ ] All `show_if` field names match `process_definition.config_json.context_fields` entries
- [ ] All `generated_document` items have a matching row in `public.document_template` for the `template_code`
- [ ] Run:
  ```sql
  SELECT chk_code, module_code, requirement_type, title, is_mandatory, display_order
  FROM master.checklist_requirement_rule
  WHERE module_code = 'FOREST_CLEARANCE'
  ORDER BY display_order;
  ```
- [ ] Verify items with `show_if` by checking context: do your entity rows have those fields populated?
