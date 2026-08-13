# Workflow Setup Guide

> [!IMPORTANT]
> **Read AGENTS.md before touching anything.**
> Key rules that apply here:
> - Never hardcode module codes — always use `MODULE_CODES.X` from `module-codes.config.ts`
> - Adding a new module requires updating `module-codes.config.ts` FIRST
> - SQL delivery preference: generate SQL for manual review, do NOT auto-run `prisma migrate dev`
> - After any DB change, run `npx prisma db pull && npx prisma generate`

---

## How the Workflow Engine Works

The `WorkflowEngineServer` reads **two database tables** on every transition attempt (cached 60s via Redis/L1 memory):

```
workflow_states       → defines what states exist, their UI metadata (label, color, icon, order)
workflow_transitions  → defines what actions are legal (from_state → to_state, who can fire, what guard checks)
```

The engine looks up transitions by `workflow_code` which equals `MODULE_CODES.YOUR_MODULE`.
Guards are resolved by `guard_key` string → `GUARD_REGISTRY` in `guards.ts`.

**Zero TypeScript changes needed for new states/transitions — only DB inserts.**

---

## Step 0 — Register the Module Code (Mandatory First Step)

Before any DB inserts, add the module to [`module-codes.config.ts`](file:///d:/coalrrnextjs/src/core/config/module-codes.config.ts):

```ts
// src/core/config/module-codes.config.ts

export const MODULE_CODES = {
  LAND_SCHEDULE: 'LAND_SCHEDULE',
  COMPENSATION_PAYROLL: 'COMPENSATION_PAYROLL',
  EMPLOYMENT_APP: 'EMPLOYMENT_APP',
  FORM_I_CLAIM: 'FORM_I_CLAIM',
  // ✅ ADD YOUR NEW MODULE HERE FIRST
  FOREST_CLEARANCE: 'FOREST_CLEARANCE',
} as const

export const CHECKABLE_ENTITY_TYPES = {
  ACQ_LAND_SCHEDULE: 'acq_land_schedule',
  COMPENSATION_PAYROLL: 'compensation_payroll',
  EMPLOYMENT_APPLICATION: 'employment_application',
  FORM_I_CLAIM: 'form_i_claim',
  // ✅ ADD THE ENTITY TYPE FOR POLYMORPHIC TABLES
  FOREST_CLEARANCE: 'forest_clearance',
} as const

// Also add to normalizeModuleCode():
if (upper === 'FOREST_CLEARANCE') return 'FOREST_CLEARANCE'
```

> [!CAUTION]
> Never write `'FOREST_CLEARANCE'` as a raw string in any service, route, or component.
> Always import `MODULE_CODES.FOREST_CLEARANCE`.

---

## Step 1 — Insert Workflow States

**Table:** `public.workflow_states`

| Column | Type | Description |
|---|---|---|
| `workflow_code` | `VARCHAR(60)` | Must equal `MODULE_CODES.YOUR_MODULE` exactly |
| `state_code` | `VARCHAR(60)` | Machine name used in transitions and DB records |
| `label` | `VARCHAR(120)` | Human-readable label shown in UI stepper/badge |
| `description` | `TEXT` | Tooltip text shown in the stepper |
| `color` | `VARCHAR(120)` | Tailwind classes for `<StateBadge>` — use existing patterns |
| `icon` | `VARCHAR(60)` | Lucide icon name (string, resolved in UI) |
| `step_order` | `DECIMAL(5,2)` | Linear stepper position — use `.5` for branch states |
| `is_terminal` | `BOOLEAN` | `true` for final states (Approved, Rejected, Published) |
| `is_active` | `BOOLEAN` | Set `false` to soft-delete a state |

### Example: Forest Clearance Module (5-state linear flow)

```sql
-- Step 1: Insert workflow states
INSERT INTO public.workflow_states
  (workflow_code, state_code, label, description, color, icon, step_order, is_terminal, entry_by)
VALUES
  -- State 1: Initial drafting state
  ('FOREST_CLEARANCE', 'Drafting',
   'Drafting',
   'Application being prepared by the unit office.',
   'bg-slate-100 text-slate-700 border-slate-300',
   'FileEdit', 1.00, false, 'system'),

  -- State 2: Submitted to DFO
  ('FOREST_CLEARANCE', 'DfoReview',
   'DFO Review',
   'Application under review by the Divisional Forest Officer.',
   'bg-sky-100 text-sky-700 border-sky-300',
   'Search', 2.00, false, 'system'),

  -- State 3: Forwarded to PCCF
  ('FOREST_CLEARANCE', 'PccfReview',
   'PCCF Review',
   'Application under review by the Principal Chief Conservator of Forests.',
   'bg-violet-100 text-violet-700 border-violet-300',
   'Layers', 3.00, false, 'system'),

  -- State 3.5: Branch state — rejected and returned
  ('FOREST_CLEARANCE', 'ReturnedForRevision',
   'Returned for Revision',
   'Application returned by DFO or PCCF for corrections.',
   'bg-amber-100 text-amber-700 border-amber-300',
   'RotateCcw', 3.50, false, 'system'),

  -- State 4: Approved (Terminal)
  ('FOREST_CLEARANCE', 'Approved',
   'Approved',
   'Forest clearance granted. No further workflow action required.',
   'bg-green-100 text-green-700 border-green-300',
   'CheckCircle2', 4.00, true, 'system'),

  -- State 4: Rejected (Terminal)
  ('FOREST_CLEARANCE', 'Rejected',
   'Rejected',
   'Forest clearance rejected. Application is closed.',
   'bg-red-100 text-red-700 border-red-300',
   'XCircle', 4.50, true, 'system');
```

---

## Step 2 — Insert Workflow Transitions

**Table:** `public.workflow_transitions`

| Column | Type | Description |
|---|---|---|
| `workflow_code` | `VARCHAR(60)` | Same as `workflow_states.workflow_code` |
| `transition_name` | `VARCHAR(80)` | Machine name — unique per workflow. Used as the action payload in API calls |
| `label` | `VARCHAR(120)` | Button label shown in the Action Command Center |
| `from_state` | `VARCHAR(60)` | Must match a `state_code` in `workflow_states` |
| `to_state` | `VARCHAR(60)` | Must match a `state_code` in `workflow_states` |
| `required_role` | `VARCHAR(60)` | Only this role sees/can fire this transition |
| `guard_key` | `VARCHAR(80)` | Optional. Key from `GUARD_REGISTRY` in `guards.ts` |
| `sort_order` | `INT` | Order of buttons when multiple transitions are available |
| `routing_type` | `VARCHAR(30)` | `'FORCED'` (default) or `'ROUTED'` (user picks recipient) |

| `RequiredRecommendationsFulfilledGuard` | Evaluated globally before transition `guard_key` — blocks transition if pending required recommendations exist |
| `ChecklistFullySatisfied` | All mandatory checklist items completed for this entity |
| `WithinProjectBaseline` | `total_award ≤ budgetCeiling` (reads from `ctx.data`) |
| `BaselineBreached` | Inverse of above — used for escalation branches |
| `ParallelReviewsCompleted` | All parallel review tasks approved (no pending) |
| `PlotNotAcquired` | Plot not already part of a sealed schedule |
| `ThresholdMet2Ac` | Pooled acreage ≥ 2.00 acres (employment gate) |
| `ChecklistContextFreshness` | Entity data not modified since last checklist evaluation |
| *(null)* | No guard — transition fires freely on role match |

---

## Workflow Recommendations & Required Actions Engine

The platform supports generic **Workflow Recommendations** attached during `FORWARD` or `RETURN` actions. A user performing a transition can recommend or require that a specific action, milestone, checklist item, or document signature be fulfilled.

### 1. Storage & Schema (Zero Schema Changes)
- Recommendations are stored inside `workflow_action_history.recommendations_json` as a JSON array.
- No duplicate status column is persisted in the database; status (`PENDING` vs `FULFILLED`) is dynamically derived at query time.

```json
[
  {
    "id": "rec_123",
    "target_type": "MILESTONE",
    "target_code": "SECTION_4_NOTIFICATION",
    "isRequired": true,
    "requiredBeforeTransitionId": "forward_to_pccf",
    "note": "Gazette notification required before PCCF review."
  }
]
```

### 2. Supported Target Types
| Target Type | Resolution Mechanism |
|---|---|
| `MILESTONE` | Checked against `manual_milestone` records by entity ID & milestone code. |
| `CHECKLIST` | Checked against `checklist_submission` records by entity ID & chk code. |
| `DOCUMENT_SIGNATURE` | Checked against `document_instance` signatures by entity ID & role/permission. |
| `WORKFLOW_ACTION` | Checked against past `workflow_action_history` logs by entity ID & transition. |

### 3. Batch Resolution (`WorkflowTargetResolverRegistry`)
Target fulfillment is resolved in batch via `WorkflowTargetResolverRegistry.resolveTargetFulfillmentBatch()` using `findMany` queries (0 N+1 queries).

### 4. Required Recommendation Guard Enforcement
- `WorkflowEngineServer` evaluates `RequiredRecommendationsFulfilledGuard` **globally** before checking individual transition `guard_key` values.
- If a pending recommendation has `isRequired = true` and matches `requiredBeforeTransitionId` (or transition name), the engine blocks the transition and returns an error explaining which required action is unfulfilled.

### 5. Workflow Action History SQL Insert Example (with Recommendations)
When executing a transition with recommended or required actions:

```sql
-- Insert a workflow action log entry with attached recommendations
INSERT INTO public.workflow_action_history
  (id, record_id, record_type, from_state, to_state, action_type, actor_id, actor_role, remarks, recommendations_json, entry_ts)
VALUES
  (gen_random_uuid(),
   '11111111-1111-1111-1111-111111111111',   -- record_id (Proposal / Entity ID)
   'LAND_SCHEDULE',                         -- record_type (MODULE_CODES.LAND_SCHEDULE)
   'Drafting',                              -- from_state
   'DfoReview',                             -- to_state
   'submit_to_dfo',                         -- action_type (transition_name)
   'user_unit_nodal_01',                    -- actor_id
   'unit_office',                           -- actor_role
   'Submitting proposal for DFO review with required Section 4 milestone.',
   '[
      {
        "id": "rec_001",
        "target_type": "MILESTONE",
        "target_code": "SECTION_4_NOTIFICATION",
        "isRequired": true,
        "requiredBeforeTransitionId": "forward_to_pccf",
        "note": "Gazette notification required prior to final PCCF submission."
      }
    ]'::json,
   NOW());
```

---

### Example: Forest Clearance Transitions

```sql
-- Step 2: Insert transitions
INSERT INTO public.workflow_transitions
  (workflow_code, transition_name, label, from_state, to_state, required_role, guard_key, sort_order)
VALUES

  -- ① Unit office submits to DFO (guard: checklist must be complete)
  ('FOREST_CLEARANCE', 'submit_to_dfo',
   'Submit Application to DFO',
   'Drafting', 'DfoReview',
   'unit_office',
   'ChecklistFullySatisfied',   -- ← checklist must be 100% before submit
   10),

  -- ② DFO forwards to PCCF (no guard — DFO decision is discretionary)
  ('FOREST_CLEARANCE', 'forward_to_pccf',
   'Forward to PCCF for Final Clearance',
   'DfoReview', 'PccfReview',
   'dfo_officer',
   NULL,
   10),

  -- ③ DFO returns to unit for revision (no guard)
  ('FOREST_CLEARANCE', 'return_to_unit_dfo',
   'Return to Unit Office for Revision',
   'DfoReview', 'ReturnedForRevision',
   'dfo_officer',
   NULL,
   20),

  -- ④ PCCF approves (terminal — no guard beyond role)
  ('FOREST_CLEARANCE', 'approve_clearance',
   'Grant Forest Clearance',
   'PccfReview', 'Approved',
   'pccf_officer',
   NULL,
   10),

  -- ⑤ PCCF rejects (terminal — no guard)
  ('FOREST_CLEARANCE', 'reject_clearance',
   'Reject Clearance Application',
   'PccfReview', 'Rejected',
   'pccf_officer',
   NULL,
   20),

  -- ⑥ PCCF returns to DFO for re-review
  ('FOREST_CLEARANCE', 'return_to_dfo',
   'Return to DFO for Revision',
   'PccfReview', 'ReturnedForRevision',
   'pccf_officer',
   NULL,
   30),

  -- ⑦ Unit office resubmits after revision (guard: checklist must be complete again)
  ('FOREST_CLEARANCE', 'resubmit_after_revision',
   'Resubmit Revised Application',
   'ReturnedForRevision', 'DfoReview',
   'unit_office',
   'ChecklistFullySatisfied',
   10);
```

---

## Step 3 — Register a `process_definition` Row

This links the module to the workflow engine and optionally carries a `config_json`
for the `GenericEntityContextResolver` (used by checklist context).

```sql
-- Step 3: Register process definition
INSERT INTO public.process_definition
  (process_code, module_code, name, version, status, is_active, config_json, entry_by)
VALUES (
  'FOREST_CLEARANCE',           -- process_code (unique, same as module code for simplicity)
  'FOREST_CLEARANCE',           -- module_code (must match MODULE_CODES.FOREST_CLEARANCE)
  'Forest Clearance Application Process',
  1,
  'ACTIVE',
  true,
  -- config_json: tells GenericEntityContextResolver which table/fields to query
  -- for show_if rule evaluation in checklists and document variable injection
  '{
    "context_table": "forest_clearance_application",
    "context_id_field": "application_id",
    "context_fields": ["land_area_ha", "forest_type", "has_wildlife_sanctuary", "district_code"]
  }',
  'system'
);
```

---

## Step 4 — How the API Route Uses It

No code change needed. The existing `verify` route for your module calls:

```ts
// In your module's verify API route:
import { workflowEngineServer } from '@/core/workflow/WorkflowEngineServer'
import { MODULE_CODES } from '@/core/config/module-codes.config'

const transitionResult = await workflowEngineServer.attemptTransitionAsync({
  recordId: id,
  recordType: MODULE_CODES.FOREST_CLEARANCE,  // ← must match workflow_code in DB
  currentState: record.current_state,
  actorRole: mappedRole,
  data: {
    checklist: checklistMap,   // populated from checklist_submission
    total_award: '...',        // populated from entity table
    budgetCeiling: '...',      // populated from project
  }
}, transitionName)
```

---

## Step 5 — Conditional Workflow Patterns

### Pattern A: Role-gated transitions (most common)
Different roles see different buttons from the same state:

```sql
-- From HQ state, planning team and finance team both have independent actions
INSERT INTO public.workflow_transitions (workflow_code, transition_name, label, from_state, to_state, required_role, guard_key, sort_order)
VALUES
  ('FOREST_CLEARANCE', 'planning_approve', 'Planning Dept: Approve', 'HqReview', 'Approved', 'planning_officer', 'ParallelReviewsCompleted', 10),
  ('FOREST_CLEARANCE', 'finance_approve',  'Finance Dept: Approve',  'HqReview', 'Approved', 'finance_officer',  'ParallelReviewsCompleted', 10);
```

### Pattern B: Guard-conditional branch (e.g. baseline breach)
Two transitions from same state — only one is reachable based on data:

```sql
-- Normal path: within budget → forward
INSERT INTO public.workflow_transitions (workflow_code, transition_name, label, from_state, to_state, required_role, guard_key, sort_order)
VALUES
  ('FOREST_CLEARANCE', 'forward_normal',   'Forward for Approval',  'DfoReview', 'PccfReview',    'dfo_officer', 'WithinProjectBaseline', 10),
  ('FOREST_CLEARANCE', 'escalate_to_board','Escalate (Cost Breach)', 'DfoReview', 'BoardEscalation','dfo_officer', 'BaselineBreached',       20);
-- Only one will pass the guard check at runtime based on actual total_award vs budgetCeiling
```

### Pattern C: Mode-specific workflow (CBA vs RFCTLARR)
Use `resolveWorkflowCode()` to create mode-specific transition sets:

```sql
-- CBA-specific transitions
INSERT INTO public.workflow_transitions (workflow_code, ...) VALUES ('LAND_SCHEDULE_1', ...); -- mode_id=1 (CBA)
-- RFCTLARR-specific transitions
INSERT INTO public.workflow_transitions (workflow_code, ...) VALUES ('LAND_SCHEDULE_2', ...); -- mode_id=2 (RFCTLARR)
-- Base fallback (used when no mode-specific rows found)
INSERT INTO public.workflow_transitions (workflow_code, ...) VALUES ('LAND_SCHEDULE', ...);
```

---

## Verification Checklist

After inserting:

- [ ] `workflow_states` rows have correct `workflow_code` matching `MODULE_CODES.X`
- [ ] All `from_state` / `to_state` values in `workflow_transitions` match `state_code` values in `workflow_states`
- [ ] All `guard_key` values exist in `GUARD_REGISTRY` (or are `NULL`)
- [ ] At least one state has `is_terminal = true`
- [ ] `step_order` values are distinct (branch states use `.5` fractional positions)
- [ ] Run: `SELECT * FROM public.workflow_states WHERE workflow_code = 'FOREST_CLEARANCE' ORDER BY step_order;`
- [ ] Run: `SELECT * FROM public.workflow_transitions WHERE workflow_code = 'FOREST_CLEARANCE' ORDER BY from_state, sort_order;`
