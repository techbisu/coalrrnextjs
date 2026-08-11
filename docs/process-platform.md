# Generic Process Platform Documentation

## 1. Summary & Purpose
The **Generic Process Platform** is a module-independent workflow, task, milestone, checklist, document, and timeline orchestration system. It decouples business process logic from domain modules (e.g. Land Acquisition, Compensation, Rehabilitation, Mutation), allowing any module to configure state machines, compliance rules, statutory milestones, and signature workflows without modifying core platform code.

---

## 2. End-to-End Data Flow

$$\text{Domain Entity} \longrightarrow \text{ProcessInstanceService} \longrightarrow \text{WorkflowEngineServer} \longrightarrow \text{WorkflowReactionService} \longrightarrow \text{TimelineService} \longrightarrow \text{ProcessActionCenter UI}$$

1. **Entity Initiation**: When a proposal or claim is created, the module calls `processInstanceService.getOrCreateInstance(entityType, entityId, processCode)` to register the process instance.
2. **Action / Transition Attempt**: The user clicks an action in `<ProcessActionCenter />` or an event fires. The API route calls `workflowEngineServer.attemptTransitionAsync()`.
3. **Guard Evaluation**: `WorkflowEngineServer` loads DB transition rules, resolves guard keys in `GUARD_REGISTRY` (e.g., `ChecklistFullySatisfied`, `ChecklistContextFreshness`, `WithinProjectBaseline`), and validates prerequisites.
4. **Decoupled Reactions**: On statutory milestone recording or document signing, the service dispatches events to `WorkflowReactionService.handleEvent()`, which evaluates reaction rules and advances workflow state automatically if configured.
5. **Unified Timeline Projection**: Every transition, milestone, checklist update, and signature writes a `timeline_event` record via `TimelineService.recordEvent()`.
6. **UI Rendering**: `<ProcessActionCenter />` displays role-filtered action buttons with prerequisite tooltips, while `<UnifiedWorkflowTimeline />` renders the merged stage stepper and unified audit feed.

---

## 3. Key Files Touched & Created

### Platform Contracts & Types
- [`src/core/workflow/types.ts`](file:///d:/coalrrnextjs/src/core/workflow/types.ts): Open branded string types for `WorkflowState`, `RecordType`, `ActorRole`, and platform context models (`ProcessContext`, `WorkflowTask`, `WorkflowCycle`, `WorkflowBranch`).
- [`src/core/workflow/interfaces/IProcessRegistry.ts`](file:///d:/coalrrnextjs/src/core/workflow/interfaces/IProcessRegistry.ts): Interface contract for module self-registration.
- [`src/core/workflow/ProcessRegistry.ts`](file:///d:/coalrrnextjs/src/core/workflow/ProcessRegistry.ts): Central process registry implementation (`processRegistry`).
- [`src/core/workflow/interfaces/IWorkflowReaction.ts`](file:///d:/coalrrnextjs/src/core/workflow/interfaces/IWorkflowReaction.ts): Event reaction interfaces (`WorkflowReactionRule`, `IWorkflowReactionService`).

### Platform Runtime Services
- [`src/core/workflow/services/ProcessInstanceService.ts`](file:///d:/coalrrnextjs/src/core/workflow/services/ProcessInstanceService.ts): Polymorphic process instance management (`process_instance`).
- [`src/core/workflow/services/WorkflowTaskService.ts`](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowTaskService.ts): Actor task assignment and completion tracking (`workflow_task`).
- [`src/core/workflow/services/WorkflowBranchService.ts`](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowBranchService.ts): Parallel branch execution management (`workflow_branch`).
- [`src/core/workflow/services/WorkflowReactionService.ts`](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowReactionService.ts): Decoupled event reaction orchestrator (`workflow_reaction`).
- [`src/core/workflow/services/TimelineService.ts`](file:///d:/coalrrnextjs/src/core/workflow/services/TimelineService.ts): Unified event projection stream (`timeline_event`).
- [`src/modules/document-engine/application/DocumentVersionService.ts`](file:///d:/coalrrnextjs/src/modules/document-engine/application/DocumentVersionService.ts): Non-destructive document versioning (`document_version`).

### Checklist & Milestone Upgrades
- [`src/core/checklist/interfaces/IChecklistContextProvider.ts`](file:///d:/coalrrnextjs/src/core/checklist/interfaces/IChecklistContextProvider.ts): Versioned checklist context contract.
- [`src/core/checklist/services/ChecklistFreshnessService.ts`](file:///d:/coalrrnextjs/src/core/checklist/services/ChecklistFreshnessService.ts): Context staleness detector.
- [`src/core/workflow/guards.ts`](file:///d:/coalrrnextjs/src/core/workflow/guards.ts): `ChecklistContextFreshnessGuard` added to `GUARD_REGISTRY`.
- [`src/core/workflow/services/ManualMilestoneService.ts`](file:///d:/coalrrnextjs/src/core/workflow/services/ManualMilestoneService.ts): Outbox event trigger integration.

### Dependency Injection & Module Registrations
- [`src/infrastructure/di/modules/core.di.ts`](file:///d:/coalrrnextjs/src/infrastructure/di/modules/core.di.ts): Registered all Process Platform services in `Container`.
- [`src/infrastructure/di/modules/proposal.di.ts`](file:///d:/coalrrnextjs/src/infrastructure/di/modules/proposal.di.ts): Registered `LAND_ACQ_PROPOSAL` process configuration.

### Streamlined UI Components
- [`src/shared/components/coalrr/ProcessActionCenter.tsx`](file:///d:/coalrrnextjs/src/shared/components/coalrr/ProcessActionCenter.tsx): Reusable command center banner with animated checkmark completion feedback.
- [`src/shared/components/coalrr/UnifiedWorkflowTimeline.tsx`](file:///d:/coalrrnextjs/src/shared/components/coalrr/UnifiedWorkflowTimeline.tsx): Merged stage stepper + audit history feed with User Avatar Popovers.
- [`src/shared/components/coalrr/CollapsibleSectionCard.tsx`](file:///d:/coalrrnextjs/src/shared/components/coalrr/CollapsibleSectionCard.tsx): Reusable glassmorphic collapsible wrapper for secondary metadata.
- [`src/modules/land-acquisition/components/sections/ProposalHeaderBar.tsx`](file:///d:/coalrrnextjs/src/modules/land-acquisition/components/sections/ProposalHeaderBar.tsx): Hero header banner with expandable metadata card.
- [`src/modules/land-acquisition/components/sections/ProposalMetaBreakdownCard.tsx`](file:///d:/coalrrnextjs/src/modules/land-acquisition/components/sections/ProposalMetaBreakdownCard.tsx): Right sidebar metadata and land category breakdown card.
- [`src/shared/components/coalrr/StateBadge.tsx`](file:///d:/coalrrnextjs/src/shared/components/coalrr/StateBadge.tsx): Dynamic label formatting fallback.
- [`src/shared/components/coalrr/index.ts`](file:///d:/coalrrnextjs/src/shared/components/coalrr/index.ts): Updated barrel exports.

---

## 4. Dependencies & Packages Used

- **`@tanstack/react-query`**: Manages client-side server state, caching, and auto-refreshes for timeline and checklist data.
- **`lucide-react`**: Provides standard icons for states, tasks, attachments, and actions.
- **`zod`**: Enforces strict schema validation for DB transition rows and input payloads.
- **`prisma`**: Database ORM used strictly inside infrastructure repository and platform service classes (never inside UI or UseCases directly).
