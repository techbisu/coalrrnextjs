# Project Master Module

The Project Master module manages the creation, configuration, and lifecycle of CIL colliery projects that serve as the parent context for all Land Acquisition Proposals.

## Architecture

- **Use Cases:** `CreateProjectUseCase`, `UpdateProjectUseCase`, `GetProjectDashboardUseCase` — all wired via `src/infrastructure/di/modules/project.di.ts`
- **Repository:** `PrismaProjectRepository` — all DB access flows through this; no raw `db.` calls in routes or use cases (e.g., `ApproveFormXXIIUseCase` routes transactions through this repository).
- **API Routes:** `src/app/api/projects/`
- **UI Module:** `src/modules/project-master/`
  - **Project List:** Uses a data-dense Enterprise Dashboard pattern powered by `@tanstack/react-table` and `shadcn/ui` instead of card grids, featuring embedded metrics (progress bars) and elegant status badges for scalable record viewing.
  - **Project Forms:** Uses cascading Master Lookups (State -> District -> Block -> Mouza) enforcing parent-child hierarchy filters natively.
- **Validation Schemas:** `src/core/validation/schemas/project.schema.ts`

## API Endpoints

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/api/projects` | `project.view` | List all projects |
| POST | `/api/projects` | `project.create` | Create a new project |
| GET | `/api/projects/[id]` | `project.view` | Get single project |
| PATCH | `/api/projects/[id]` | `project.edit` | Update project metadata |
| DELETE | `/api/projects/[id]` | `project.delete` | Delete project |
| PATCH | `/api/projects/[id]/boundary` | `project.edit` | Save GeoJSON boundary |
| GET | `/api/projects/[id]/files` | `project.view` | List attached files |
| POST | `/api/projects/[id]/lock` | `project.lock` | Lock project baseline |
| POST | `/api/projects/[id]/form-xxii` | `project.edit` | Submit Form XXII |
| POST | `/api/projects/[id]/form-xxii/approve` | `project.approve` | Approve Form XXII |

## Database Schema & Relational Architecture

- **`master.project`** (`proj_cd` PK): Pure project entity storing project code, name, description, tenant ID, land budget (INR), R&R budget (INR), GIS boundary polygon (`boundary`), statutory clearances JSON (`statutory_clearances`), combo project flag (`is_combo_project`), and lock status (`lockedAt`).
- **`master.project_mine`** (`proj_cd`, `mine_cd` Composite PK): Unified junction table storing project-to-mine relationships for ALL projects (single-mine and multi-mine combo projects).
  - `is_primary`: Flag indicating the primary colliery unit.
  - **Symmetry & 3NF**: Resolves Area Office automatically via `mine_master.area_cd` with full Foreign Key CASCADE safety.
- **`master.proj_aprv`** (`aprv_cd` PK): Administrative and statutory sanction approvals (EC, FC, Board Sanctions) specifying approved tenancy, government, forest, patta, excavation, OB dump, and infrastructure land area caps, alongside employment sanctions (`emp_sanc`).
- **`master.proj_aprv_location`** (`aprv_location_code` PK): Civil revenue location breakups mapping approvals to Mouzas (`mouza_lgd` linking to `master.mouza_master`) with specific acreage ceilings. Redundant CIL operational columns (`area_cd`, `mine_cd`) have been purged.

## Master Lookup & Data Integrity

- **Dynamic Master Pickers**: Mine, Area, District, State, Block, and Mouza selections MUST use `<MasterLookup masterName="..." />` connected to `/api/master-data/lookup/[masterName]`.
- **Zero Hardcoded Master Data**: All demo/legacy tables (`mst_plot`, `mst_mouza`) are purged. All lookups resolve directly against `master.mine_master`, `master.area_master`, and `master.mouza_master`.

## Baseline Enforcement & Form-XXII Integration

1. **Form-XXII Baseline Sanction**: Defines statutory land limits per land type (Tenancy, Govt, Forest) and land use purpose (Excavation, Safety Zone, OB Dump, Infrastructure, Diversion, Rehabilitation).
2. **Proposal Baseline Guard (`within_project_baseline`)**: When a Land Acquisition Proposal (CL-1) is evaluated during Area Vetting, `WorkflowEngineServer` checks the proposal's plot area against the parent `Project` baseline limits. If breached, the workflow automatically escalates to `BoardEscalation`.

## Audit Trail, Security Scoping & Timestamp Standards

- **Audit Logging**: All project mutations (creation, metadata updates, boundary uploads, baseline locking, Form-XXII approvals) log structured entries to `public.audit_log` via `AuditQueue`.
- **Organizational Scope Filtering**: `UserScopeService.scopeToWhere()` filters project queries based on the user's assigned scope level (`HQ`, `AREA`, `UNIT`) and tenant ID.
- **Audit Field Value Standard**:
  - `entry_by` & `updt_by`: Store ONLY authenticated User ID (`String(auth.user.id)`). Storing raw emails or full names is banned.
  - `entry_ts` & `updt_ts`: Store Epoch BigInt (`BigInt(Math.floor(Date.now() / 1000))`).

## File Manager Integration

- **Polymorphic File Linking**: Project statutory clearances, EC/FC sanction copies, and Form-XXII documents link via `public.file_attachment` (`entity_type = 'project'`, `file_id = file_record.id`).

## Translations

All user-facing strings use the `project_master` namespace. See `docs/localization.md` for usage patterns.

```tsx
const t = useAppTranslation('project_master');
// Usage:
<Label>{t('required_uploads')}</Label>
<Button>{t('save')}</Button>
toast.success(t('upload_success'));
```

## Project Lifecycle & Future Merging

```
Draft → Form XXII Submitted → Form XXII Approved → Baseline Locked
```

- **Future Project Merging**: See [`docs/project-merging-plan.md`](file:///d:/coalrrnextjs/docs/project-merging-plan.md) for the detailed technical blueprint and UseCase specification for merging two mining projects.

Once **Baseline Locked**, a project becomes eligible for Land Acquisition Proposals. The lock is irreversible.
