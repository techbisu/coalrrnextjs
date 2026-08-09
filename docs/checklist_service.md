# Checklist Service Module

The Checklist Service Module is a shared, enterprise-grade generic service designed to evaluate dynamic rules, handle cross-entity inheritance, securely store compliance inputs (e.g., land acquisition stages, employment application requirements), and project dynamic legal templates across the entire application.

---

## Architecture & How It Works

The service operates on four core principles:

1. **Context Resolution (`ChecklistContextRegistry`)**:
   The service uses a registry pattern to decouple checklist rules from domain models. When evaluating rules for a given entity (e.g., a `proposal` or a `project`), the service fetches the entity's current state via a registered **Context Resolver** (`IChecklistContextResolver`).

2. **Dynamic Rule Evaluation (`show_if`)**:
   Checklist items are configured in the `checklist_requirement_rule` table to conditionally appear based on the state of the entity. For example, a "Forest Clearance" checklist item only appears if `context.HAS_FOREST_LAND === true`.

3. **Enterprise Integrations**:
   - **FileManager Integration**: Physical file uploads are handled via the central `file-management` module (`DocumentUploadField` + `DocumentUploader`), persisting records to `file_record`, scanning viruses, linking via `/api/files/link`, and generating download links.
   - **Docx Engine Integration**: Generated forms (`generated_document`) connect to `DocxGeneratorEngine` and `DocumentWorkspaceModal`. Domain data is projected into official `.docx` templates (e.g., Form-I, Form-VII, Form-XXII), auto-generating final PDFs and satisfying rules via `GeneratedDocumentChecklistAdapter`.

4. **Auto-Inheritance & Bi-Directional Sync (`inherit_from`, `sync_to_parent`)**:
   - **Inheritance:** A child entity (e.g., a `Plot`) automatically inherits checklist completion status from its parent (e.g., `Proposal`) if configured via `inherit_from`.
   - **Sync to Parent:** Submissions on a child entity are automatically stored against the parent entity if `sync_to_parent` is configured on the rule.

---

## Proposal Module & Workflow Engine Gating (`LAND_ACQ_PROPOSAL`)

The Checklist Service interacts directly with the **Workflow Engine** to gate state transitions and enforce compliance checks across proposal modules.

+-----------------------------------------------------------------------------------+
|  1. Plot Schedule Mutations (Add/Update/Delete)                                   |
|     Triggers `syncChecklistContext` background job via `JobDispatcherService`       |
|     Job scans plots, calculates flags, saves to `checklist_entity_context` (O(1)) |
+-----------------------------------------------------------------------------------+
                                        │
                                        ▼
+-----------------------------------------------------------------------------------+
|  2. Proposal Context Resolution (`ProposalChecklistResolver.ts`)                  |
|     Reads pre-computed JSON from `checklist_entity_context` & merges base props   |
+-----------------------------------------------------------------------------------+
                                        │
                                        ▼
+-----------------------------------------------------------------------------------+
|  3. Dynamic Rule Evaluation (`GetChecklistStatusUseCase.ts`)                      |
|     Evaluates `show_if` rules against the O(1) context map                        |
+-----------------------------------------------------------------------------------+
                                        │
                                        ▼
