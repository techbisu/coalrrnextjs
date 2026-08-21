# COALRR Platform — Master Technical Documentation
## Generic Service Layer, Module Implementation Guide & Architecture Blueprint

**Version:** 2.0 | **Date:** 2026-08-21 | **Classification:** Internal — Engineering
**Scope of this document:** This is the single technical reference for how COALRR is actually built today, and how every module — built or unbuilt — must be implemented on top of the **existing generic service layer**. It supersedes the Phase‑0 gap list in `technical_design_document.md` (v1.0, 2026‑08‑03) wherever the two disagree, because the codebase has since evolved into a true **Generic Process Platform**. Nothing here proposes a rewrite. Every recommendation is additive to the current `dump-coalrrnextjs` schema and `src/core` service layer.

**Sources reviewed:** 110 markdown files under `docs/` (architecture inventory, service docs, SOP corpus), the current Postgres dump (`dump-coalrrnextjs-202608211255`, 97 tables across `acquisition`, `master`, `audit`, `public`), and the `COALRR Phase‑II Process Flow` design note (Land Compensation and R&R tracks run in parallel and converge at payment — full content wasn't rendering server-side; treat that doc as a live source and re-pull before Phase 5/6 detailed design).

**Development status ground truth** (per your instruction, confirmed against the DI wiring and module folders):

| Module | Status | Evidence |
|---|---|---|
| **Project Master** | 🟢 Active development | Full use-case set, repository, UI (6+ components), DI module, `docs/project-master.md` |
| **Land Acquisition / Proposal** | 🟢 Active development | Richest module: 20+ use cases, generic Process Platform fully wired, 6 modular UI sections, `docs/land-acquisition.md` |
| Employment | 🟡 Prototype | DB tables exist (`employment_application`, `nominee_pool*`) but module layer is a single repository **interface**, no use cases/UI |
| PAF (Rehabilitation) | 🟡 Prototype | `paf_census_record` table exists; module layer is one interface stub |
| Payrolls (Compensation) | 🟡 Prototype | `compensation_payroll(_line)` tables exist; module layer is one interface stub |
| RnR Payrolls | 🟡 Prototype | `rnr_asset_payroll(_line)` tables exist; module layer is one interface stub |
| Ledger | 🟡 Prototype | Use cases exist (`AppendLedgerEntryUseCase`) pointing at `form_d_ledger_entry`; no UI/module folder |
| Org (user-org-scope ops) | 🟡 Prototype | Mature domain service (`UserScopeService`), thin UI (3 components) |
| Document Engine | 🟢 Mature platform primitive (shared by all modules) | Full lifecycle engine, 28 templates registered |
| File Management | 🟢 Mature platform primitive | Full Clean Architecture module, polymorphic linking |
| Admin (Users/Roles/Settings/Master-data) | 🟢 Mature platform primitive | Full CRUD use-case sets for users, roles, permissions, system config |

**Reading order:** §1 architecture → §2 the Generic Service Layer (the part you asked to be improved and made reusable) → §3 reusable UI → §4 module-by-module implementation → §5 DDD compliance → §6 RBAC/security → §7 performance/data handling → §8 validation → §9 user & user-scope audit → §10 database additions → §11 build sequence.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [The Generic Service Layer](#2-the-generic-service-layer)
3. [Reusable UI Component Library](#3-reusable-ui-component-library)
4. [Module-by-Module Implementation](#4-module-by-module-implementation)
5. [DDD & Clean Architecture Compliance](#5-ddd--clean-architecture-compliance)
6. [Security & RBAC](#6-security--rbac)
7. [Performance & Data Handling](#7-performance--data-handling)
8. [Validation Strategy](#8-validation-strategy)
9. [User & User-Scope Module — Assessment](#9-user--user-scope-module--assessment)
10. [Database Additions Required](#10-database-additions-required)
11. [Build Sequence & Roadmap](#11-build-sequence--roadmap)

---

## 1. Architecture Overview

### 1.1 Layering (Clean Architecture + DDD)

```
Presentation  →  Application  →  Domain  →  Infrastructure
(app/, modules/*/components)  (use-cases)  (entities, VOs)  (Prisma repos, storage, queues)
```

Hard rule, enforced across every module reviewed: **no UI component or route handler ever imports Prisma directly.** All DB access goes through a `*Repository` class registered in the DI container (`src/infrastructure/di/modules/*.di.ts` → `Container`). This is already true for Project Master and Land Acquisition; it is the rule every prototype module must inherit unchanged.

```
src/
  core/                 # Generic, module-agnostic platform services (the "generic service layer")
    workflow/            # Process Platform: engine, guards, reactions, timeline
    checklist/            # Generic checklist engine + field components
    flags/                 # FactResolver / ConditionContext / EntityFlagService
    master-lookup/          # 3-tier cached master data lookup
    authorization/            # RBAC + OrgScope
    audit/                     # Audit service + Prisma extension
    notifications/              # EventBus + outbox
    jobs/                         # JobDispatcherService
    config/                        # module-codes.config.ts, *.config.ts (all thresholds)
    base/                           # Entity, AggregateRoot, ValueObject, DomainEvent
    errors/                         # DomainException, NotFoundException, ValidationException
    result/                         # Result<T,E> monad
    interfaces/                     # Repository.interface.ts, UseCase.interface.ts
  domain/               # Pure domain entities/VOs for modules that have graduated to DDD (project, proposal)
  application/          # Cross-module use-cases (proposal, project, employment, ledger, paf, payrolls, org)
  infrastructure/
    di/modules/*.di.ts   # One DI module per bounded context
    persistence/          # Prisma*Repository implementations
  modules/              # Module-scoped UI + module-local domain/infrastructure
    project-master/  land-acquisition/  document-engine/  file-management/
    employment/  paf/  payrolls/  rnr-payrolls/  ledger/  org/  admin/
  shared/               # Shared UI (shadcn-based), shared Zod schemas
  lib/                  # Pure engines (docx generation), db client, url framework
```

### 1.2 The single biggest architectural fact driving this document

The codebase has **already built a generic, DB-driven Process Platform** (`docs/process-platform.md`, `docs/workflow-service-layer.md`) that is module-independent by construction:

$$\text{Domain Entity} \to \text{ProcessInstanceService} \to \text{WorkflowEngineServer} \to \text{WorkflowReactionService} \to \text{TimelineService} \to \text{ProcessActionCenter UI}$$

Every prototype module (Employment, PAF, Payrolls, RnR, Ledger) does **not** need its own workflow engine, checklist engine, document engine, file manager, or notification system. It needs to **register itself** into the existing generic services. That is the core instruction driving §2 and §4 below: build less, configure more.

---

## 2. The Generic Service Layer

This section is the direct answer to requirements **#1 (improve service layer)** and **#2 (generic service layer usable by any module)**. Nine services already exist and are already generic by design (DB-driven, keyed by `moduleCode`/`entityType`, cached). The work is to (a) **complete** two of them, (b) **standardize the registration contract** so a new module is a checklist of config, not code, and (c) close the few module-specific leaks that still exist.

### 2.1 Service Inventory (single source of truth table)

| # | Service | File | Keyed by | Storage | Status |
|---|---|---|---|---|---|
| 1 | **WorkflowEngineServer** (Process Platform) | `src/core/workflow/WorkflowEngineServer.ts` | `workflowCode` (= `resolveWorkflowCode(moduleCode, acqModeId)`) | `workflow_states`, `workflow_transitions`, `workflow_task`, `workflow_branch`, `workflow_cycle`, `workflow_action_history` | ✅ Generic, production-grade |
| 2 | **ChecklistService** / `GetChecklistStatusUseCase` | `src/core/checklist/` | `checkableType` + `checkableId` (`CHECKABLE_ENTITY_TYPES`) | `checklist_requirement_rule`, `checklist_submission`, `checklist_entity_context` | ✅ Generic (`GenericEntityContextResolver` needs zero code per module) |
| 3 | **FactResolver / ConditionContextBuilder** | `src/core/flags/` | `entityType` via `IFactSourceAdapter` | `entity_flag` + live domain tables | ✅ Generic, adapter pattern already defined |
| 4 | **ManualMilestoneService** | `src/core/workflow/services/ManualMilestoneService.ts` | `entity_type` + `moduleCode` | `milestone_definition`, `milestone_dependency`, `manual_milestone` | ✅ Generic (config in `milestone.config.ts`) |
| 5 | **Document Engine** | `src/modules/document-engine/` | `templateCode` → `moduleCode` | `document_template(_field/_signature)`, `document_instance` | ✅ Generic, 28 templates already registered |
| 6 | **File Management (EntityFileManager)** | `src/modules/file-management/` | `entityType` (polymorphic) | `file_record`, `file_attachment`, `file_version` | ✅ Generic, already used by Project & Proposal |
| 7 | **NotificationService / EventBus** | `src/core/notifications/` | `event_name` → `notification_rule` | `event_registry`, `notification_rule/template/log`, `outbox_events` | ✅ Generic, transactional outbox |
| 8 | **AuditService** | `src/core/audit/` | any Prisma model (global extension) + `logCustomAction` | `audit.activity_log`, `audit.application_log` | ✅ Generic, zero-code for CRUD, one-liner for business events |
| 9 | **Master Lookup** | `src/core/master-lookup/` | `masterName` → `MasterDataConfig` | any `master.*` table | ✅ Generic, 3-tier cache |
| 10 | **OrgScopeAuthorizationService / UserScopeService** | `src/core/authorization/` | `user_org_scope.scope_level` | `user_org_scope`, `role`, `permission` | ✅ Generic — see §9 for the one real gap (citizen scope) |
| 11 | **ConfigCacheService** | `src/core/config/cache/ConfigCacheService.ts` | cache key namespace | L1 memory + L2 Redis | ✅ Generic, used by checklist + workflow rule loaders |
| 12 | **JobDispatcherService** | `src/core/jobs/services/JobDispatcherService.ts` | job name → handler map | dev: sync / prod: BullMQ | ✅ Generic, single point of entry for all async work |
| 13 | **ProjectLimitService** | *(design target, §2.9)* | `proj_cd` + candidate delta | reads `proj_aprv`, `proj_aprv_location`, live proposal totals | 🟠 **Partially implemented** — logic currently lives inline in guards (`WithinProjectBaseline`); needs extraction into a standalone, directly-callable service (see below) |
| 14 | **DeadlineTrackerService** | *(design target, §2.10)* | `entity_type` + `entity_id` + `deadline_type` | `deadline_tracker` (table exists, unused) | 🔴 **Table exists, service does not** — build this |

Everything in the ✅ rows already satisfies requirement #2. The two 🟠/🔴 rows are the concrete work items for requirement #1.

### 2.2 The registration contract — "how any module plugs in"

This is the actual generic **interface** every module (built or prototype) must satisfy. It is already documented piecemeal across `docs/how_to_add_workflow_state_checklist_milestone.md`, `docs/fact_resolver_condition_context.md`, and `docs/process-platform.md`; consolidating it here as one checklist is the improvement:

```typescript
// src/core/config/module-codes.config.ts — the ONE file every module touches to register itself
export const MODULE_CODES = {
  LAND_SCHEDULE: 'LAND_SCHEDULE',
  EMPLOYMENT_APP: 'EMPLOYMENT_APP',
  COMPENSATION_PAYROLL: 'COMPENSATION_PAYROLL',
  RNR_PAYROLL: 'RNR_PAYROLL',       // to be added when RnR graduates
  FORM_I_CLAIM: 'FORM_I_CLAIM',
  PAF_CENSUS: 'PAF_CENSUS',         // to be added when PAF graduates
  LEDGER: 'LEDGER',                 // to be added when Ledger graduates
} as const

export const CHECKABLE_ENTITY_TYPES = {
  ACQ_LAND_SCHEDULE: 'acq_land_schedule',
  PROJECT: 'project',
  EMPLOYMENT_APPLICATION: 'employment_application',
  COMPENSATION_PAYROLL: 'compensation_payroll',
  // ...one constant per checkable entity — raw strings are FORBIDDEN inline anywhere else
} as const
```

**The 8-step "bring a module to production" checklist** (this is the concrete, reusable procedure — every prototype module in §4 follows exactly this):

1. **Register the entity type & module code** in `module-codes.config.ts` (above).
2. **Register workflow states + transitions** as rows in `workflow_states` / `workflow_transitions` (SQL insert, no code) — see the CBA example in `docs/how_to_add_workflow_state_checklist_milestone.md`. Reuse `LAND_SCHEDULE`-style guard names (`ChecklistFullySatisfiedGuard`, `WithinProjectBaseline`) wherever the guard is generic; only write a new guard class when the check is truly module-specific, and put it in `GUARD_REGISTRY`.
3. **Write one `IFactSourceAdapter`** (≈20 lines, shown in §2.4) so the module's domain facts are visible to `show_if` rules and workflow guards. This is the only mandatory bespoke TypeScript per module.
4. **Seed checklist rules** as rows in `checklist_requirement_rule` (`chk_code`, `module_code`, `show_if`, `input_schema`) — no code.
5. **Seed milestone definitions** in `milestone_definition` / `milestone_dependency`, or add an entry in `milestone.config.ts` if the dependency graph is simple enough to keep in one config file.
6. **Register document templates** (if the module produces statutory forms) in `document_template(_field/_signature)`. The docx engine, review/sign lifecycle, and signature matrix resolver are already generic.
7. **Wire a thin repository** implementing `IXxxRepository` against the Prisma model that already exists (all prototype modules already have their tables). Register it in `src/infrastructure/di/modules/<module>.di.ts`.
8. **Compose the UI from existing generic components** (§3) — `<GenericChecklistWorkspace>`, `<ProcessActionCenter>`, `<UnifiedWorkflowTimeline>`, `<EntityFileManagerTrigger>`, `<MasterLookup>` — instead of hand-building new tables/forms/timelines.

This checklist is what makes rule #2 real: a brand-new department or a brand-new module type is workflow rows + checklist rows + one fact adapter + DI wiring — never a new engine.

### 2.3 WorkflowEngineServer — how it stays department/module agnostic

Already correct; documented for completeness because every other module's transition logic must delegate to it, not reimplement it.

```typescript
// Generic transition endpoint — the ONLY mutation path for any workflow state, any module
POST /api/workflow/transition
{
  "moduleCode": "EMPLOYMENT_APP",          // <- swap this per module, nothing else changes
  "entityType": "employment_application",
  "entityId": "emp-123",
  "toState": "ScreeningCommitteeReview",
  "actionName": "FORWARD_TO_SCREENING",
  "justification": "Form-VIII eligibility assessment complete."
}
```

Execution flow (identical for every module): authenticate → resolve current state via `WorkflowTargetResolverRegistry` → validate against `workflow_transitions` → run `WorkflowGuardEvaluator` (checklist completion, signatures, custom guards) → update `current_stage_cd` → write `workflow_action_history` (immutable timeline) → emit outbox event.

**Improvement item (close the loop for mode-aware resolution):** `resolveWorkflowCode(moduleCode, acqModeId)` today has a documented fallback for `LAND_SCHEDULE_*`. Extend the same fallback resolution to accept an arbitrary discriminator column name per module (e.g. `EMPLOYMENT_APP` discriminated by `application_type`, `COMPENSATION_PAYROLL` discriminated by `payroll_mode`) via a small `moduleDiscriminatorMap` in `workflow.config.ts`, instead of hardcoding `acqModeId`. This removes the last land-acquisition-specific assumption from the otherwise generic engine.

### 2.4 FactResolver — the adapter every prototype module needs (concrete example)

This is the one piece of genuinely new code each prototype module needs, and it is small and mechanical:

```typescript
// src/core/flags/adapters/EmploymentAppFactAdapter.ts
import { IFactSourceAdapter } from '@/core/flags/interfaces/IFactSourceAdapter'
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'
import { db } from '@/lib/db'

export class EmploymentAppFactAdapter implements IFactSourceAdapter {
  readonly entityType = CHECKABLE_ENTITY_TYPES.EMPLOYMENT_APPLICATION

  async resolveDomainFacts(entityId: string): Promise<Record<string, any>> {
    const app = await db.employment_application.findUnique({ where: { id: entityId } })
    if (!app) return {}
    return {
      status: app.status,
      is_female_nominee: app.gender === 'F',
      is_patta_land: app.land_type === 'PATTA',
      nominee_count: app.nominee_count ?? 0,
    }
  }
}
// Register once: factResolver.registerAdapter(new EmploymentAppFactAdapter())
```

Every `show_if` rule, every workflow guard, every dashboard KPI for that module can now reference `is_female_nominee`, `is_patta_land`, etc. with **zero further backend code** — this is what makes checklist item #23 in `docs/land-acquisition.md` (Direct Purchase mode-wise filtering) reusable for Employment's female-nominee counselling rule (Form-XXIII) without writing a bespoke resolver.

### 2.5 ChecklistService — reuse pattern for prototype modules

`GenericEntityContextResolver` already reads `context_fields` out of `process_definition.config_json`, so no custom resolver class is required for standard CRUD-shaped checklists (PAF census fields, payroll approval fields, ledger entry fields all qualify). Concrete reuse for PAF:

```sql
INSERT INTO master.checklist_requirement_rule
  (chk_id, chk_code, module_code, title, requirement_type, is_mandatory, show_if, input_schema)
VALUES
  (gen_random_uuid(), 'PAF_CL_003', 'PAF_CENSUS', 'Socio-Economic Baseline Survey',
   'document_upload', true, NULL, '{"allowed_types":["application/pdf"],"max_size_mb":20}');
```

The existing `<GenericChecklistWorkspace moduleCode={MODULE_CODES.PAF_CENSUS} checkableType={CHECKABLE_ENTITY_TYPES.PAF_CENSUS_RECORD} checkableId={id} />` renders this immediately — same component used by Land Acquisition today.

### 2.6 ManualMilestoneService — reuse pattern

Dependency-gated milestones are pure config (`milestone.config.ts` or DB rows). For Compensation Payroll:

```ts
COMP: [
  { id: 'AWARD_PUBLICATION', label: 'Compensation Award Published', requires: [] },
  { id: 'CLAIM_WINDOW_CLOSED', label: 'Award Claim Window Closed (2 months)', requires: ['AWARD_PUBLICATION'] },
  { id: 'TRIBUNAL_DEPOSIT', label: 'Tribunal Compensation Deposit', requires: ['CLAIM_WINDOW_CLOSED'] },
]
```

`recordMilestone()` already validates prerequisites, snapshots the entity (via `proposal_snapshot`-style pattern — see §7.3 on the immutable-history approach that makes this cheap), and dispatches an audit event — no per-module code.

### 2.7 Document Engine & File Management — already fully generic

No changes needed. Every prototype module reuses `<EntityFileManagerTrigger entityType={...} entityId={...} />` for ad-hoc uploads and registers its statutory forms (Form-VIII, Form-IX/X/XI for Payroll, Form-A/B/C for PAF/Employment — already catalogued in `docs/document-engine.md`) as `document_template` rows. The `GENERATE → ADDITIONAL_INFO → REVIEW → SIGN → COMPLETED` lifecycle, signature matrix resolver, and stale-review invalidation apply unchanged.

### 2.8 Notifications, Audit, Jobs — already fully generic

Zero work required. New modules only need one `event_registry` row + one `notification_rule` row per event they want to notify on (seed script), and a call to `EventBus.publish()` at the point of the business action. Audit is automatic on any Prisma mutation via `PrismaAuditExtension`; the only manual step is calling `Audit.logCustomAction()` for non-CRUD business events (state transitions, milestone recording).

### 2.9 ProjectLimitService — the improvement to build

**Problem:** limit-checking logic (`within_project_baseline`) currently lives embedded inside a workflow guard, which means it can only be *checked at transition time*, not queried live for a "3/5 acres remaining" dashboard tile or a real-time plot-add validation. Requirement #1 ("must improve service layer if needed") targets exactly this.

**Design — extract into a standalone, directly-callable service:**

```typescript
// src/core/project/ProjectLimitService.ts
export interface LimitCheckInput {
  projCd: string
  areaCd: string
  mouzaLgd?: number
  acqModeId: number
  candidateAreaHa: number        // proposed delta, e.g. plot being added
  candidateCostEst: number
  candidateEmploymentCount: number
}

export interface LimitCheckResult {
  withinApprovedArea: boolean
  withinLocationArea: boolean
  withinLandBudget: boolean
  withinRRBudget: boolean
  withinEmploymentQuota: boolean
  requiresCMDApproval: boolean
  requiresBoardApproval: boolean
  violations: string[]
  consumed: { area: number; budget: number; employment: number }
  remaining: { area: number; budget: number; employment: number }
}

export class ProjectLimitService {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly proposalRepo: IAcqProposalRepository, // read-only aggregate query
  ) {}

  async check(input: LimitCheckInput): Promise<Result<LimitCheckResult, DomainError>> { /* ... */ }
}
```

This becomes the **one guard function** `WithinProjectBaseline` in `GUARD_REGISTRY` delegates to, the **one function** the live "Limit Check" tab in the Proposal UI calls, and the **one function** the Project dashboard's "consumed vs available" tiles call. Same computation, three call sites, zero duplication — this is the concrete generic-service-layer improvement for requirement #1.

### 2.10 DeadlineTrackerService — the missing service to build

`deadline_tracker` exists in the schema (confirmed in the dump) but has no service. Build it as a thin, fully generic wrapper, following the exact pattern of `ManualMilestoneService`:

```typescript
// src/core/deadlines/DeadlineTrackerService.ts
export class DeadlineTrackerService {
  async schedule(entityType: string, entityId: string, deadlineType: string, dueDate: Date): Promise<void>
  async markMet(entityType: string, entityId: string, deadlineType: string): Promise<void>
  async getOverdue(scope: OrgScope): Promise<DeadlineDTO[]>          // feeds every role's dashboard
  async getUpcoming(scope: OrgScope, withinDays: number): Promise<DeadlineDTO[]>
}
```

Deadline rows are created automatically as a **workflow reaction** (`WorkflowReactionService`) whenever a transition row in `workflow_transitions` has `deadline_days` set — zero per-module code, matching the pattern used for milestone auto-creation. Reminder notifications route through the existing `EventBus`/outbox — no new delivery channel needed. This directly answers SOP deadlines already catalogued in `technical_design_document.md` §5.8 (3-week publication window, 2-week complaint disposal, 2-year CBA window, etc.) which are currently untracked.

---

## 3. Reusable UI Component Library

Requirement #3 ("must try to reuse any service or component UI") and #7 (UX skill for a friendly, beautiful UI) both land here. The platform already has an enterprise component set in `src/shared/components/coalrr/`; the rule going forward is **compose from this set — do not hand-roll new tables, timelines, or upload widgets per module.**

| Component | Path | Purpose | Reused by |
|---|---|---|---|
| `<ProcessActionCenter />` | `shared/components/coalrr/ProcessActionCenter.tsx` | Role-filtered action buttons, animated completion feedback, single decoupled entry point into `WorkflowEngineServer` | Proposal (as `ProposalActionCenterBanner`) — **must** become the default for Employment/PAF/Payroll/RnR/Ledger workspaces |
| `<UnifiedWorkflowTimeline />` | `shared/components/coalrr/UnifiedWorkflowTimeline.tsx` | Merged stage stepper + audit feed, avatar popovers | Proposal — reuse verbatim for every module |
| `<WorkflowActionCommandCenter />` / `<WorkflowTimelineFeed />` | `shared/components/coalrr/workflow/` | Pending-action classification (`ACTIONABLE_BY_ME`, `WAITING_ON_ASSIGNEE`, `BLOCKED_BY_PREREQUISITE`, `COMPLETED`, `NOT_AUTHORIZED`) + KPI counters | Any module — pass `moduleCode` + `entityType` |
| `<GenericChecklistWorkspace />` | `core/checklist/components/` | Dual-tab (generated forms / operational compliance) checklist workspace with typed field micro-components | Any module with a `checklist_requirement_rule` set |
| Typed checklist fields | `core/checklist/components/fields/` | `GeneratedDocumentField`, `DocumentUploadField`, `BooleanField`, `TextInputField`, `NumberInputField`, `DateField`, `SelectField` | Reused automatically by `GenericChecklistWorkspace`; never hand-build a field type |
| `<DocumentWorkspaceModal />` | `shared/components/coalrr/DocumentWorkspaceModal.tsx` | Dynamic form, review history card, sequential signature UI, dual-format download | Any module producing statutory documents |
| `<EntityFileManagerModal /> / <EntityFileManagerTrigger />` | `shared/components/coalrr/file-manager/` | 3-tab file workspace (attached / upload / link repository) with live count badge | Any entity — Project, Proposal, and every prototype module |
| `<MasterLookup /> / <MasterAutocomplete /> / <Combobox />` | `core/master-lookup/components/`, `shared/components/ui/combobox.tsx` | Cascading, cached master dropdowns (State→District→Block→Mouza, etc.) | Every form in every module — never build a bespoke `<select>` for master data |
| `<StateBadge />` | `shared/components/coalrr/StateBadge.tsx` | Dynamic, DB-driven state label/color/icon rendering with graceful fallback | Any module's workflow state chip |
| `<CollapsibleSectionCard />` | `shared/components/coalrr/CollapsibleSectionCard.tsx` | Glassmorphic collapsible wrapper for secondary metadata | Any detail page sidebar |
| `<Can /> <CanAny /> <Cannot /> <RoleGuard />` | `core/authorization/components/` | Declarative permission gating in JSX | Every screen — see §6 |
| `LocalizationDataTable` / `LocalizationFilters` | `modules/localization/components/` | Server-filtered admin data table pattern (URL search params, never client-side full-load) | The canonical "list of records" pattern — every module's list screen should follow this shape, not a fresh `useState` table |

### 3.1 UI/UX design direction (requirement #7)

- **One page shape, module-agnostic:** header command bar (`ProcessActionCenter`) → 12-column responsive grid → left 8-col tabbed workspace (Overview / Compliance Checklist / [module-specific data] / Statutory Milestones) → right 4-col sidebar (`ApprovalPanel` + `UnifiedWorkflowTimeline` + `LimitCheckPanel`/module KPI panel). This is exactly the Proposal page layout in `docs/land-acquisition.md`; reuse it verbatim for Employment, PAF, Payroll, RnR, and Ledger workspaces instead of inventing new layouts.
- **Enterprise data-dense list views** use `@tanstack/react-table` + shadcn (per Project Master's list pattern) with embedded progress bars and status badges — not card grids — for every module's list screen.
- **Performance-conscious composition:** heavy tabs are lazy-loaded via `next/dynamic({ ssr: false })` with skeleton fallbacks (`SectionSkeleton.tsx`), which is how Proposal achieves <100ms initial render. Every new module workspace inherits this pattern rather than re-deriving it.
- **Consistent motion & feedback:** `ProcessActionCenter`'s animated checkmark completion and `StateBadge`'s color system are the platform's visual vocabulary — new modules reuse the same variants (`warning`/`success`/`info`/`destructive`) instead of introducing new color meanings.

---

## 4. Module-by-Module Implementation

### 4.1 Project Master (🟢 Active)

**Bounded context:** approved project baseline — the parent limit-control record every proposal is created under.

**Layers:**
- Use cases: `CreateProjectUseCase`, `UpdateProjectUseCase`, `GetProjectDashboardUseCase`, `LockProjectUseCase`, `ApproveFormXXIIUseCase` — wired in `src/infrastructure/di/modules/project.di.ts`.
- Repository: `PrismaProjectRepository` — single source of truth for `master.project`, `master.project_mine`, `master.proj_aprv`, `master.proj_aprv_location`.
- Validation: `src/core/validation/schemas/project.schema.ts` (Zod, shared client/server).

**Data model (from live schema):**
- `master.project` (`proj_cd` PK) — code, name, land/R&R budget, GIS `boundary`, `statutory_clearances` JSON, `is_combo_project`, `lockedAt`.
- `master.project_mine` (`proj_cd`,`mine_cd` composite PK) — unified junction for single-mine and combo (multi-mine) projects; `is_primary` flag; Area Office resolved via `master.mine.area_cd` (3NF, no redundant `area_cd`/`mine_cd` columns).
- `master.proj_aprv` (`aprv_cd` PK) — statutory sanction approvals (EC/FC/Board) with per-land-type caps + `emp_sanc`.
- `master.proj_aprv_location` (`aprv_location_code` PK) — mouza-level acreage ceilings, linked to `master.mouza`.

**Lifecycle:** `Draft → Form XXII Submitted → Form XXII Approved → Baseline Locked`. Lock is irreversible; post-lock changes are new approval records, never edits to history (this is the immutable-append pattern also used at the plot level — see §7.3).

**Generic-service integration:** Form-XXII generation via Document Engine; baseline breach detection via the `WithinProjectBaseline` guard (to be re-pointed at `ProjectLimitService`, §2.9) which auto-escalates the *consuming* proposal's workflow to `BoardEscalation`; all mutations audited via `AuditService`; queries scoped via `UserScopeService.scopeToWhere()`.

**Screens (6 tabs, per the confirmed UI plan):** Overview · Approved Limits · Approval Records · Location/Mouza Breakup · Documents · Proposals (list of child proposals). Actions: Save Draft → Add Approval → Add Location → Validate → Lock → Generate Form-XXII.

**Gaps / improvements:**
1. `ProjectLimitService` extraction (§2.9) — today the "Approved Limits" tab and the Proposal's "Limit Check" tab likely compute consumption independently; unify on one service.
2. Wire `docs/project-merging-plan.md` (`MergeProjectsUseCase`, `POST /api/projects/[id]/merge`) when multi-project consolidation becomes a near-term need — schema migration is already fully specified (adds `merged_into_proj_cd`, `merged_at`, `merge_remarks` to `master.project`), so this is additive, not a redesign.
3. Add a `DeadlineTrackerService` hook to Form-XXII submission → approval so the 3-week/2-week SOP windows are tracked, not just implied.

### 4.2 Land Acquisition / Proposal (🟢 Active — reference implementation)

**Bounded context:** full lifecycle of Land Acquisition Proposals (LAPs) under a locked project — mode selection, plot scheduling, checklist compliance, document generation, workflow routing to approval.

This module is the **template every other module should copy**, because it is the only one currently wired end-to-end into every generic service in §2.

**Data model:**
- `acquisition.acq_proposal` — `proposal_id` (UUID PK), `acq_mode_id`, `current_stage_cd` (defaults `DOCKET_PREP`), `overall_status` (defaults `DRAFT`), `is_within_pr_limit` with a **DB-level CHECK constraint** (`chk_pr_limit_needs_cmd_approval`: `is_within_pr_limit = true OR cmd_admin_approval_ref IS NOT NULL`) — a good example of pushing an invariant into the database itself, not just application code, and worth replicating for Payroll/RnR approval gating.
- `acquisition.plot_schedule` + `acquisition.plot_schedule_history` (SCD2 history table, trigger-populated — see §7.3) + `acquisition.plot_schedule_land_type` (per-land-type breakup, `use_purpose` enum for baseline deviation calc).
- Checklist: `master.checklist_requirement_rule` (`chk_id` UUID PK, `chk_code` unique) × `public.checklist_submission`.

**Creation wizard (`CreateProposalDialog.tsx`):** 2-step — (1) mode & basic parameters (workflow type, locked-project select, `STANDARD_ACQ_MODES` picker mapped to `master.acqu_mode.acq_mode_id`, reference no., date) → (2) techno-economic rates & Form-XXII Item 8 justification. Exceptional cases (Debottar/Tribal/Formal-negotiation land) are handled inside the workspace tabs post-creation, not in the wizard — keeps the fast-path creation flow uncluttered.

**Lifecycle (mode-dependent, resolved via `resolveWorkflowCode`):**
```
Direct Purchase (mode 6): Drafting → UnitSubmitted → CrossCollieryVerification → AreaVetting → HqParallelVetting → GmLreReview → DocketIssued → Published
Standard LAP:             Drafting → UnitSubmitted → AreaVetting → HqParallelVetting → BoardEscalation → Published
```

**Form-VII 12-signature joint reconciliation:** 6 signatures from the purchasing colliery (Land Clerk → Survey Officer → Project Manager → Project Agent → Area Land Officer → Area GM) + 6 from the adjacent colliery, computed dynamically by `FormVIIResolver.ts` off `document_template_signature` seed rows — a strong existing example of the generic Document Engine signature matrix handling a genuinely complex statutory requirement without bespoke code.

**Business rules (already implemented, keep as the canonical reference for other modules' similar rules):**
- Dynamic land categorization (`buildLandCategoryMap`) via `master.landtype_master` hierarchy traversal → `TENANCY | PATTA | GOVT | FOREST` — never hardcoded IDs.
- Employment quota: `Math.floor((tenancyLand + pattaLand) / 2)`; Govt/Forest land yields zero jobs by rule.
- Mode-wise checklist filtering via `show_if` (Direct Purchase suppresses CBA-only statutory forms; CBA renders Section 4/7/9/11 Gazette milestones).
- Single-file-record replacement rule on document regeneration — prevents orphaned storage files.

**UI architecture (the pattern to copy):** `ProposalHeaderSection` (hosts `ProposalActionCenterBanner`) → `ProposalOverviewSection` / `ProposalChecklistSection` (wraps `GenericChecklistWorkspace`) / `ProposalPlotsSection` / `ProposalMilestonesSection` (wraps `ManualMilestonePanel`) tabs → `ProposalWorkflowSidebarSection` (`ApprovalPanel` + `WorkflowTimelineFeed` + `LimitCheckPanel`). All heavy tabs lazy-loaded.

**Gaps / improvements:**
1. Citizen Form-I claim intake (`public.form_i_claim` table exists) is not yet linked into the Proposal workspace's "Citizen Claims" tab per the original module plan — wire `GET /api/proposals/[id]/claims` once the citizen portal (Phase 4) exists.
2. Compensation/R&R payroll linkage from Proposal → `compensation_payroll`/`rnr_asset_payroll` is not yet built; this is exactly the seam Payroll/RnR modules need to cross when they graduate (§4.3–4.4).
3. Point the `WithinProjectBaseline` guard at the extracted `ProjectLimitService` (§2.9) instead of any inline computation, once extracted.

### 4.3 Prototype Modules — bring-to-production plan

All five prototype modules share the same shape of gap: **the database table exists, a domain repository *interface* exists, but there are no use cases, no DI wiring, and no UI.** Each is brought to the same maturity as Land Acquisition by executing the 8-step checklist in §2.2 against its existing table. No new engine is required for any of them.

#### 4.3.1 Employment (`modules/employment/`)

- **Existing:** `employment_application` table, `nominee_pool`/`nominee_pool_contribution` tables, `INomineePoolRepository.ts` interface, two orphaned use cases already sketched at the application layer (`GetNomineePoolsUseCase`, `GetNomineePoolDetailUseCase`).
- **To build:** `PrismaEmploymentRepository` implementing both `IEmploymentApplicationRepository` (new) and `INomineePoolRepository`; `CreateEmploymentApplicationUseCase`, `UpdateEmploymentApplicationUseCase`, `SubmitEmploymentApplicationUseCase`, `GetEmploymentApplicationUseCase`; `employment.di.ts`.
- **Reuse, don't rebuild:** `EmploymentAppFactAdapter` (§2.4, already sketched), checklist rules for Form-V/VI/VIII/IX/X/XI/XII/XIII/XIV (templates already catalogued in `docs/document-engine.md` — `FORM_VIII`, `FORM_A/B/C`, `ATTESTATION_FORM`), workflow states mirroring SOP Steps 4–7 (`UnitAssembly → UnitVerification → AreaVerification → HqScreeningCommittee → WebsitePublication(21d) → Appointed`), `<GenericChecklistWorkspace>` + `<ProcessActionCenter>` for the workspace UI.
- **Module-specific logic actually needed:** female-nominee counselling gate (Form-XXIII) as a workflow guard reading `is_female_nominee` from the fact adapter; patta-land appointment gate (blocks `Appointed` transition until a `POSSESSION_HANDOVER`-equivalent milestone exists) — both expressible as existing guard/milestone primitives, not new subsystems.

#### 4.3.2 PAF / Rehabilitation (`modules/paf/`)

- **Existing:** `paf_census_record` table, `IPafRepository.ts` interface, five orphaned use cases at the application layer (`CreatePafRecordUseCase`, `GetPafRecordUseCase`, `ListPafRecordsUseCase`, `UpdatePafRecordUseCase`, `DeletePafRecordUseCase` — already written, just not wired to a repository or UI).
- **To build:** `PrismaPafRepository`; `paf.di.ts` wiring the five existing use cases; UI workspace (census recording, socio-economic baseline entry, R&R package proposal — CL-3, 14 items per `technical_design_document.md` Appendix B).
- **Reuse:** Form-XIX (Patta Affidavit) / Form-XX (Patta Agreement) already catalogued in the Document Engine template suite; CL-3 checklist as `checklist_requirement_rule` rows scoped `module_code = 'PAF_CENSUS'`.

#### 4.3.3 Compensation Payroll (`modules/payrolls/`)

- **Existing:** `compensation_payroll` / `compensation_payroll_line` tables, `IPayrollsRepository.ts` interface, six orphaned use cases (`CreatePayrollUseCase`, `AddPayrollLineUseCase`, `UpdatePayrollFactorUseCase`, `DeletePayrollLineUseCase`, `GetPayrollByIdUseCase`, `GetPayrollsUseCase`).
- **To build:** `PrismaPayrollRepository`; `payroll.di.ts`; the solatium/interest calculation should live in a small `CompensationCalculationService` (pure function, config-driven — solatium 30%, interest rate, cut-off date 2015‑09‑01, all sourced from `src/config/compensation.config.ts`, never hardcoded) rather than inline in a use case, so RnR Payroll (§4.3.4) can reuse the same rate-application logic.
- **Reuse:** `form_d_ledger_entry` for the auto-populated Compensation & R&R Register (Form-D); `FORM_IX/X/XI/XII` templates already catalogued; Award publication as a `manual_milestone` type with `deadline_tracker` rows for the 2-month claim window and 3-month tribunal-deposit window.

#### 4.3.4 RnR (Asset) Payroll (`modules/rnr-payrolls/`)

- **Existing:** `rnr_asset_payroll` / `rnr_asset_payroll_line` tables, `ILedgerEntryRepository`-adjacent `IRnrPayrollRepository.ts` interface, eight orphaned use cases already written (create/add-line/update-line/delete-line/get/list/delete-payroll/update-state).
- **To build:** `PrismaRnrPayrollRepository`; `rnr-payroll.di.ts`; reuse the `CompensationCalculationService` from §4.3.3 for asset (structure/tree) valuation at SOR rates rather than duplicating rate logic.
- **Note on parallelism:** per the Phase‑II process flow note, R&R and Compensation tracks run **in parallel** and converge only at final payment. Model this as two independent `process_instance` rows (same `entity_id`, different `moduleCode`) that a small `PaymentConvergenceReaction` (a `WorkflowReactionService` rule, not new infrastructure) checks before allowing the final "Disbursed" transition on either — this is a pure configuration use of the existing reaction engine, not a new synchronization mechanism.

#### 4.3.5 Ledger (`modules/ledger/` / `application/use-cases/ledger/`)

- **Existing:** `AppendLedgerEntryUseCase`, `ListLedgerEntriesUseCase` already written against `form_d_ledger_entry`; `ILedgerEntryRepository.ts` interface stub; no module UI folder yet.
- **To build:** `PrismaLedgerRepository`; `ledger.di.ts`; a read-only, filterable ledger view (reuse the `LocalizationDataTable` server-filtered list pattern, §3) embedded as a tab inside Payroll/RnR workspaces rather than a standalone top-level module — the ledger is disbursement history, it belongs alongside the payroll it settles.
- **Rule to enforce at the domain layer:** ledger entries are **append-only** (no update/delete use case should ever exist) — mirrors the immutable-history philosophy in §7.3 and is the correct DDD modeling for a financial ledger (it's an event log, not a mutable record).

#### 4.3.6 Org (`modules/org/`)

- **Existing:** mature domain service (`UserScopeService`), five application use cases already written (`AssignUserScopeUseCase`, `TransferUserUseCase`, `ListUserScopeHistoryUseCase`, `GetAdjacentMinesUseCase`, `UpdateMineAdjacencyUseCase`), three UI components (`MineAdjacencyField`, `TransferUserDialog`, `UsersView`).
- **Gap:** this is closer to "thin UI, mature backend" than "prototype" — the main missing piece is a dedicated **scope history timeline view** (reusing `<UnifiedWorkflowTimeline>` against `user_org_scope` effective-dated rows) so an HQ admin can audit who had what scope when. See §9 for the full assessment — this module is the mechanism behind org-scope RBAC, so its correctness matters more than its screen count.

### 4.4 Mature platform primitives (Document Engine, File Management, Admin) — no rebuild, only extension points

These three are already production-grade and generic; they are listed here only to record the extension points other modules will use, not because they need work:

- **Document Engine:** add new `document_template` rows for each prototype module's statutory forms; no code changes to the engine itself.
- **File Management:** add a new `entity_type` string constant + one RBAC permission row set (`<module>.file.workspace.view/upload/unlink`) per module (§6.2 pattern); no code changes to upload/scan/versioning logic.
- **Admin:** `MasterDataRegistry` already supports registering new master tables generically (`modules/admin/master-data/config/MasterDataRegistry.ts`) — any new lookup table a prototype module needs (e.g. a `sor_rate_master` for RnR valuation) is a registry entry, not a new CRUD screen.

---

## 5. DDD & Clean Architecture Compliance

Requirement #5. The base building blocks already exist in `src/core/base/` and `src/core/errors/` and `src/core/result/` — every module, including the prototypes, must build on these rather than inventing parallel patterns.

| Building block | File | Rule |
|---|---|---|
| `Entity<T>` | `core/base/Entity.ts` | Identity-based equality; all domain entities extend this |
| `AggregateRoot<T>` | `core/base/AggregateRoot.ts` | Owns `DomainEvent[]`; the transactional consistency boundary (`Project`, `Proposal` today; `EmploymentApplication`, `CompensationPayroll` should graduate to this once they leave prototype status) |
| `ValueObject` | `core/base/ValueObject.ts` | Immutable, structurally-equal — e.g. `Money` (`domain/value-objects/Money.ts`, `decimal.js`-backed to avoid float error in compensation math — reuse this for every payroll amount, never `number`), `Area` |
| `DomainEvent` | `core/base/DomainEvent.ts` | Raised by aggregates, consumed by `IEventBus` — this is the same bus workflow reactions and notifications already use (§2.8) |
| `Result<T,E>` | `core/result/Result.ts` | Every use case and service returns `Result`, never throws for expected failures — `ProjectLimitService.check()`, `ManualMilestoneService.recordMilestone()` already follow this; new services must too |
| `DomainException` / `NotFoundException` / `UnauthorizedException` / `ValidationException` | `core/errors/` | Typed exception hierarchy for the *unexpected* failure path (Result is for expected business-rule failures; exceptions are for genuine faults) |
| `Repository.interface.ts` / `UseCase.interface.ts` | `core/interfaces/` | Every repository implements a domain-owned interface (`IProjectRepository`, `IPafRepository`, etc.); every use case implements the generic `IUseCase<TRequest, TResponse>` contract |

**Layering rule, restated as a lint-able policy:** UI components → call Server Actions or route handlers only → which call Use Cases only → which call domain services / repository *interfaces* only → whose Prisma implementations live exclusively in `infrastructure/persistence`. `docs/architecture_review.md` already encodes this as a standing review checklist; treat any prototype module's direct `db.*` call from a route handler as a defect to fix during the bring-to-production pass in §4.3, not a pattern to imitate.

**Where the prototype modules currently under-model the domain:** their orphaned use cases operate on plain DTOs against Prisma models directly (no `Entity`/`AggregateRoot`/`ValueObject` layer yet). Bringing them to production is the right moment to introduce the domain layer — e.g. `EmploymentApplication extends AggregateRoot`, `CompensationAmount` as a `Money`-based value object — rather than perpetuating anemic-model use cases.

---

## 6. Security & RBAC

Requirement #8.

### 6.1 Authentication

- Session tokens: `public.auth_session`, stored `httpOnly + secure + sameSite` cookies only (never localStorage/JWT-in-client).
- Citizen-facing auth: OTP-based (`public.otp_session`), CAPTCHA-protected (`public.captcha_challenge/config/audit_log` — math or SVG provider, DB-configurable difficulty, no redeploy needed to raise the bar under attack).
- Password reset: `public.auth_reset_token`.

### 6.2 Authorization

- **14 canonical enterprise roles** across 4 tiers (Unit/Area/HQ/Apex — full table in `docs/user-management.md`), backed by `public.role`, `public.permission`, `public.model_has_role`, `public.model_has_permission`, `public.role_has_permission` — a standard, already-implemented Prisma RBAC schema.
- **Server-side enforcement only.** Every API route and Server Action calls `authorizeApi(permissionKey)`; `<Can>/<CanAny>/<Cannot>/<RoleGuard>` client components are UX affordances, never the actual gate. This is already the documented rule — the discipline required going forward is that the five prototype modules follow it from their first commit rather than being retrofitted.
- **Module-scoped file permissions** already follow a clean per-module naming convention (`project.file.workspace.view/upload/unlink`, `acquisition.file.workspace.*`, `proposal.file.workspace.*`, with a `file.workspace.*` global fallback) — replicate this exact naming pattern for each prototype module's file permissions (`employment.file.workspace.*`, `payroll.file.workspace.*`, etc.) rather than inventing a new convention per module.
- **Org-scope enforcement** (`user_org_scope`, `UserScopeService.scopeToWhere()`): `HQ` = company-wide, `AREA` = filtered by `area_cd`, `UNIT` = filtered by `mine_cd`. This must be the **first call in every use case**, not an afterthought — see §9 for the one place this needs hardening (citizen scope).

### 6.3 Document & file security

- Virus scanning (`ClamAVScanner`) on every upload buffer before disk write.
- Path traversal protection via strict filename sanitization regex in API routes.
- Watermarked, QR-verifiable PDF downloads (`/api/files/[fileId]/download?format=pdf`) vs. permission-gated raw `.docx` download (`document.download_docx` — HTTP 403 otherwise).
- Signed URL framework (AES-256-GCM encrypted params, `signed_url_log` audit trail) for time-limited download links — reuse this for any prototype module's document delivery instead of building ad-hoc download endpoints.

### 6.4 Input & transport security

- Zod `safeParse()` server-side on every route handler — **never** `schema.parse()` (which throws unhandled) — this is enforced today and must not regress as prototypes graduate.
- CAPTCHA on public-facing endpoints (citizen claim submission, OTP request).
- Audit trail captures `x-forwarded-for` and `user-agent` automatically via `PrismaAuditExtension` + Next.js `headers()` — no manual plumbing needed in new use cases.

### 6.5 Data classification note

`entry_by`/`updt_by` store **only** the authenticated user ID (never raw email/name) — a good existing PII-minimization discipline; every new module's Prisma writes must follow the same standard (`String(auth.user.id)`, epoch `BigInt` timestamps).

---

## 7. Performance & Data Handling

Requirement #9.

### 7.1 Multi-tier caching (`ConfigCacheService`)

Low-churn configuration (`checklist_requirement_rule`, `workflow_transitions`, `workflow_states`) is cached L1 (in-process, 5-min TTL) → L2 (Redis via `ioredis`, multi-node) → DB fallback (auto-repopulates both tiers on miss). Every prototype module's checklist/workflow rows benefit from this automatically — no per-module cache code.

### 7.2 Master data — three-tier client cache

React Query (RAM, 1h `staleTime`) → IndexedDB (`coalrr_master_cache`, 24h TTL, handles 500MB+) → DB (`/api/master-data/lookup/[table]`). Auto-sync via `MasterDataPrefetcher` polling `MAX(updt_ts)` on load / every 5 min / on window focus, wiping IndexedDB only on version drift. This gives every module's dropdowns (mine, area, mouza, block, district, landtype, caste, etc.) 0ms perceived latency for free — reuse `<MasterLookup>`, never fetch master data ad hoc.

### 7.3 Immutable history instead of full-JSON snapshots (SCD2)

This is the platform's most important data-handling decision and should be the model for every module that needs legal non-repudiation (Payroll awards, RnR possession records, PAF census snapshots):

- Shadow history table per audited table (`plot_schedule_history` exists today, trigger-populated: `sys_action`, `sys_period_start`, `sys_period_end`).
- A milestone event (Section 7 Gazette, Award Publication, Possession Handover) records **only a timestamp** — reconstructing "what did the data look like at that moment" is a temporal query against the history table, not a stored JSON blob.
- Result: zero duplication when a record never changes between milestones, API response time for milestone recording drops from a full-table serialize to a single timestamp write, and the guarantee is enforced at the **database trigger level** — even a manual `UPDATE` outside the application can't bypass it.
- **Action item:** apply the same `_history` shadow-table + trigger pattern to `compensation_payroll_line`, `rnr_asset_payroll_line`, and `paf_census_record` as those modules graduate — these are exactly the tables where a tribunal dispute could later require proving "what was the sanctioned amount on the date of the award."

### 7.4 Query & N+1 avoidance

`FactResolver` resolves all domain facts, computed metrics, and flag overrides **once per request** into an immutable `ConditionContext`, then every checklist/workflow/document rule evaluates against that single resolved object — this is the platform's answer to N+1 query risk for rule-heavy screens, and every prototype module's rule evaluation should route through it rather than querying the DB per rule.

### 7.5 Indexing & pagination

Confirmed/recommended composite indexes (additive, safe to run against the live DB — see §10):
```sql
CREATE INDEX IF NOT EXISTS idx_acq_proposal_proj_area_status
  ON acquisition.acq_proposal(proj_cd, area_cd, overall_status);
CREATE INDEX IF NOT EXISTS idx_plot_schedule_proposal
  ON acquisition.plot_schedule(proposal_id, mouza_lgd, plot_no);
CREATE INDEX IF NOT EXISTS idx_checklist_submission_entity
  ON public.checklist_submission(checkable_type, checkable_id, status);
CREATE INDEX IF NOT EXISTS idx_manual_milestone_entity
  ON public.manual_milestone(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_deadline_tracker_entity
  ON public.deadline_tracker(entity_type, entity_id, is_met);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_lookup
  ON public.workflow_transitions(workflow_code, from_state, is_active);
-- New for prototype modules once their tables get real query traffic:
CREATE INDEX IF NOT EXISTS idx_employment_application_status
  ON public.employment_application(status, mine_cd);
CREATE INDEX IF NOT EXISTS idx_compensation_payroll_status
  ON public.compensation_payroll(status, proposal_id);
```
Server-side pagination + URL-search-param filtering is already the mandated list pattern (`LocalizationDataTable`) — every new module list screen must follow it rather than loading full tables client-side.

### 7.6 Background work

All async side effects (notification dispatch, document generation, audit writes, deadline reminders) go through `JobDispatcherService` — synchronous in dev (no Redis needed locally), BullMQ-queued in prod, with a 60-second outbox "safety-net" sweep for orphaned events after a crash. No prototype module should ever call an email/notification provider directly.

---

## 8. Validation Strategy

Requirement #10.

- **Single Zod schema per entity**, in `src/shared/schemas/*.schema.ts` (or `src/core/validation/schemas/` for platform-level entities), imported by **both** the client (`zodResolver` in `react-hook-form`) and the server (`safeParse()` in the route handler / Server Action) — one definition, two enforcement points, zero drift.
- **Real-time validation:** forms configured `onTouched` + `onChange` per the existing convention.
- **Error messages are translation keys, never literals** — Zod `.refine()`/`.min()` messages are `'validation.*'` keys resolved through `t()` at render time (`next-intl`), which is what makes the platform genuinely multi-language rather than English-with-translated-labels.
- **Schema-driven dynamic forms:** `document_template_field.input_schema` and `checklist_requirement_rule.input_schema` both generate a runtime Zod schema server-side and re-validate on submit — this pattern (config defines validation, not code) is what every prototype module's dynamic fields (PAF census fields, payroll line fields) should use instead of a hardcoded form schema per module.
- **Database-level invariants as a second line of defense** — the `chk_pr_limit_needs_cmd_approval` CHECK constraint on `acq_proposal` (§4.2) is a good pattern: critical business invariants that must never be violated even by a bad migration or a bug should be enforced at the DB layer too, not only in Zod. Recommend the same treatment for the ledger's append-only rule (§4.3.5) — a `BEFORE UPDATE/DELETE` trigger that raises an exception is stronger than "the use case just doesn't expose an update method."

---

## 9. User & User-Scope Module — Assessment

Requirement #11 ("check the user & user scope module is properly developed").

### 9.1 What is properly developed

- **Identity & session model** is complete: `public.user`, `public.auth_session`, `public.otp_session`, `public.auth_reset_token` all present in the live schema; session cookies are `httpOnly+secure+sameSite`.
- **RBAC schema is complete and standard-shaped**: `role`, `permission`, `model_has_role`, `model_has_permission`, `role_has_permission` — this is a well-known, correct pattern (Spatie-style polymorphic RBAC), not a bespoke reinvention.
- **14 roles are meaningfully scoped to the real SOP actor hierarchy** (Unit/Area/HQ/Apex), each with specific, named permissions (`form_vii.sign.purchasing_land_clerk`, `form_xxii.sign.area_gm`, etc.) rather than generic CRUD permissions — this level of granularity is what lets the Document Engine's signature matrix resolver (§2.7) work correctly per statutory form.
- **`user_org_scope` is a genuinely generic, effective-dated scoping mechanism** (`scope_level`, `area_cd`, `mine_cd`, `effective_from`, `effective_to`) — it already supports the "transfer a user to a new mine on a future date without losing history" case, which most simpler RBAC implementations don't.
- **`UserScopeService.scopeToWhere()`** is the single, reusable Prisma `where`-clause generator that every module's repository should call — this is exactly the kind of generic service requirement #2 asks for, and it already exists.
- **Multi-tenant isolation** exists at the schema level (`master.tenant`, `tenant_id` on `user` and `project`) — ready for a CIL-subsidiary-level (BCCL, CCL) rollout without schema changes, matching the "department as configuration, not code" principle.

### 9.2 Real gaps

1. **No explicit `CITIZEN` role/scope model.** The 14-role table and `user_org_scope` are built entirely around internal ECL staff (`UNIT/AREA/HQ`). Citizens authenticate via OTP into a *separate* session mechanism (`otp_session`) but there's no evidence of a `CITIZEN` scope level in `user_org_scope`, and `form_i_claim` doesn't show an explicit "citizen sees only their own claim" enforcement path in the reviewed docs. **Recommendation:** add `scope_level = 'CITIZEN'` with `owner_ref` (linking to the claimant identity) as a first-class case in `UserScopeService.scopeToWhere()`, rather than special-casing citizen auth outside the org-scope framework. This is the single clearest security gap for the upcoming Citizen Self-Service Portal phase.
2. **No scope-change audit UI**, despite the underlying data being fully audit-logged (`AssignUserScopeUseCase`, `TransferUserUseCase` both exist and both write to `audit.activity_log`). An HQ admin currently has no dedicated screen to answer "who had access to Area X on date Y." **Recommendation:** the `<UnifiedWorkflowTimeline>` component (§3) is directly reusable here — render it against `user_org_scope` effective-dated rows instead of building a new timeline component (§4.3.6).
3. **Standard test accounts are broad company-wide for every HQ role** (`gm.lre@`, `gm.planning@`, etc. all show "Company-wide" scope) — correct for HQ by SOP design, but worth confirming this seed data is dev/test-only and not what ships to a production tenant onboarding flow.
4. **No documented account lifecycle** (deactivation, re-activation, forced session revocation on role change) in the reviewed `user-management.md` — `public.user` presumably has a status column, but the *use case* for "immediately revoke all sessions when a user's role is downgraded" isn't called out. **Recommendation:** add `RevokeUserSessionsUseCase` triggered as a reaction to `UpdateUserRoleUseCase`/`AssignUserScopeUseCase`, reusing the existing `EventBus` — this closes a real security hole (a demoted user staying logged in with the old permission set until token expiry) with a small, additive change.

**Overall verdict:** the user & user-scope module's *data model and core service* are well-developed and genuinely reusable (§9.1) — it is a good foundation, not a rebuild target. The gaps are additive: one new scope level, one audit screen, one session-revocation reaction.

---

## 10. Database Additions Required

Per the existing house rule (SQL delivered for manual review — do **not** auto-run `prisma migrate dev`; after execution, run `npx prisma db pull && npx prisma generate`). Cross-checked against the live dump: `manual_milestone`, `deadline_tracker`, and `proposal_snapshot` **already exist** — they are not gaps, they are unused/under-used assets (§2.10, §7.3). The genuine additive items are:

```sql
-- 1. Project merging support (docs/project-merging-plan.md — additive, non-breaking)
ALTER TABLE master.project
  ADD COLUMN IF NOT EXISTS merged_into_proj_cd VARCHAR(30),
  ADD COLUMN IF NOT EXISTS merged_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS merge_remarks TEXT;

ALTER TABLE master.project
  ADD CONSTRAINT fk_project_merged_into
  FOREIGN KEY (merged_into_proj_cd) REFERENCES master.project(proj_cd)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- 2. Citizen scope support (closes §9.2 item 1)
ALTER TABLE public.user_org_scope
  ADD COLUMN IF NOT EXISTS owner_ref VARCHAR(64);
  -- scope_level enum/check should be extended to allow 'CITIZEN' at the application/Zod layer;
  -- confirm current column type before adding a CHECK constraint here.

-- 3. History (SCD2) shadow tables for legal non-repudiation on the modules graduating from
--    prototype status (mirrors the existing acquisition.plot_schedule_history pattern)
CREATE TABLE IF NOT EXISTS public.compensation_payroll_line_history
  (LIKE public.compensation_payroll_line INCLUDING ALL);
ALTER TABLE public.compensation_payroll_line_history
  ADD COLUMN IF NOT EXISTS sys_action VARCHAR(10),
  ADD COLUMN IF NOT EXISTS sys_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sys_period_end TIMESTAMPTZ;
-- Repeat the same pair (shadow table + trigger) for rnr_asset_payroll_line and paf_census_record
-- once each module leaves prototype status; install the trigger following the exact pattern
-- already proven on acquisition.plot_schedule.

-- 4. Performance indexes for prototype tables once they carry real query traffic (§7.5)
CREATE INDEX IF NOT EXISTS idx_employment_application_status
  ON public.employment_application(status, mine_cd);
CREATE INDEX IF NOT EXISTS idx_compensation_payroll_status
  ON public.compensation_payroll(status, proposal_id);
CREATE INDEX IF NOT EXISTS idx_rnr_asset_payroll_status
  ON public.rnr_asset_payroll(status, proposal_id);
CREATE INDEX IF NOT EXISTS idx_paf_census_record_status
  ON public.paf_census_record(status, proposal_id);

-- 5. Cleanup item noted during review: master.mst_mouza / public.mst_mouza appear in the live
--    dump despite docs/project-master.md stating legacy demo master tables (mst_plot, mst_mouza)
--    were purged. Confirm whether this table is still read anywhere before dropping it — flagged
--    here, not dropped, since we don't rebuild/remove without confirmation.
```

Everything above is additive: new columns with `IF NOT EXISTS`, new tables, new indexes. Nothing here alters or drops an existing column, consistent with "don't start from fresh, use existing system knowledge & incomplete db."

---

## 11. Build Sequence & Roadmap

Ordered to respect dependency: generic-service completion first (so every subsequent module gets it for free), then the two active modules' remaining seams, then the five prototypes in priority order, then cross-cutting reporting.

| Phase | Work | Depends on |
|---|---|---|
| **P0 — Service layer completion** | Extract `ProjectLimitService` (§2.9); build `DeadlineTrackerService` (§2.10); extend `resolveWorkflowCode` to a configurable per-module discriminator (§2.3); add `CITIZEN` scope level to `UserScopeService` (§9.2‑1) | Nothing — this is foundation |
| **P1 — Close active-module seams** | Point `WithinProjectBaseline` guard at `ProjectLimitService`; wire citizen Form-I claims into the Proposal "Citizen Claims" tab; add project-merging (`MergeProjectsUseCase` + UI, already fully speced) | P0 |
| **P2 — Employment module** | Repository + use cases + DI wiring against existing tables; fact adapter; workflow states/transitions; checklist rules; UI via `GenericChecklistWorkspace`/`ProcessActionCenter` | P0 (fact adapter pattern), Document Engine (already mature) |
| **P3 — Compensation Payroll + RnR Payroll** | Repositories + use cases (already largely written, need wiring) for both; shared `CompensationCalculationService`; parallel-track convergence reaction (§4.3.4); Form-D ledger auto-population | P0, P2 (shares patterns) |
| **P4 — Ledger** | Repository + append-only domain rule + DB trigger enforcement; embed as a tab inside Payroll/RnR workspaces | P3 |
| **P5 — PAF / Rehabilitation** | Repository wiring for the five already-written use cases; CL-3 checklist seeding; UI workspace | P0 |
| **P6 — Org module UX completion** | Scope-history timeline screen (reuse `<UnifiedWorkflowTimeline>`); `RevokeUserSessionsUseCase` reaction (§9.2‑4) | P0 |
| **P7 — SCD2 history tables for graduated modules** | Shadow table + trigger for `compensation_payroll_line`, `rnr_asset_payroll_line`, `paf_census_record` | P3, P5 |
| **P8 — Reporting & dashboards** | Role-specific dashboards (Unit/Area GM/HQ GM LRE/Admin) built on `DeadlineTrackerService` overdue/upcoming queries + existing `FactResolver` KPI facts | P0–P6 |

**What this roadmap deliberately does not include:** a new workflow engine, a new checklist engine, a new document engine, a new file manager, a new notification system, or a new RBAC model. Every phase above is either (a) a small, isolated service extraction, (b) wiring already-written use cases to already-existing tables, or (c) configuration (DB rows, config files) against the platform built in §2. That is the concrete, load-bearing answer to "reuse services and components, do a simple way to do tasks."
