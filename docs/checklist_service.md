# Checklist Service Module

The Checklist Service Module is a shared, enterprise-grade generic service designed to evaluate dynamic rules, handle cross-entity inheritance, securely store compliance inputs (e.g., land acquisition stages, employment application requirements), and project dynamic legal templates across the entire application.

---

## Architecture & How It Works

The service operates on four core principles:

1. **Context Resolution (`ChecklistContextRegistry` & `GenericEntityContextResolver`)**:
   The service uses a registry pattern. By default, it uses the `GenericEntityContextResolver` which dynamically queries the DB based on the `process_definition.config_json.context_fields` definition. This allows any module's checklist to evaluate dynamic rules without writing any TypeScript code.

2. **Dynamic Rule Evaluation (`show_if`)**:
   Checklist items are configured in the `master.checklist_requirement_rule` table to conditionally appear based on the state of the entity. For example, a "Forest Clearance" checklist item only appears if `context.has_wildlife_sanctuary === true`.

3. **Enterprise Integrations**:
   - **FileManager Integration**: Physical file uploads are handled via the central `file-management` module (`DocumentUploadField` + `DocumentUploader`), persisting records to `file_record`, scanning viruses, linking via `/api/files/link`, and generating download links.
   - **Docx Engine Integration**: Generated forms (`generated_document`) connect to `DocxGeneratorEngine` and `DocumentWorkspaceModal`. Domain data is projected into official `.docx` templates (e.g., Form-I, Form-VII, Form-XXII), auto-generating final PDFs and satisfying rules via `GeneratedDocumentChecklistAdapter`.

4. **Auto-Inheritance & Bi-Directional Sync (`inherit_from`, `sync_to_parent`)**:
   - **Inheritance:** A child entity (e.g., a `Plot`) automatically inherits checklist completion status from its parent (e.g., `Proposal`) if configured via `inherit_from`.
   - **Sync to Parent:** Submissions on a child entity are automatically stored against the parent entity if `sync_to_parent` is configured on the rule.

---

## The Generic Context Resolver (DB-Driven)

With the migration to a fully DB-driven architecture, the legacy pattern of writing a custom `IChecklistContextResolver` class for every module is deprecated. 

Instead, the `GenericEntityContextResolver` dynamically fetches context fields by reading the `process_definition` table:

```json
// Example process_definition.config_json
{
  "context_table": "acq_proposal",
  "context_id_field": "proposal_id",
  "context_fields": ["land_area_ha", "acq_mode_id", "current_stage_cd"]
}
```

The Checklist engine takes these fields and evaluates the `show_if` JSON conditions in the `checklist_requirement_rule` table. Custom TS resolvers can still be registered in `ChecklistContextRegistry` if complex computed properties are strictly necessary, but they are no longer required for standard CRUD.

---

## Workflow Engine Gating

The Checklist Service interacts directly with the **Workflow Engine** to gate state transitions and enforce compliance checks across modules.

1. **Submission Gating**:
   When evaluating a workflow transition, the `ChecklistFullySatisfiedGuard` automatically checks the `checklist_submission` table.
   - **Fails & Blocks Transition** if any `is_mandatory = true` rule for the entity's module is not satisfied.

2. **Dynamic Rule Evaluation (`GetChecklistStatusUseCase.ts`)**:
   Evaluates `show_if` rules against the context map on every render to ensure only relevant statutory requirements are presented to the user.
   
3. **Virtual Context Cloning (`context_source`)**:
   If a requirement rule configures `input_schema.context_source = "adjacent_mine_cds"`, the engine dynamically reads the array from the entity's context and spawns cloned virtual rules for each target (e.g., `Form-VII (Mine A)`, `Form-VII (Mine B)`). These virtual rules carry a `contextId` which is securely passed to the Document Engine.

---

## Canonical Entity Constants (`module-codes.config.ts`)

- All API routes, use cases, components, and repositories MUST use exported constants:
  ```ts
  import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'
  ```
- Raw string aliases like `'land_schedule'`, `'acq_proposal'`, `'proposal'` are **STRICTLY FORBIDDEN** per **`AGENTS.md`**.

---

## UI Workspace Architecture (`src/core/checklist/components/`)

The front-end layout provides a dual-section workflow:

```
+-----------------------------------------------------------------------------------+
| ChecklistHeaderProgress: Progress Bar % + Total Mandatory Satisfied Badge        |
+-----------------------------------------------------------------------------------+
|  [Tab 1: Docx Generated Forms]      |       [Tab 2: Operational Compliance]      |
+-------------------------------------+---------------------------------------------+
|                                     |                                             |
|  * Generated Form XXII (Draft)      |  * Forest Clearance Upload [FileManager]    |
|    - Engine: Docx Engine Service    |  * Debottar Land Confirmation [Toggle]      |
|    - Template: FORM_XXII            |  * Sanction Amount [Number Input]          |
|    [Continue Draft / Generate PDF]  |  * Clearance Target Date [DatePicker]       |
+-----------------------------------------------------------------------------------+
```

### Component Structure

- **`GenericChecklistWorkspace`**: Main tabbed container component assembling header progress and dual sections.
- **`ChecklistHeaderProgress`**: Top banner displaying completion percentage, mandatory items progress, and category pill badges.
- **`GeneratedFormsSection`**: Dedicated section for Docx Engine statutory forms.
- **`OperationalChecklistSection`**: Dedicated section for document uploads, boolean verifications, text entries, and numeric inputs with status filtering tabs (*All*, *Pending*, *Satisfied*).

### Typed Field Micro-Components (`src/core/checklist/components/fields/`)

