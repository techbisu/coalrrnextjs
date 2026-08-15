# FactResolver & ConditionContext Engine Service Documentation

The FactResolver & ConditionContext Engine is a centralized, high-performance domain evaluation service designed to resolve entity facts, dynamic computed metrics, and persisted flag overrides into a single, immutable `ConditionContext`. It acts as the single source of truth for condition evaluation across the Checklist Engine, Workflow Engine, Milestone Engine, and DOCX Engine.

---

## 1. How It Works (Architecture & Data Flow)

The service operates on a unified multi-tier resolution hierarchy:

```
Authoritative Domain Tables (acq_proposal, project, plot_schedule)
         +
Snapshot Context (checklist_entity_context)
         +
Persisted Flags & Overrides (public.entity_flag)
         ↓
FactResolver (via IFactSourceAdapter e.g., AcqLandScheduleFactAdapter, ProjectFactAdapter)
         ↓
ConditionContext (Immutable Value Object)
         ↓
Checklist / Workflow UseCases (GetChecklistStatusUseCase)
         ↓
AST Evaluator (evaluateConditionNode - show_if rules)
         ↓
API Route (GET /api/checklist/status)
         ↓
UI Components (SmartChecklist / GenericChecklistWorkspace)
```

### Resolution Order & Precedence
When resolving facts for an entity (`entityType`, `entityId`), `FactResolver` merges data in strict order of precedence:
1. **Base Domain Facts & Computed Metrics**: Fetched directly from authoritative DB tables via registered `IFactSourceAdapter` (e.g. `acq_proposal`, `project`, dynamic `plot_count`).
2. **Snapshot Context Fallback**: Cached snapshot fields from `checklist_entity_context`.
3. **Persisted Flags & Manual Overrides**: Records from `public.entity_flag`. Any flag marked with `is_overridden === true` takes top priority over domain defaults.

---

## 2. Benefits to the System

1. **Zero N+1 Query Overhead**: Resolves all domain facts, computed metrics, and overrides **once** per request. Engines evaluate all rules against the resolved `ConditionContext`.
2. **Single Canonical Evaluator**: Integrates directly with the existing AST condition evaluator (`evaluateConditionNode`). No duplicate condition engines or rule evaluators.
3. **Dynamic Metric Evaluation**: Computes dynamic facts (such as `plot_count > 0` for Plot Schedule completion, `has_forest_land`, `has_govt_land`) live from authoritative database records without requiring manual status flags (`plot_schedule_completed` or `lock_plot_schedule`).
4. **Auditability & Manual Overrides**: Supports manual override flags in `public.entity_flag` with audit tracking (`source`, `override_reason`), allowing administrators to override domain facts safely.
5. **Backward Compatibility**: Fully backward compatible with legacy field aliases (`acq_mode`, `acq_mode_id`, `acqModeId`, `current_stage_cd`, `stage`).

---

## 3. How to Reuse & Where to Use

### A. Resolving `ConditionContext` in a UseCase or Service
To resolve entity condition facts in any backend service or use case:

```typescript
import { Container } from '@/infrastructure/di/modules/core.di';
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config';

// 1. Build immutable ConditionContext
const context = await Container.conditionContextBuilder.buildContext(
  CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
  proposalId
);

// 2. Query facts with default fallback values
const acqMode = context.get<number>('acq_mode_id');
const hasPlots = context.getBoolean('has_plots');
const plotCount = context.get<number>('plot_count', 0);
const isBoardApprovalReq = context.getBoolean('requires_board_approval');

// 3. Check for manual overrides
if (context.isOverridden('requires_board_approval')) {
  console.log(`Board approval overridden: ${context.getOverrideReason('requires_board_approval')}`);
}

// 4. Convert all facts to a plain key-value dictionary for AST condition evaluators
const factDictionary = context.toDictionary();
```

### B. Registering a New Entity Adapter
To support a new entity type in the `FactResolver` (e.g. `EMPLOYMENT_APP`):

1. Implement `IFactSourceAdapter`:
```typescript
import { IFactSourceAdapter } from '@/core/flags/interfaces/IFactSourceAdapter';
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config';
import { db } from '@/lib/db';

export class EmploymentAppFactAdapter implements IFactSourceAdapter {
  readonly entityType = CHECKABLE_ENTITY_TYPES.EMPLOYMENT_APPLICATION;

  async resolveDomainFacts(entityId: string): Promise<Record<string, any>> {
    const app = await db.employment_application.findUnique({
      where: { id: entityId },
    });

    if (!app) return {};

    return {
      status: app.status,
      is_disabled_applicant: app.is_disabled ?? false,
      nominee_count: app.nominee_count ?? 0,
    };
  }
}
```

2. Register the adapter in `src/infrastructure/di/modules/core.di.ts`:
```typescript
factResolver.registerAdapter(new EmploymentAppFactAdapter());
```

---

## 4. EntityFlagService & Persistence Layer

