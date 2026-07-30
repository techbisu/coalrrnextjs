# Project Master Module

The Project Master module manages the creation, configuration, and lifecycle of CIL colliery projects that serve as the parent context for all Land Acquisition Proposals.

## Architecture

- **Use Cases:** `CreateProjectUseCase`, `UpdateProjectUseCase`, `GetProjectDashboardUseCase` — all wired via `src/infrastructure/di/modules/project.di.ts`
- **Repository:** `PrismaProjectRepository` — all DB access flows through this; no raw `db.` calls in routes.
- **API Routes:** `src/app/api/projects/`
- **UI Module:** `src/modules/project-master/`
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

## Translations

All user-facing strings use the `project_master` namespace. See `docs/localization.md` for usage patterns.

```tsx
const t = useAppTranslation('project_master');
// Usage:
<Label>{t('required_uploads')}</Label>
<Button>{t('save')}</Button>
toast.success(t('upload_success'));
```

## Project Lifecycle

```
Draft → Form XXII Submitted → Form XXII Approved → Baseline Locked
```

Once **Baseline Locked**, a project becomes eligible for Land Acquisition Proposals. The lock is irreversible.
