# Developer Guide: How to Add a New Workflow State, Checklist Rule, and Milestone

This guide provides a step-by-step walkthrough for extending COALRR modules (such as Land Acquisition Proposals, Compensation Payroll, Employment Apps) with new **Workflow States**, **Checklist Rules**, and **Statutory Milestones** while strictly obeying all **`AGENTS.md`** rules and architectural guidelines.

---

## 📋 Table of Contents
1. [Core Architectural Rules (`AGENTS.md`)](#1-core-architectural-rules-agentsmd)
2. [Part 1: How to Add a New Workflow State & Transition Rules](#part-1-how-to-add-a-new-workflow-state--transition-rules)
3. [Part 2: How to Add a New Checklist Requirement Rule (Mode-Wise)](#part-2-how-to-add-a-new-checklist-requirement-rule-mode-wise)
4. [Part 3: How to Add a New Statutory Milestone & Prerequisite Rules](#part-3-how-to-add-a-new-statutory-milestone--prerequisite-rules)
5. [Part 4: Adding i18n Translation Keys](#part-4-adding-i18n-translation-keys)
6. [Part 5: Writing Vitest Unit Tests](#part-5-writing-vitest-unit-tests)

---

## 1. Core Architectural Rules (`AGENTS.md`)

Before writing any code or database scripts, verify compliance with these mandatory rules:

1. **No Raw String Aliases**:
   - ALL module codes and checkable entity types MUST import exported constants from `src/core/config/module-codes.config.ts`:
     ```ts
     import { MODULE_CODES, CHECKABLE_ENTITY_TYPES, ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'
     ```
   - Raw strings like `'land_schedule'`, `'acq_proposal'`, `'proposal'` are **STRICTLY FORBIDDEN** inline.

2. **SQL Delivery Preference**:
   - Generate raw SQL (`INSERT`, `ALTER TABLE`) for manual review and execution by the database administrator — do NOT auto-run `prisma migrate dev` unless explicitly directed.
   - After manual SQL execution, run `npx prisma db pull && npx prisma generate` to sync `schema.prisma`.

3. **Single Source of Truth Validation**:
   - Every input payload must be validated using a Zod schema in `src/shared/schemas/` before hitting UseCases or services.

4. **Module-Wise Config Files**:
   - Configurable limits, thresholds, and milestone graph rules MUST live in typed config files under `src/core/config/` (e.g. `milestone.config.ts`).

---

## Part 1: How to Add a New Workflow State & Transition Rules

### Step 1.1: Register the State in `public.workflow_states` SQL

Insert the state record into PostgreSQL `public.workflow_states`:

```sql
-- Insert new workflow state into catalogue
INSERT INTO public.workflow_states (
  state_code, 
  state_name, 
  module_code, 
  description, 
  responsible_role, 
  is_terminal, 
  display_order
) VALUES (
  'LegalVetting',                           -- State Code (mirrors acq_proposal.current_stage_cd)
  'Legal Vetting & Title Verification',     -- State Name
  'LAND_SCHEDULE',                          -- Module Code (MODULE_CODES.LAND_SCHEDULE)
  'Routed to HQ Legal Cell for Title Search clearance',
  'hod_legal',                              -- Responsible Role
  false,                                    -- Is Terminal State?
  45                                        -- UI Timeline Display Order
) ON CONFLICT (state_code) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  responsible_role = EXCLUDED.responsible_role;
```

---

### Step 1.2: Define Transition Graph Rows in `public.workflow_transitions` SQL

Define permissible inbound and outbound transitions in `public.workflow_transitions`. Workflows can be registered generally (`LAND_SCHEDULE`) or mode-specifically (`LAND_SCHEDULE_CBA_ACT`, `LAND_SCHEDULE_DIRECT_PURCHASE`):

```sql
-- CBA Act Mode Transition: AreaVetting -> LegalVetting
INSERT INTO public.workflow_transitions (
  workflow_code, 
  from_state, 
  to_state, 
  action_label, 
  allowed_roles, 
  required_guards, 
  routing_type
) VALUES (
  'LAND_SCHEDULE_CBA_ACT',                 -- Resolved workflow code (Mode 1 CBA Act)
  'AreaVetting',                           -- From State
  'LegalVetting',                          -- To State
  'Forward to HQ Legal',                   -- UI Action Button Label
  '{"area_office", "admin"}',              -- Allowed Roles
  '{"ChecklistFullySatisfiedGuard"}',       -- Required Compliance Guards
  'FORCED'                                 -- FORCED or USER_CHOICE
);

-- CBA Act Mode Transition: LegalVetting -> HqParallelVetting
INSERT INTO public.workflow_transitions (
  workflow_code, 
  from_state, 
  to_state, 
  action_label, 
  allowed_roles, 
  required_guards, 
  routing_type
) VALUES (
  'LAND_SCHEDULE_CBA_ACT',
  'LegalVetting',
  'HqParallelVetting',
  'Approve Title & Forward to HQ Parallel',
  '{"hod_legal", "admin"}',
  '{}',
  'FORCED'
);

-- Intra-State Routing Loop (Forwarding to specific user/role within LegalVetting)
INSERT INTO public.workflow_transitions (
  workflow_code, 
  from_state, 
  to_state, 
  action_label, 
  allowed_roles, 
  required_guards, 
  routing_type
) VALUES (
  'LAND_SCHEDULE_CBA_ACT',
  'LegalVetting',
  'LegalVetting',                           -- Self-loop state transition
  'Assign to Legal Officer',
  '{"hod_legal"}',
  '{}',
  'USER_CHOICE'                             -- Dynamic recipient picker in UI
);
```

---

### Step 1.3: Update Domain Enums & State Mapping Code

1. Add `'LegalVetting'` to `ProposalState` in `src/domain/entities/proposal/ProposalState.ts`:
   ```ts
   export class ProposalState {
     static readonly LEGAL_VETTING = new ProposalState('LegalVetting')
     // ...
   }
   ```

2. Register the state in `src/shared/components/coalrr/StateBadge.tsx`:
   ```ts
   export const DEFAULT_STATE_META: Record<string, StateMeta> = {
     LegalVetting: { label: 'Legal Vetting', variant: 'warning', icon: Scale },
   }
   ```

---

## Part 2: How to Add a New Checklist Requirement Rule (Mode-Wise)

Checklist rules live in `master.checklist_requirement_rule` and dynamically evaluate against entity properties via `show_if`.

### Step 2.1: Add Checklist Rule Record in SQL

```sql
INSERT INTO master.checklist_requirement_rule (
  chk_id,
  chk_code,
  module_code,
  title,
  description,
  requirement_type,
  is_mandatory,
  show_if,
  input_schema,
  inherit_from
) VALUES (
  gen_random_uuid(),
  'PROP_CL_015',                                           -- Unique requirement code
  'LAND_SCHEDULE',                                         -- MODULE_CODES.LAND_SCHEDULE
  'Landowner Title Search Report (13 Years)',               -- Title
  'Chain of title documents verified by empanelled advocate',
  'document_upload',                                       -- Requirement Type: document_upload | form_fill | generated_document
  true,                                                    -- Is Mandatory?
  '{"acq_mode_id": 6}',                                     -- Mode 6 Direct Purchase Only!
  '{"allowed_types": ["application/pdf"], "max_size_mb": 15}', -- Input validation schema
  NULL                                                     -- Parent inheritance config if applicable
);
```

---

### Step 2.2: Mode-Wise `show_if` Configuration Guide

The `show_if` JSON field controls dynamic visibility:

| Acquisition Mode | Mode ID (`acq_mode_id`) | Example `show_if` JSON |
| :--- | :--- | :--- |
| **CBA Act** | `1` | `'{"acq_mode_id": 1}'` |
| **RFCTLARR Act** | `2` | `'{"acq_mode_id": 2}'` |
| **Direct Purchase** | `6` | `'{"acq_mode_id": 6}'` |
| **Universal (All Modes)** | All | `NULL` (renders across all acquisition modes) |

---

### Step 2.3: Inherit-From Parent Submissions (Auto-Inheritance)

If a checklist item at the proposal level should automatically inherit clearance from its parent project:

```json
{
  "inherit_from": {
    "parent_checkable_type": "PROJECT",
    "parent_rule_id": "PROJ_CL_002"
  }
}
```
When `GetChecklistStatusUseCase` evaluates this rule, it searches `checklist_submission` for `PROJ_CL_002` under the parent project ID. If approved, the proposal item status resolves automatically to `AUTO_SATISFIED`.

---

## Part 3: How to Add a New Statutory Milestone & Prerequisite Rules

Milestones are configured per acquisition mode in `src/core/config/milestone.config.ts`.

### Step 3.1: Update `milestone.config.ts`

Add the milestone definition and any prerequisite statutory dependencies:

```ts
// src/core/config/milestone.config.ts
export const milestoneConfig = {
  // Direct Purchase (DP) Milestones
  DP: [
    { id: 'SALE_DEED_REGISTRATION', label: 'Sale Deed Registration', requires: [] },
    { id: 'STAMP_DUTY_CLEARANCE', label: 'Stamp Duty Clearance', requires: ['SALE_DEED_REGISTRATION'] },
    // NEW MILESTONE ADDED BELOW:
    { id: 'REGISTRATION_INDEX_II', label: 'Sub-Registrar Index-II Entry', requires: ['STAMP_DUTY_CLEARANCE'] },
  ],

  // CBA Act Statutory Milestones
  CBA: [
    { id: 'SECTION_4_NOTIFICATION', label: 'Section 4 Gazette Notification', requires: [], triggersTransition: 'advance_to_sec7_prep' },
    { id: 'SECTION_7_NOTIFICATION', label: 'Section 7 Gazette Notification', requires: ['SECTION_4_NOTIFICATION'] },
    { id: 'SECTION_9_NOTIFICATION', label: 'Section 9 Gazette Notification', requires: ['SECTION_7_NOTIFICATION'] },
    { id: 'SECTION_11_NOTIFICATION', label: 'Section 11 Declaration', requires: ['SECTION_9_NOTIFICATION'] },
    // NEW MILESTONE ADDED BELOW:
    { id: 'SPECIAL_LAND_ACQ_AWARD', label: 'SLAO Compensation Award Issued', requires: ['SECTION_11_NOTIFICATION'] },
  ],

  allowedRoles: ['admin', 'super_admin', 'area_gm', 'unit_office', 'legal_officer']
} as const;
```

---

### Step 3.2: How `ManualMilestoneService` Validates Prerequisites

When a user attempts to record `SECTION_7_NOTIFICATION`, `ManualMilestoneService`:
1. Fetches existing milestone history for entity `acq_land_schedule`.
2. Inspects `requires: ['SECTION_4_NOTIFICATION']`.
3. Rejects recording with `Result.fail("Missing prerequisite milestones: Section 4 Gazette Notification")` if `SECTION_4_NOTIFICATION` is not in history.

---

## Part 4: Adding i18n Translation Keys

Every new state, checklist item, and milestone must have translation keys added to locale files (e.g. `public/locales/en/common.json` and `public/locales/hi/common.json`):

```json
{
  "workflow": {
    "states": {
      "LegalVetting": "Legal Vetting & Title Search"
    },
    "actions": {
      "ForwardToLegal": "Forward to HQ Legal Cell"
    }
  },
  "checklist": {
    "PROP_CL_015": "Landowner Title Search Report (13 Years)"
  },
  "milestones": {
    "REGISTRATION_INDEX_II": "Sub-Registrar Index-II Entry",
    "SPECIAL_LAND_ACQ_AWARD": "SLAO Compensation Award Issued"
  }
}
```

---

## Part 5: Writing Vitest Unit Tests

Following **`AGENTS.md`**, every new workflow state, checklist rule, or milestone MUST be covered by automated unit tests in `tests/unit/`.

Create a test file `tests/unit/application/use-cases/NewFeatureWorkflow.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ManualMilestoneService } from '@/core/workflow/services/ManualMilestoneService'
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config'

describe('New Milestone & State Workflow Tests', () => {
  it('should enforce prerequisite statutory milestones', async () => {
    const service = new ManualMilestoneService()
    // Attempting dependent milestone without prerequisite
    const result = await service.recordMilestone({
      entity_type: ACQ_LAND_SCHEDULE,
      entity_id: 'prop_999',
      milestone_type: 'SPECIAL_LAND_ACQ_AWARD',
      milestone_date: new Date(),
      outcome: 'AWARDED',
      user_id: 'user_1',
    })

    expect(result.isFailure).toBe(true)
    expect(String(result.error)).toContain('Missing prerequisite milestones')
  })
})
```

Run test suite:
```bash
npx vitest run tests/unit/application/use-cases/NewFeatureWorkflow.test.ts
npx tsc --noEmit
```

---

## Summary Checklist for Developers

- [ ] Registered new state in `public.workflow_states` SQL
- [ ] Registered transitions in `public.workflow_transitions` SQL
- [ ] Used canonical `MODULE_CODES`, `CHECKABLE_ENTITY_TYPES`, `ACQ_LAND_SCHEDULE` constants
- [ ] Created checklist rule in `master.checklist_requirement_rule` SQL with mode-wise `show_if`
- [ ] Added milestone & dependencies in `src/core/config/milestone.config.ts`
- [ ] Updated translation keys in `public/locales/`
- [ ] Created and executed Vitest unit tests (`npx vitest run ...`)
- [ ] Executed `npx tsc --noEmit` build verification