The `EntityFlagService` provides infrastructure for persisting, querying, and overriding business flags in `public.entity_flag`.

### Key Capabilities & Rules
1. **Centralized Entity Type Normalization**: Converts raw string inputs or legacy aliases (`'LAND_SCHEDULE'`, `'ACQ_PROPOSAL'`, `'PROPOSAL'`, etc.) to canonical `CHECKABLE_ENTITY_TYPES` using `normalizeCheckableEntityType()` from `src/core/config/module-codes.config.ts`.
2. **Schema Validation**: Validates all set/override inputs against Zod schema (`SetEntityFlagSchema.safeParse()`).
3. **Automatic Audit Trail**: All flag set, override, and delete mutations trigger audit log entries via `Audit.logCustomAction()`.

### Example Usage: Setting an Override Flag
```typescript
import { Container } from '@/infrastructure/di/modules/core.di'
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'

// Set manual override flag with reason and audit tracking
await Container.entityFlagService.set(
  CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
  proposalId,
  'requires_board_approval',
  true,
  {
    source: 'ADMIN_OVERRIDE',
    isOverridden: true,
    overrideReason: 'Required due to budget escalation approval policy',
    entryBy: 'admin_user_123',
  }
)
```

---

## 5. Key Files Touched

- [`src/core/flags/domain/ConditionContext.ts`](file:///d:/coalrrnextjs/src/core/flags/domain/ConditionContext.ts): Immutable Value Object encapsulating resolved facts.
- [`src/core/flags/services/EntityFlagService.ts`](file:///d:/coalrrnextjs/src/core/flags/services/EntityFlagService.ts): Service for persisting, validating (Zod), normalizing, and audit-logging `public.entity_flag` mutations.
- [`src/core/flags/services/FactResolver.ts`](file:///d:/coalrrnextjs/src/core/flags/services/FactResolver.ts): Unified orchestrator for merging domain data, dynamic metrics, and `public.entity_flag` overrides.
- [`src/core/flags/services/ConditionContextBuilder.ts`](file:///d:/coalrrnextjs/src/core/flags/services/ConditionContextBuilder.ts): Service for building `ConditionContext` instances.
- [`src/core/flags/interfaces/IEntityFlagRepository.ts`](file:///d:/coalrrnextjs/src/core/flags/interfaces/IEntityFlagRepository.ts): Repository interface abstraction for entity flags persistence.
- [`src/core/flags/infrastructure/persistence/PrismaEntityFlagRepository.ts`](file:///d:/coalrrnextjs/src/core/flags/infrastructure/persistence/PrismaEntityFlagRepository.ts): Concrete Prisma repository for `public.entity_flag`.
- [`src/core/flags/adapters/AcqLandScheduleFactAdapter.ts`](file:///d:/coalrrnextjs/src/core/flags/adapters/AcqLandScheduleFactAdapter.ts): Domain adapter for Acquisition Proposals (`acq_land_schedule`).
- [`src/core/flags/adapters/ProjectFactAdapter.ts`](file:///d:/coalrrnextjs/src/core/flags/adapters/ProjectFactAdapter.ts): Domain adapter for Project Master (`project`).
- [`src/core/config/module-codes.config.ts`](file:///d:/coalrrnextjs/src/core/config/module-codes.config.ts): Defines canonical `CHECKABLE_ENTITY_TYPES` and `normalizeCheckableEntityType()` helper function.
- [`src/core/proposal/checklist/ProposalChecklistResolver.ts`](file:///d:/coalrrnextjs/src/core/proposal/checklist/ProposalChecklistResolver.ts): Context resolver integrating `ConditionContextBuilder` into the Checklist engine.
- [`src/core/checklist/usecases/GetChecklistStatusUseCase.ts`](file:///d:/coalrrnextjs/src/core/checklist/usecases/GetChecklistStatusUseCase.ts): Use case evaluating rules against `ConditionContext` facts and dynamic plot counts.
- [`src/infrastructure/di/modules/core.di.ts`](file:///d:/coalrrnextjs/src/infrastructure/di/modules/core.di.ts): Dependency Injection container wiring for `entityFlagService`, `factResolver`, `conditionContextBuilder`, and adapters.
- [`tests/unit/core/checklist/ChecklistConditionContextIntegration.test.ts`](file:///d:/coalrrnextjs/tests/unit/core/checklist/ChecklistConditionContextIntegration.test.ts): Unit and integration test suite covering all 14 required Phase 3 test cases.

---

## 6. Packages Used & Rationale

- **`vitest`**: High-speed, TypeScript-native test runner used for unit and integration testing.
- **`@prisma/client`**: Database ORM used for querying authoritative tables (`acq_proposal`, `project`, `plot_schedule`, `checklist_entity_context`, `entity_flag`).
- **`ioredis`**: Redis client for production L2 caching in `ConfigCacheService`.
- **`uuid`**: Standard RFC4122 UUID generation for entity flag and submission primary keys.
