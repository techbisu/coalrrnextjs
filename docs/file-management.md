# File Management Module & Entity File Manager

The File Management module is a central, enterprise-grade file storage and workspace management system. It provides Clean Architecture backend services (upload, download, versioning, virus scanning, linking) alongside a polymorphic UI workspace (`EntityFileManagerModal` / `EntityFileManagerTrigger`) that can be embedded into any entity (Land Acquisition Proposals, Projects, Compensation Payroll, etc.).

---

## 1. Architecture & Layer Separation

The backend module is encapsulated in `src/modules/file-management` following strict layer separation:

```text
src/modules/file-management/
├── application/
│   └── use-cases/            # Application logic (Upload, Download, Delete, Link, Preview)
├── domain/
│   ├── entities/             # Core domain models (FileRecord, FileVersion)
│   └── repositories/         # Interfaces for data persistence (IFileRepository)
├── infrastructure/
│   └── persistence/          # Database implementations (PrismaFileRepository)
├── security/                 # File scanning protocols (ClamAVScanner)
├── storage/                  # Storage provider adapters (LocalStorage, S3Storage)
└── components/               # Presentation UI (FileManager, FileUploader, FilePreview)
```

### Dependency Injection (DI)
All dependencies are wired up in `src/infrastructure/di/modules/file.di.ts` and registered in `Container.ts`:
- `UploadFileUseCase`
- `DeleteFileUseCase`
- `DownloadFileUseCase`
- `LinkFileUseCase`
- `GetFilePreviewUseCase`

---

## 2. Database Schema

The module uses three polymorphic schema models in PostgreSQL (`public` schema):

```prisma
model file_record {
  id              String            @id
  original_name   String
  owner_id        String?
  tags            String?           // Comma-separated tags, e.g. "Justification Note,Survey Map"
  status          String            @default("ACTIVE")
  checksum        String?           @unique
  entry_ts        DateTime          @default(now())
  updt_ts         DateTime
  file_attachment file_attachment[]
  file_version    file_version[]
  @@schema("public")
}

model file_attachment {
  id          String      @id
  file_id     String
  entity_type String      // polymorphic entity key, e.g. "acq_land_schedule", "project-master"
  entity_id   String      // UUID of the entity
  module      String?     // Optional module context, e.g. "custom_upload", "linked_repo"
  attached_by String?
  entry_ts    DateTime    @default(now())
  updt_ts     DateTime
  file_record file_record @relation(fields: [file_id], references: [id], onDelete: Cascade)
  @@unique([file_id, entity_type, entity_id])
  @@schema("public")
}

model file_version {
  id               String      @id
  file_id          String
  version_number   Int         @default(1)
  storage_provider String      // e.g. "LOCAL", "S3", "GCS"
  storage_path     String
  bucket           String?
  mime_type        String
  extension        String?
  size_bytes       BigInt
  @@schema("public")
}
```

---

## 3. Universal UI Workspace Components

The UI workspace located in `src/shared/components/coalrr/file-manager/` provides a 3-tab workspace modal:
1. **Attached Files**: Search, filter by tag, view/download, edit tags, unlink files.
2. **Upload Custom Document**: Drag-and-drop upload with metadata tag assignment.
3. **Link Repository Files**: Bulk-select and link pre-existing repository files.

### Components API

#### `<EntityFileManagerModal />`
Full 3-tab workspace modal.
- `entityType`: Polymorphic entity type key (e.g. `ACQ_LAND_SCHEDULE = 'acq_land_schedule'`).
- `entityId`: Entity UUID.
- `open` / `onOpenChange`: Modal state handler.
- `defaultTab`: `'list' | 'upload' | 'link'`.

#### `<EntityFileManagerTrigger />`
Lightweight CTA button showing a live count badge of attached files.
- `entityType`, `entityId`: Required entity identifiers.
- `showCount`: Displays file count badge.
- `label`: Button text.

---

## 4. RBAC Permissions (Module-Scoped)

Permissions are dynamically resolved based on the `entityType` passed to the component/APIs:

| Entity Module | View Permission | Upload/Edit Permission | Unlink Permission |
|---------------|-----------------|------------------------|-------------------|
| **Project** | `project.file.workspace.view` | `project.file.workspace.upload` | `project.file.workspace.unlink` |
| **Land Acquisition** | `acquisition.file.workspace.view` | `acquisition.file.workspace.upload` | `acquisition.file.workspace.unlink` |
| **Proposal** | `proposal.file.workspace.view` | `proposal.file.workspace.upload` | `proposal.file.workspace.unlink` |
| **Payroll/Comp** | `payroll.file.workspace.view` | `payroll.file.workspace.upload` | `payroll.file.workspace.unlink` |
| **Global/Fallback** | `file.workspace.view` | `file.workspace.upload` | `file.workspace.unlink` |

---

## 5. Security & Configuration Management

1. **Environment Configuration**: No `process.env` reads in domain/usecase logic. Settings (`UPLOAD_MAX_SIZE_MB`, `STORAGE_PROVIDER`, `ENABLE_VIRUS_SCAN`) are validated in `src/core/config/env.ts` and consumed via `upload.config.ts`.
2. **Virus Scanning**: Integrated `ClamAVScanner` for buffer validation before disk write.
3. **Path Traversal Protection**: Filenames are sanitized using strict regex in API routes.
4. **Directory Inode Optimization**: Files saved to disk or S3 are partitioned automatically by date (`YYYY/MM/DD/`).
5. **Background Audit Logging**: File upload side-effects dispatch audit events to `Container.jobDispatcher.dispatch('auditLog', ...)` asynchronously per `.agents/rules/background-jobs.md`.

---

## 6. API Routes

- `GET /api/files/entity/[entityType]/[entityId]`: Fetches attached files with parsed tags.
- `POST /api/files/entity/[entityType]/[entityId]`: Multipart file upload or JSON repo link.
- `DELETE /api/files/entity/[entityType]/[entityId]/[attachmentId]`: Unlinks file from entity.
- `PATCH /api/files/[fileId]/tags`: Updates tags on `file_record`.
- `GET /api/files/[fileId]/download`: Stream downloads with dynamic security watermarking.

---

## 7. Integration Examples

```tsx
import { EntityFileManagerTrigger } from '@/shared/components/coalrr';
import { ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config';

// Render File Workspace button in Proposal view:
<EntityFileManagerTrigger
  entityType={ACQ_LAND_SCHEDULE}
  entityId={proposal.id}
  label="Proposal Files & Workspace"
  variant="default"
/>
```

> [!IMPORTANT]
> Always pass canonical entity type constants from `src/core/config/module-codes.config.ts` (e.g. `ACQ_LAND_SCHEDULE`). Never pass raw inline strings.
