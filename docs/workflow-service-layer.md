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

## 5. End-to-End Execution Flow

$$\text{UI Component} \longrightarrow \text{API Route} \longrightarrow \text{WorkflowEngineServer} \longrightarrow \text{WorkflowActionHistoryService} \longrightarrow \text{DB \& Timeline Feed}$$

1. **Client / UI Action**: User selects an action in `ApprovalPanel` ("Actor Role & Approval Chain") or `ActionJustificationDialog`.
2. **API Delegation**: API route (e.g., `POST /api/schedules/[id]/verify`) invokes `WorkflowEngineServer.attemptTransitionAsync()` directly.
3. **WorkflowEngineServer**:
   - Resolves `workflowCode` via `resolveWorkflowCode()`.
   - Loads transition graph from `workflow_transitions` (or fallback) via `ConfigCacheService`.
   - Evaluates compliance guards registered in `GUARD_REGISTRY` (e.g. `ChecklistFullySatisfiedGuard`).
4. **State Mutation & Audit**:
   - Updates `current_stage_cd` on the target entity.
   - Inserts audit record directly via `WorkflowActionHistoryService.recordAction()`.
5. **Timeline Feed UI**: `<WorkflowTimelineFeed moduleCode={MODULE_CODES.LAND_SCHEDULE} entityId={proposalId} />` automatically refetches and renders the updated timeline feed.

---

## 6. Reusable Component Usage

Import `<WorkflowTimelineFeed />` in any module UI:

```tsx
import { WorkflowTimelineFeed } from '@/shared/components/coalrr'
import { MODULE_CODES } from '@/core/config/module-codes.config'

// Embed in Land Acquisition Proposal Tabs
<WorkflowTimelineFeed moduleCode={MODULE_CODES.LAND_SCHEDULE} entityId={schedule.id} />

// Embed in Compensation Payroll Page
<WorkflowTimelineFeed moduleCode={MODULE_CODES.COMPENSATION_PAYROLL} entityId={payroll.id} />
```

---

## 7. Statutory Milestone Management (`ManualMilestoneService`)

Statutory milestones and registrations are tracked by the fully DB-driven `ManualMilestoneService`.

- **Dependencies**: Prerequisites are defined in the `milestone_dependency` database table. The service automatically rejects attempts to record a milestone if required predecessors are missing from `manual_milestone`.
- **UI Resolution**: The available milestones are fetched dynamically via `GET /api/milestones/definitions?moduleCode=...`, meaning no code changes are required to add a new statutory milestone chain.
- **Audit & Snapshots**: Every recorded milestone pushes an action to `auditQueue` and creates an entity state snapshot.

---

## 8. Unit Testing Suite (`MilestoneFlow.test.ts` & `ProposalWorkflowState.test.ts`)

- **Milestone Flow Suite** ([`MilestoneFlow.test.ts`](file:///d:/coalrrnextjs/tests/unit/core/workflow/MilestoneFlow.test.ts)):
  - Enforces prerequisite statutory milestone dependencies (rejecting dependent milestones when prerequisites are missing).
  - Validates history retrieval ordered chronologically by `sent_at`.
- **Proposal Workflow Suite** ([`ProposalWorkflowState.test.ts`](file:///d:/coalrrnextjs/tests/unit/application/use-cases/ProposalWorkflowState.test.ts)):
  - Validates mode-specific proposal creation (`cba_act` $\rightarrow$ `CL-1.1`, `rfctlarr` $\rightarrow$ `CL-1.3`, `direct_purchase` $\rightarrow$ `CL-1.2`).
  - Validates `SubmitProposalUseCase` checklist gating.

---

## 9. Key Files Summary

| Component | Path | Description |
| :--- | :--- | :--- |
| **Module Config** | [module-codes.config.ts](file:///d:/coalrrnextjs/src/core/config/module-codes.config.ts) | Canonical module codes & `resolveWorkflowCode` mode resolver |
| **Milestone Service** | [ManualMilestoneService.ts](file:///d:/coalrrnextjs/src/core/workflow/services/ManualMilestoneService.ts) | DB-driven milestone recording & dependency validation |
| **Workflow Types** | [types.ts](file:///d:/coalrrnextjs/src/core/workflow/types.ts) | TypeScript definitions & `GuardContext` interface |
| **Workflow Engine** | [WorkflowEngineServer.ts](file:///d:/coalrrnextjs/src/core/workflow/WorkflowEngineServer.ts) | Server-backed dynamic FSM orchestrator |
| **Transition Loader** | [WorkflowTransitionLoader.ts](file:///d:/coalrrnextjs/src/core/workflow/WorkflowTransitionLoader.ts) | Multi-tier cached DB transition graph loader with mode fallback |
| **Guards** | [guards.ts](file:///d:/coalrrnextjs/src/core/workflow/guards.ts) | Extensible transition rules (e.g., checklist completion, budget limits) |
| **Config Cache Service** | [ConfigCacheService.ts](file:///d:/coalrrnextjs/src/core/config/cache/ConfigCacheService.ts) | Multi-tiered (L1 RAM + L2 Redis) caching layer for DB rules and transitions |
| **Action History Service** | [WorkflowActionHistoryService.ts](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowActionHistoryService.ts) | Polymorphic history recorder & timeline data hydrator |
| **Timeline Feed UI** | [WorkflowTimelineFeed.tsx](file:///d:/coalrrnextjs/src/shared/components/coalrr/WorkflowTimelineFeed.tsx) | Reusable timeline feed component |
| **Timeline API Route** | [route.ts](file:///d:/coalrrnextjs/src/app/api/workflow/%5BrecordType%5D/%5BrecordId%5D/history/route.ts) | Polymorphic GET route returning timeline history & parallel tasks |
