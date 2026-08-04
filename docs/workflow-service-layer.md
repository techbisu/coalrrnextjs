# Workflow Service Layer Documentation

## 1. What It Does

The Workflow Service Layer is a polymorphic, database-driven finite state machine orchestrator that manages state transitions, compliance guard checks, parallel vetting tasks, and audit action histories across all COALRR modules (`LAND_SCHEDULE`, `COMPENSATION_PAYROLL`, `EMPLOYMENT_APP`, `FORM_I_CLAIM`). It decouples workflow logic from hardcoded code files by storing dynamic state catalogues (`public.workflow_states`) and transition graphs (`public.workflow_transitions`) in PostgreSQL, cached in-memory with a 60-second TTL for maximum performance. Every action taken is persisted in a polymorphic audit table (`public.workflow_action_history`), linking justification remarks, actor details, and supporting document uploads via `public.file_attachment`.

---

## 2. Database & Entity Architecture Standards

All workflow models adhere strictly to `.agents/rules/database.md`:
1. **Primary Key Naming**: Named using `<entity_name>_id` (`state_id`, `transition_id`, `review_task_id`, `wah_id`) with `@default(dbgenerated("gen_random_uuid()")) @db.VarChar(64)`. Generic `id` column names are banned.
2. **Polymorphic Key Standardization**: Standardized to `entity_type` and `entity_id` across `workflow_action_history`, `workflow_review_task`, and `file_attachment`.
3. **Mandatory Audit Columns**: Every table includes standard timestamptz audit columns (`entry_ts`, `updt_ts`, `entry_by`, `updt_by`).
4. **Attachment Separation**: Entity tables do not store `document_id` directly. All files are linked via `public.file_attachment` (`entity_type = 'workflow_action_history'`, `entity_id = wah_id`).

---

## 3. End-to-End Data Flow

$$\text{Database Entity} \longrightarrow \text{Repository / Engine} \longrightarrow \text{Use Case / Config} \longrightarrow \text{API Route} \longrightarrow \text{UI Component}$$

1. **Database Entity**:
   - `public.workflow_states`: Holds state codes (`state_id`), labels, descriptions, Tailwind colors, Lucide icons, and step order.
   - `public.workflow_transitions`: Defines allowed from/to state pairs (`transition_id`), required actor roles, and guard check keys.
   - `public.workflow_review_task`: Manages parallel sub-tasks (`review_task_id`, `entity_type`, `entity_id`) for HQ review roles (`gm_planning`, `gm_finance`, `gm_safety`, `hod_legal`).
   - `public.workflow_action_history`: Records immutable transition events with custom PK (`wah_id`), polymorphic keys (`entity_type`, `entity_id`), actor user relation (`user_id`), comments, and audit fields.
   - `public.file_attachment`: Links uploaded justification notes (`file_id`) to `workflow_action_history` (`entity_type = 'workflow_action_history'`, `entity_id = wah_id`).

2. **Repository & Engine Layer**:
   - `WorkflowEngineServer`: Server-only state machine orchestrator extending `WorkflowEngine`.
   - `WorkflowTransitionLoader`: Fetches active transitions for a canonical `workflow_code` from PostgreSQL.
   - `WorkflowActionHistoryService`: Handles polymorphic insertion and timeline querying for action history records.
   - `GuardRegistry`: Evaluates business guards (`ChecklistFullySatisfiedGuard`, `WithinProjectBaselineGuard`, `ParallelReviewsCompletedGuard`).

3. **Use Case & Configuration Layer**:
   - `src/core/config/module-codes.config.ts`: Single source of truth for canonical module codes (`MODULE_CODES`). `normalizeModuleCode()` converts string variants (`land_schedule`, `LAND_ACQ_PROPOSAL`, `PROPOSAL`) to `'LAND_SCHEDULE'`.

4. **API Route Layer**:
   - `POST /api/schedules/[id]/verify`: Authenticates user session, normalizes module codes, evaluates guards via `WorkflowEngineServer`, updates `acq_proposal.current_stage_cd`, records action history via `WorkflowActionHistoryService`, and dispatches async background jobs (`createReviewTasks`).

5. **UI Component Layer**:
   - `ApprovalPanel`: Renders available action buttons dynamically based on active state and user role.
   - `ActionJustificationDialog`: Captures user justification text & optional supporting document uploads.
   - `AcquisitionDetailTabs`: Renders the step timeline node progress and historical action log.

---

## 4. Key Files Touched

| Component | Path | Description |
| :--- | :--- | :--- |
| **Module Config** | [module-codes.config.ts](file:///d:/coalrrnextjs/src/core/config/module-codes.config.ts) | Canonical module codes & normalizer utility |
| **Workflow Engine** | [WorkflowEngineServer.ts](file:///d:/coalrrnextjs/src/core/workflow/WorkflowEngineServer.ts) | Server-backed dynamic state machine engine |
| **Action History Service** | [WorkflowActionHistoryService.ts](file:///d:/coalrrnextjs/src/core/workflow/services/WorkflowActionHistoryService.ts) | Polymorphic transaction history service |
| **Prisma Schema** | [schema.prisma](file:///d:/coalrrnextjs/prisma/schema.prisma) | Models for `workflow_states`, `workflow_transitions`, `workflow_review_task`, `workflow_action_history` |
| **Parallel Tasks Job** | [createReviewTasks.job.ts](file:///d:/coalrrnextjs/src/core/jobs/handlers/createReviewTasks.job.ts) | Job handler spawning parallel HQ review sub-tasks |
| **Workflow API Route** | [route.ts](file:///d:/coalrrnextjs/src/app/api/workflow/%5BrecordType%5D/%5BrecordId%5D/route.ts) | Polymorphic API route handler for workflow transitions |
| **Seed Scripts** | [workflow_states.seed.ts](file:///d:/coalrrnextjs/prisma/seed/workflow_states.seed.ts) | Seeding state catalogue for `LAND_SCHEDULE` |
| **Seed Scripts** | [workflow_action_history.seed.ts](file:///d:/coalrrnextjs/prisma/seed/workflow_action_history.seed.ts) | Seeding initial action history records |
| **Seed Scripts** | [workflow_review_task.seed.ts](file:///d:/coalrrnextjs/prisma/seed/workflow_review_task.seed.ts) | Seeding initial review tasks |
| **Seed Orchestrator** | [index.ts](file:///d:/coalrrnextjs/prisma/seed/index.ts) | Master seed registration |
| **Approval UI Component** | [ApprovalPanel.tsx](file:///d:/coalrrnextjs/src/shared/components/coalrr/ApprovalPanel.tsx) | Transition button mapping with unique React keys |
| **Workflow State Catalog** | [states.ts](file:///d:/coalrrnextjs/src/core/workflow/states.ts) | Transition name alignment (`advance_to_gmlre_planning`) |

---

## 5. Packages Used & Rationale

- **`@prisma/client`**: ORM used for executing transactional database queries, introspecting relations, and managing PostgreSQL schemas.
- **`zod`**: Used in `WorkflowTransitionLoader` for strict runtime schema validation of raw database transition rows before passing them to the engine.
- **`server-only`**: Security package enforcing that `WorkflowEngineServer` and `WorkflowTransitionLoader` are imported strictly in server context (API routes / Use Cases), preventing database secrets from leaking to client components.
- **`lucide-react`**: Provides UI icon components rendered dynamically based on `workflow_states.icon` (e.g. `FileEdit`, `Send`, `ShieldCheck`, `GitBranch`, `UserCheck`, `CheckCircle2`).