Every rule type is rendered by a dedicated micro-component with built-in Zod validation:

| Component | Rule Type | Backend / Engine | Validation / Behavior |
| :--- | :--- | :--- | :--- |
| **`GeneratedDocumentField`** | `generated_document` | Docx Engine Service | Template workspace trigger (`DocumentWorkspaceModal`), draft state tracking, PDF view/download. |
| **`DocumentUploadField`** | `document` / `file` | FileManager Service | Single/Multiple upload modal, virus scan status (`clean`/`infected`), file replacement. |
| **`BooleanField`** | `boolean` / `system_check` | Internal Action | Auditor system check confirmation button with timestamping. |
| **`TextInputField`** | `text` / `textarea` | Internal Action | Zod client string validation (min/max length constraints). |
| **`NumberInputField`** | `number` / `currency` | Internal Action | Zod numeric bounds validation with custom unit labels (INR, Acres, etc.). |
| **`DateField`** | `date` | Internal Action | Integrated Popover `DatePicker` with date constraint validation. |
| **`SelectField`** | `select` | Internal Action | Select dropdown rendering options defined in `input_schema.options`. |

---

## Usage Examples

### 1. Embedding the Workspace UI Component
In any Next.js Page or Server Component:

```tsx
import { GenericChecklistWorkspace } from '@/core/checklist/components/GenericChecklistWorkspace';
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config';

export default function ProposalDetailsPage({ params }: { params: { id: string } }) {
  return (
    <GenericChecklistWorkspace
      moduleCode={MODULE_CODES.LAND_SCHEDULE}
      checkableType={CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE}
      checkableId={params.id}
      title="Proposal Files & Statutory Clearances"
      description="Dynamic compliance requirements & Docx legal forms"
    />
  );
}
```

### 2. Server Actions & Validation
Server actions in `src/app/actions/checklist.actions.ts` enforce session authentication and Zod schema validation:

```typescript
import { getChecklistStatus, updateChecklistSubmission } from '@/app/actions/checklist.actions';
import { CHECKABLE_ENTITY_TYPES, MODULE_CODES } from '@/core/config/module-codes.config';

// Fetch checklist status
const status = await getChecklistStatus(MODULE_CODES.LAND_SCHEDULE, CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId);

// Submit item completion
await updateChecklistSubmission({
  moduleCode: MODULE_CODES.LAND_SCHEDULE,
  requirementId: ruleId,
  checkableType: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
  checkableId: proposalId,
  documentId: uploadedFileId,
  userInput: { text: "Completed" }
});
```

---

## Performance & Multi-Tier Caching (`ConfigCacheService`)

To eliminate high DB read latency on low-churn configuration tables (`checklist_requirement_rule` and `workflow_transitions`), rule fetching is optimized through a multi-tiered caching layer ([`src/core/config/cache/ConfigCacheService.ts`](file:///d:/coalrrnextjs/src/core/config/cache/ConfigCacheService.ts)):

1. **L1 Process Memory Cache**: Sub-millisecond lookup in Node.js process memory (5-minute TTL).
2. **L2 Distributed Redis Cache**: Interfaced via `ioredis` in production environments for multi-node synchronization.
3. **Database Fallback**: PostgreSQL is queried only on cache miss, automatically repopulating L1 and L2 caches.

### Data Flow
`Checklist Workspace UI` $\rightarrow$ `GetChecklistStatusUseCase` $\rightarrow$ `ProposalChecklistResolver` $\rightarrow$ `FactResolver` $\rightarrow$ `ConditionContext` $\rightarrow$ `evaluateConditionNode` (AST Evaluator) $\rightarrow$ `Checklist Status Response`

---

## FactResolver & ConditionContext Integration (Phase 3)

The Checklist Service integrates directly with the unified [`FactResolver`](file:///d:/coalrrnextjs/src/core/flags/services/FactResolver.ts) and [`ConditionContextBuilder`](file:///d:/coalrrnextjs/src/core/flags/services/ConditionContextBuilder.ts) (see [`docs/fact_resolver_condition_context.md`](file:///d:/coalrrnextjs/docs/fact_resolver_condition_context.md)):

1. **Single AST Condition Evaluator**: Uses `evaluateConditionNode` in `GetChecklistStatusUseCase` without duplicate rule evaluators.
2. **Unified Context**: FactResolver merges authoritative domain data (`acq_proposal`, `project`), dynamic land metrics (`plot_count`), `checklist_entity_context` snapshot fallbacks, and manual `public.entity_flag` overrides.
3. **Dynamic Plot Schedule Auto-Fulfillment**: When `plot_count > 0` (or `has_plots === true`), requirement `ADD_PLOT_SCHEDULE` is marked as `AUTO_SATISFIED`.
4. **Key Integration Files**:
   - [`src/core/proposal/checklist/ProposalChecklistResolver.ts`](file:///d:/coalrrnextjs/src/core/proposal/checklist/ProposalChecklistResolver.ts)
   - [`src/core/flags/adapters/AcqLandScheduleFactAdapter.ts`](file:///d:/coalrrnextjs/src/core/flags/adapters/AcqLandScheduleFactAdapter.ts)
   - [`src/core/checklist/usecases/GetChecklistStatusUseCase.ts`](file:///d:/coalrrnextjs/src/core/checklist/usecases/GetChecklistStatusUseCase.ts)
   - [`tests/unit/core/checklist/ChecklistConditionContextIntegration.test.ts`](file:///d:/coalrrnextjs/tests/unit/core/checklist/ChecklistConditionContextIntegration.test.ts)

