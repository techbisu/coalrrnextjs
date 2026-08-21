# Polymorphic Workflow Engine Documentation

## 1. Executive Summary & Capabilities

The **Next-Generation Workflow Engine & Generic Process Platform** is a module-independent, database-driven finite state machine (FSM) orchestrator that manages state transitions, compliance guard checks, parallel vetting tasks, event reactions, non-destructive document versioning, and unified audit action histories across all COALRR modules (`LAND_SCHEDULE`, `COMPENSATION_PAYROLL`, `EMPLOYMENT_APP`, `FORM_I_CLAIM`, and future modules).

It completely decouples state machine rules from hardcoded code files by storing dynamic state catalogues (`public.workflow_states`), transition graphs (`public.workflow_transitions`), process definitions (`public.process_definition`), process instances (`public.process_instance`), workflow tasks (`public.workflow_task`), workflow branches (`public.workflow_branch`), workflow reactions (`public.workflow_reaction`), milestone definitions (`public.milestone_definition`), and unified timeline projections (`public.timeline_event`) in PostgreSQL.

> For the comprehensive Process Platform architecture, see [process-platform.md](file:///d:/coalrrnextjs/docs/process-platform.md).

---

## 2. Core Architectural Pillars

### A. Single Source of Truth (`WorkflowEngineServer` + `public.workflow_transitions`)
- Separate or duplicate state machine logic in domain entities or services is strictly deprecated and removed. All transition checks delegate to `WorkflowEngineServer`.
- Transition definitions are loaded dynamically from the database and cached via `ConfigCacheService` (L1/L2 Redis caching) to ensure zero latency on API calls.

### B. Mode-Aware Workflow Resolution (`resolveWorkflowCode`)
Workflows dynamically adjust based on the entity's **Acquisition Mode** (`acq_mode_id` / `acquisitionMode`):
$$\text{Resolved Workflow Code} = \text{resolveWorkflowCode}(\text{moduleCode}, \text{acqModeId})$$

- **Example**:
  - CBA Act $\rightarrow$ `LAND_SCHEDULE_CBA_ACT`
  - RFCTLARR Act $\rightarrow$ `LAND_SCHEDULE_RFCTLARR`
  - Direct Purchase $\rightarrow$ `LAND_SCHEDULE_DIRECT_PURCHASE`
- **Fallback Rule**: If no custom transition rows exist in `workflow_transitions` for a mode-specific code, `WorkflowTransitionLoader` automatically falls back to the base module code (`LAND_SCHEDULE`).

### C. Dynamic Routing Modes (`routing_type`)
- **`FORCED` Mode**: Pre-determined target state and default role queue. Transition executes immediately on click.
- **`USER_CHOICE` Mode**: Displays a dynamic UI picker allowing the user to select the specific target unit/colliery (e.g. `Forward for Reconciliation → Select Mine Y Unit Office`).
- **`MULTI_TARGET` Mode**: Routes the workflow to multiple entities simultaneously (fan-out parallel processing). Controlled by `target_options_source` (e.g., `adjacent_mine_cds` to extract arrays of targets from the entity).

### D. Polymorphic Rich Timeline Audit Feed (`WorkflowTimelineFeed`)
Every state transition event persists rich metadata in `public.workflow_action_history` and links attachments in `public.file_attachment`:
- **Actor Profile**: Name, Designation, Unit/Mine (`R. Sharma - Unit Officer`).
- **Target Recipient Label**: (`sent to: Mine Y Unit Office`, `sent to: Area Office`).
- **Justification & Annexure Notes**: Conflict resolutions (`Plot 12=B`).
- **Recommendations JSON**: Checked decision items.
- **Supporting Documents**: Clickable file download pills (`[Docs: Form VII — signed.pdf]`).
- **HQ Parallel Clearance Status**: Real-time approval badges for GM Planning, Safety, Finance, Legal.

---

## 3. Workflow State Catalogue (`public.workflow_states`)

The state catalogue (labels, colors, icons, step order) is defined **entirely in the database**. Hardcoded maps like `COMPENSATION_PAYROLL_STATES` are fully deprecated. 

Client components (like the timeline or stepper) retrieve their configuration dynamically via the API:
```http
GET /api/workflow/states?workflowCode=LAND_SCHEDULE
```
This returns the ordered array of states configured in the DB for the requested module, enabling zero-code UI rendering for new modules.

---

## 4. Actor Roles (`ActorRole`)

The `ActorRole` union defines the actors permitted to trigger state transitions.

| Role | Description |
| :--- | :--- |
| **`unit_office`** | Colliery unit level initiator |
| **`area_office`** | Area Office reviewer |
| **`gm_planning`** | GM Planning parallel vetting |
| **`gm_finance`** | GM Finance parallel vetting |
| **`gm_safety`** | GM Safety parallel vetting |
| **`hod_legal`** | HOD Legal parallel vetting |
| **`gm_lre`** | GM LRE final review |
| **`board`** | Land Board escalation |
| **`system`** | Automated system transitions triggered by the engine hooks |

---

## 5. Generic Action Classification & Snapshot Query Service

The `WorkflowSnapshotQueryService` evaluates the current state, checklist items, standalone documents, reviews, and signature matrices to produce a rich, role-aware snapshot with explicit action classifications.
This classification delegates strictly to the **`ActionEligibilityResolver`** which maps contexts (transitions, signatures, edits) to correct RBAC or role hierarchies without module-specific string matching.

### Action Classifications (`PendingActionClassification`)
- **`ACTIONABLE_BY_ME`**: The action is pending in the current workflow stage AND the current logged-in user possesses the required permission/role.
- **`WAITING_ON_ASSIGNEE`**: The action is active and pending, but requires a different role/signatory (e.g. Unit Surveyor signed, waiting for Colliery Manager).
- **`BLOCKED_BY_PREREQUISITE`**: The action cannot be performed because an earlier prerequisite step (e.g. review approval before signing) has not completed.
- **`COMPLETED`**: The action or signature requirement has been 100% satisfied.
- **`NOT_AUTHORIZED`**: The current user lacks permission and the action is not actionable.

### Pending Work Summary Counters (`PendingWorkSummary`)
Every snapshot response provides clear KPI metrics for user dashboards:
```json
{
  "pendingWorkSummary": {
    "actionableByMeCount": 1,
    "waitingOnOthersCount": 2,
    "completedCount": 5,
    "blockedCount": 0
  }
}
```

---

## 6. Generic Workflow State Transition Route (`POST /api/workflow/transition`)

A single, decoupled endpoint handles transitions for all modules and entity types:
- **Payload**:
  ```json
  {
    "moduleCode": "LAND_SCHEDULE",
    "entityType": "acq_land_schedule",
    "entityId": "prop-123",
    "toState": "AreaReview",
    "actionName": "FORWARD_TO_AREA",
    "justification": "All unit-level statutory forms and Form-XVI signatures completed."
  }
  ```
- **Execution Flow**:
  1. Authenticates session and checks module-level edit permissions.
  2. Resolves current entity status via `WorkflowTargetResolverRegistry`.
  3. Validates transition path in `WorkflowEngineServer` against `public.workflow_transitions`.
  4. Runs all configured guard checks in `WorkflowGuardEvaluator` (e.g. checklist completion, signatures).
  5. Updates `current_stage_cd` in database repository (which may construct domain events like `PROPOSAL_RETURNED`).
  6. Records immutable timeline entry via `WorkflowActionHistoryService`.
  7. Evaluates and publishes all queued Domain Events via `EventBus` to the Outbox (triggering side-effects like background document invalidation).

---

## 7. Reusable Workflow UI Components

### A. `<WorkflowActionCommandCenter />` (`src/shared/components/coalrr/workflow/`)
Provides a unified action center rendering active pending actions, classification badges, and primary transition buttons.

### B. `<WorkflowTimelineFeed />` (`src/shared/components/coalrr/`)
Renders the complete chronological history feed with real-time badges:
- `Action Required by You` (pulsing blue badge)
- `Awaiting <Role>` (amber badge)
- `Completed` (emerald badge)

```tsx
import { WorkflowActionCommandCenter, WorkflowTimelineFeed } from '@/shared/components/coalrr'
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'

// Command Center
<WorkflowActionCommandCenter
  moduleCode={MODULE_CODES.LAND_SCHEDULE}
  entityType={CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE}
  entityId={proposalId}
  onTransitionSuccess={handleRefresh}
/>

// Timeline Feed
<WorkflowTimelineFeed 
  moduleCode={MODULE_CODES.LAND_SCHEDULE} 
  entityId={proposalId} 
/>
```

---

## 8. Key Files Summary

| Component | Path | Description |
| :--- | :--- | :--- |
| **Snapshot Service** | [WorkflowSnapshotQueryService.ts](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowSnapshotQueryService.ts) | Role-aware action classification & snapshot builder |
| **Transition Route** | [route.ts](file:///d:/coalrrnextjs/src/app/api/workflow/transition/route.ts) | Generic transition execution endpoint |
| **Command Center UI**| [WorkflowActionCommandCenter.tsx](file:///d:/coalrrnextjs/src/shared/components/coalrr/workflow/WorkflowActionCommandCenter.tsx) | Unified pending actions and transition execution bar |
| **Timeline Feed UI** | [WorkflowTimelineFeed.tsx](file:///d:/coalrrnextjs/src/shared/components/coalrr/WorkflowTimelineFeed.tsx) | Reusable timeline feed component with status badges |
| **Workflow Engine** | [WorkflowEngineServer.ts](file:///d:/coalrrnextjs/src/core/workflow/WorkflowEngineServer.ts) | Server-backed dynamic FSM orchestrator |
| **Transition Loader** | [WorkflowTransitionLoader.ts](file:///d:/coalrrnextjs/src/core/workflow/WorkflowTransitionLoader.ts) | Multi-tier cached DB transition graph loader |
| **Guard Evaluator** | [WorkflowGuardEvaluator.ts](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowGuardEvaluator.ts) | Centralized guard validator |
| **Action History Service** | [WorkflowActionHistoryService.ts](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowActionHistoryService.ts) | Polymorphic history recorder & timeline hydrator |