+-----------------------------------------------------------------------------------+
|  3. Proposal Submission & Workflow Guard Gating                                  |
|     - SubmitProposalUseCase: Blocks submission if isComplete === false             |
|     - ProjectLimitService: Intercepts limit breaches -> Form-XXII Escalation      |
|     - ChecklistFullySatisfiedGuard: Enforces 100% completion in Workflow Engine   |
+-----------------------------------------------------------------------------------+
```

### 1. Entity Context Synchronization (`syncChecklistContext.job.ts`)
To prevent heavy database scans during page loads, context calculation is decoupled into a background job. Whenever a user adds, updates, or deletes a plot schedule, the `JobDispatcherService` triggers `syncChecklistContext.job.ts` which computes flags and saves them to the universal `checklist_entity_context` table as a JSON payload.

- **`has_tribal_land`**: Scans schedule plots against `landtype_master` for Tribal/CNT/SPT land.
- **`has_debottar_land`**: Scans schedule plots for Debottar/Deity land types.
- **`has_displacement`**: Scans plots for Habitation/Residential/Bastu land.
- **`has_forest_land`**: Scans plots for Forest land.
- **`has_tenancy_land`**: Scans plots for Raiyati/Tenancy land.
- **`has_govt_land`**: Scans plots for GM/Govt land.
- **`has_patta_land`**: Scans plots for Patta land.
- **`has_statutory_clearances`**: Checks `project.statutoryClearances` in DB.
- **`has_employment_involvement`**: Checks project employment quota or estimated employment costs.

### 2. Proposal Context Resolution (`ProposalChecklistResolver.ts`)
When evaluating a land proposal, `ProposalChecklistResolver` performs an O(1) lookup on `checklist_entity_context` and merges it with base domain properties (which do not change via plot updates):

- **`acqModeId`**: Proposal's acquisition mode ID.
- **`is_rfctlarr`**: True if acquisition mode is RFCTLARR 2013 (Mode 5).
- **`has_formal_negotiation`**: True if acquisition mode is Direct Purchase (Mode 6) or manually toggled.
- **`is_board_approval_req`**: True if proposal requires board approval/deviation.
- **`stage`**: Proposal's current stage code (`DRAFT`, `SUBMITTED`, `AREA_VETTING`, etc.).

### 2. Submission Gating (`SubmitProposalUseCase.ts`)
When a user submits a proposal:
1. **Limit Check (`ProjectLimitService`)**: Evaluates proposal cost and acreage against project limits. If breached, flags `isLimitBreached = true`.
2. **Checklist Completeness Check**: Calls `checklistStatusUseCase.execute({ moduleCode: MODULE_CODES.LAND_SCHEDULE, checkableType: ACQ_LAND_SCHEDULE, checkableId: proposalId })`.
   - **Fails & Blocks Submission** if `isComplete === false` with message `"All mandatory checklist items must be completed before submitting the proposal."`
3. **State Transition**:
   - Standard path: Proposal transitions to `UNIT_SUBMITTED` / `AREA_VETTING`.
   - Breached limit path: Proposal routes for `BOARD_ESCALATION` / Form-XXII approval.

### 3. Canonical Entity Constants (`module-codes.config.ts`)
- All API routes, use cases, components, and repositories MUST use exported constants:
  ```ts
  import { MODULE_CODES, CHECKABLE_ENTITY_TYPES, ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'
  ```
- Raw string aliases like `'land_schedule'`, `'acq_proposal'`, `'proposal'` are **STRICTLY FORBIDDEN** per **`AGENTS.md`**.

### 4. Unit Testing Suite (`ChecklistFlow.test.ts`)
- Verified via Vitest suite in [`tests/unit/core/checklist/ChecklistFlow.test.ts`](file:///d:/coalrrnextjs/tests/unit/core/checklist/ChecklistFlow.test.ts):
  - Dynamic `show_if` rule filtering (`acq_mode_id = 6` Direct Purchase vs `acq_mode_id = 1` CBA Act).
  - Mandatory completeness calculation (`isComplete: true/false`).
  - Auto-inheritance from parent entities (`inherit_from` resolving to `AUTO_SATISFIED`).

### 3. Workflow Engine Transition Guards (`src/core/workflow/guards.ts`)
The Workflow Engine enforces checklist and baseline guards:
- **`ChecklistFullySatisfiedGuard`**: Validates mandatory checklist completeness before firing workflow state transitions.
- **`WithinProjectBaselineGuard` / `BaselineBreachedGuard`**: Validates budget ceilings.
- **`PlotNotAlreadyAcquiredGuard`**: Prevents double-acquisition of plots.
- **`ParallelReviewsCompletedGuard`**: Ensures parallel HQ reviews (GM Planning, GM Safety, GM Finance, HOD Legal) complete before advancing to `DirectorConsent`.

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

### 1. Registering a Context Resolver
Register your domain context resolver in `src/infrastructure/di/modules/core.di.ts`:

```typescript
import { ChecklistContextRegistry, IChecklistContextResolver } from '@/core/checklist';

class LandProposalContextResolver implements IChecklistContextResolver {
  async resolve(checkableId: string): Promise<Record<string, any>> {
    const proposal = await db.acq_proposal.findUnique({ where: { proposal_id: checkableId } });
    
    // Fetch pre-computed flags from context table
    const entityContext = await db.checklist_entity_context.findUnique({
      where: {
        checkable_type_checkable_id: {
          checkable_type: 'LAND_ACQ_PROPOSAL',
          checkable_id: checkableId
        }
      }
    });

    let contextData = {};
    if (entityContext && entityContext.context_data) {
      contextData = typeof entityContext.context_data === 'string' 
        ? JSON.parse(entityContext.context_data) 
        : entityContext.context_data;
    }

    // Merge base properties with dynamic context
    return {
      acq_mode: proposal?.acq_mode_id,
      STAGE: proposal?.current_stage_cd,
      ...contextData
    };
  }
}

// In DI setup:
checklistRegistry.register('LAND_ACQ_PROPOSAL', new LandProposalContextResolver());
```

### 2. Embedding the Workspace UI Component
In any Next.js Page or Server Component:

```tsx
import { GenericChecklistWorkspace } from '@/core/checklist/components/GenericChecklistWorkspace';

export default function ProposalDetailsPage({ params }: { params: { id: string } }) {
  return (
    <GenericChecklistWorkspace
      moduleCode="LAND_ACQ_PROPOSAL"
      checkableType="acq_proposal"
      checkableId={params.id}
      title="Proposal Files & Statutory Clearances"
      description="Dynamic compliance requirements & Docx legal forms"
    />
  );
}
```

### 3. Server Actions & Validation
Server actions in `src/app/actions/checklist.actions.ts` enforce session authentication and Zod schema validation:

```typescript
import { getChecklistStatus, updateChecklistSubmission } from '@/app/actions/checklist.actions';
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config';

// Fetch checklist status
const status = await getChecklistStatus(MODULE_CODES.LAND_SCHEDULE, ACQ_LAND_SCHEDULE, proposalId);

// Submit item completion
await updateChecklistSubmission({
  moduleCode: MODULE_CODES.LAND_SCHEDULE,
  requirementId: ruleId,
  checkableType: ACQ_LAND_SCHEDULE,
  checkableId: proposalId,
  documentId: uploadedFileId,
  userInput: { text: "Completed" }
});
```

---

## Developer Guidelines

1. **Never bypass the Use Cases:** Always interact with checklist data via `GetChecklistStatusUseCase` or `UpdateChecklistSubmissionUseCase` (or via Server Actions) to ensure dynamic rule resolution and auto-inheritance are preserved.
2. **Reuse Enterprise Components:** Always use `DocumentUploadField` for file uploads (which connects to `file-management`) and `GeneratedDocumentField` for dynamic forms (which connects to `document-engine`).
3. **Zod Validation Single Source of Truth:** All server action inputs validate against `ChecklistQuerySchema` and `UpdateSubmissionSchema` in `src/core/validation/schemas/checklist.schema.ts`. Rule metadata & `show_if` schemas validate against `ChecklistRequirementRuleSchema` in `src/shared/schemas/checklist-rule.schema.ts`.
4. **Mandatory Constant Naming (`ACQ_LAND_SCHEDULE`):** All module codes and checkable entity types MUST use exported constants from `src/core/config/module-codes.config.ts` (`MODULE_CODES.LAND_SCHEDULE`, `ACQ_LAND_SCHEDULE`). Inline raw magic strings (`'land_schedule'`, `'acq_proposal'`, `'proposal'`) are strictly prohibited.

---

## Performance & Multi-Tier Caching (`ConfigCacheService`)

To eliminate high DB read latency on low-churn configuration tables (`checklist_requirement_rule` and `workflow_transitions`), rule fetching is optimized through a multi-tiered caching layer ([`src/core/config/cache/ConfigCacheService.ts`](file:///d:/coalrrnextjs/src/core/config/cache/ConfigCacheService.ts)):

1. **L1 Process Memory Cache**: Sub-millisecond lookup in Node.js process memory (5-minute TTL).
2. **L2 Distributed Redis Cache**: Interfaced via `ioredis` in production environments for multi-node synchronization.
3. **Database Fallback**: PostgreSQL is queried only on cache miss, automatically repopulating L1 and L2 caches.

### Data Flow
`Checklist Workspace UI` $\rightarrow$ `GetChecklistStatusUseCase` $\rightarrow$ `PrismaChecklistRepository` $\rightarrow$ `ConfigCacheService` (L1 RAM / L2 Redis) $\rightarrow$ `PostgreSQL DB`

### Database Indexing Safeguard
- Unique constraint `uq_checklist_submission_entity_rule` on `(requirement_id, checkable_type, checkable_id)` guarantees atomic upserts without race conditions.

