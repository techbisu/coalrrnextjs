# Polymorphic Workflow Engine Documentation

## 1. Executive Summary & Capabilities

The **Next-Generation Workflow Engine** is a polymorphic, database-driven finite state machine (FSM) orchestrator that manages state transitions, compliance guard checks, parallel vetting tasks, and audit action histories across all COALRR modules (`LAND_SCHEDULE`, `COMPENSATION_PAYROLL`, `EMPLOYMENT_APP`, `FORM_I_CLAIM`).

It decouples state machine rules from hardcoded code files by storing dynamic state catalogues (`public.workflow_states`) and transition graphs (`public.workflow_transitions`) in PostgreSQL, cached in-memory with a 60-second TTL.

---

## 2. Core Architectural Pillars

### A. Single Source of Truth (`WorkflowEngine` + `public.workflow_transitions`)
- `acq_proposal.current_stage_cd` directly mirrors `WorkflowState`.
- Separate or duplicate state machine logic in domain entities or services is strictly deprecated and removed. All transition checks delegate to `WorkflowEngine` / `WorkflowEngineServer`.

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

## 3. Workflow State Catalogue & Lifecycle

| State Code (`current_stage_cd`) | Responsible Role | Description & Purpose |
| :--- | :--- | :--- |
| **`Drafting`** | Unit Initiator | Plot schedule and Form-I compliance items assembled by colliery unit. Requires 100% CL-1 completion. |
| **`UnitSubmitted`** | Unit Office / Surveyor | Proposal submitted and routed for cross-colliery overlap verification. |
| **`CrossCollieryVerification`** | Adjacent Colliery | Boundary reconciliation against neighboring colliery mouza maps in LIS. |
| **`AreaVetting`** | Area Land Officer / GM | Area Office reviews plots and verifies land area against approved project baseline limits. |
| **`BoardEscalation`** | Land Board | Triggered automatically when land area/budget breaches baseline limits. |
| **`HqParallelVetting`** | GM Planning / Safety / Finance / Legal | Simultaneous parallel review by 4 HQ departments. All 4 must recommend approval. |
| **`GmLreReview`** | GM (LRE) | GM LRE consolidates departmental recommendations and approves proposal package. |
| **`DocketIssued`** | Land Cell | Formal legal proposal docket generated containing signed forms (Form VII, XVI, XXII). |
| **`ManuallyApproved`** | Executive Signee | Final official physical/digital executive sign-off completed. |
| **`Published`** | System Terminal | Award officially published to the immutable Form-D digital ledger. |

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
2. **API Delegation**: `POST /api/proposals/[id]/transition` invokes `WorkflowEngineServer.attemptTransitionAsync()` directly.
3. **WorkflowEngineServer**:
   - Resolves `workflowCode` via `resolveWorkflowCode()`.
   - Loads transition graph from `workflow_transitions` (or fallback).
   - Evaluates compliance guards in `GuardRegistry` (`ChecklistFullySatisfiedGuard`, `WithinProjectBaselineGuard`, `ParallelReviewsCompletedGuard`).
4. **State Mutation & Audit**:
   - Updates `acq_proposal.current_stage_cd`.
   - Inserts audit record directly via `WorkflowActionHistoryService.recordAction()` with `target_recipient_label` (e.g. `"sent to: Bankola AO (4103)"`).
   - Links uploaded files in `public.file_attachment`.
5. **Timeline Feed UI**: `<WorkflowTimelineFeed moduleCode="LAND_SCHEDULE" entityId={proposalId} />` automatically refetches and renders the updated timeline feed.

---

## 6. Reusable Component Usage

Import `<WorkflowTimelineFeed />` in any module UI:

```tsx
import { WorkflowTimelineFeed } from '@/shared/components/coalrr'

// Embed in Land Acquisition Proposal Tabs
<WorkflowTimelineFeed moduleCode="LAND_SCHEDULE" entityId={schedule.id} />

// Embed in Compensation Payroll Page
<WorkflowTimelineFeed moduleCode="COMPENSATION_PAYROLL" entityId={payroll.id} />
```

---

## 7. Statutory Milestone Management (`ManualMilestoneService`)

Statutory milestones and registrations are validated against mode-specific dependency graphs configured in `src/core/config/milestone.config.ts`:
- **CBA Act Chain**: `SECTION_4_NOTIFICATION` $\rightarrow$ `SECTION_7_NOTIFICATION` $\rightarrow$ `SECTION_9_NOTIFICATION` $\rightarrow$ `SECTION_11_NOTIFICATION`.
- **Direct Purchase Chain**: `SALE_DEED_REGISTRATION` $\rightarrow$ `STAMP_DUTY_CLEARANCE` $\rightarrow$ `POSSESSION_HANDOVER` $\rightarrow$ `MUTATION_COMPLETED`.
- **Dependency Guarding**: `ManualMilestoneService.recordMilestone()` rejects dependent milestones if prerequisite milestones are missing from entity history.
- **Audit & Snapshots**: Every recorded milestone pushes an action to `auditQueue` and creates an `acq_proposal` state snapshot.

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
| **Milestone Config** | [milestone.config.ts](file:///d:/coalrrnextjs/src/core/config/milestone.config.ts) | Mode-specific milestone definitions and dependency graphs |
| **Milestone Service** | [ManualMilestoneService.ts](file:///d:/coalrrnextjs/src/core/workflow/services/ManualMilestoneService.ts) | Milestone recording service with prerequisite validation & audit logging |
| **Workflow Types** | [types.ts](file:///d:/coalrrnextjs/src/core/workflow/types.ts) | `WorkflowState` union type & `GuardContext` interface |
| **State Catalog** | [states.ts](file:///d:/coalrrnextjs/src/core/workflow/states.ts) | Core state metadata catalogue (`COMPENSATION_PAYROLL_STATES`) |
| **Workflow Engine** | [WorkflowEngineServer.ts](file:///d:/coalrrnextjs/src/core/workflow/WorkflowEngineServer.ts) | Server-backed dynamic FSM orchestrator |
| **Transition Loader** | [WorkflowTransitionLoader.ts](file:///d:/coalrrnextjs/src/core/workflow/WorkflowTransitionLoader.ts) | Multi-tier cached DB transition graph loader with mode fallback |
| **Config Cache Service** | [ConfigCacheService.ts](file:///d:/coalrrnextjs/src/core/config/cache/ConfigCacheService.ts) | Multi-tiered (L1 RAM + L2 Redis) caching layer for DB rules and transitions |
| **Action History Service** | [WorkflowActionHistoryService.ts](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowActionHistoryService.ts) | Polymorphic history recorder & timeline data hydrator |
| **Timeline Feed UI** | [WorkflowTimelineFeed.tsx](file:///d:/coalrrnextjs/src/shared/components/coalrr/WorkflowTimelineFeed.tsx) | Reusable timeline feed component |
| **Timeline API Route** | [route.ts](file:///d:/coalrrnextjs/src/app/api/workflow/%5BrecordType%5D/%5BrecordId%5D/history/route.ts) | Polymorphic GET route returning timeline history & parallel tasks |
