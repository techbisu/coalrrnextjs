# File Manager Module — Developer Documentation

> **Module Scope**: `src/shared/components/coalrr/file-manager/`
> **API Routes**: `src/app/api/files/`
> **DB Tables**: `public.file_record`, `public.file_attachment`, `public.file_version`

---

## 1. Overview

The **Entity File Manager** is a universal, polymorphic shared UI component that can be embedded into any entity view page (Land Acquisition Proposals, Projects, Compensation Payroll, etc.).

It provides three capabilities in a single 3-tab modal workspace:

| Tab | Purpose |
|-----|---------|
| **Attached Files** | List, search, filter by tag, view/download, edit tags, unlink files |
| **Upload Custom Document** | Drag-and-drop upload with metadata tag assignment |
| **Link Repository Files** | Bulk-select and link pre-existing user-uploaded repository files |

---

## 2. Database Schema

> [!IMPORTANT]
> **No schema migration required.** The `public.file_record.tags` column (`tags String?`) already exists in `prisma/schema.prisma`. Tags are stored as comma-separated strings: `"Justification Note,Survey Map,Gazette Notification"`.

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

## 3. Components

### `<EntityFileManagerModal />`

**Path**: [`src/shared/components/coalrr/file-manager/EntityFileManagerModal.tsx`](file:///d:/coalrrnextjs/src/shared/components/coalrr/file-manager/EntityFileManagerModal.tsx)

Full 3-tab workspace modal. Import via barrel export:
```ts
import { EntityFileManagerModal } from '@/shared/components/coalrr'
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | required | Controls modal open state |
| `onOpenChange` | `(open: boolean) => void` | required | Modal open state callback |
| `entityType` | `string` | required | Polymorphic entity type key (e.g. `ACQ_LAND_SCHEDULE = 'acq_land_schedule'`) |
| `entityId` | `string` | required | Entity UUID |
| `title` | `string?` | `'Entity File Manager...'` | Modal title |
| `description` | `string?` | — | Modal description |
| `defaultTab` | `'list' \| 'upload' \| 'link'` | `'list'` | Which tab opens first |

---

### `<EntityFileManagerTrigger />`

**Path**: [`src/shared/components/coalrr/file-manager/EntityFileManagerTrigger.tsx`](file:///d:/coalrrnextjs/src/shared/components/coalrr/file-manager/EntityFileManagerTrigger.tsx)

Lightweight embeddable CTA button. Shows a live count badge of attached files. Renders the full modal on click.

```ts
import { EntityFileManagerTrigger } from '@/shared/components/coalrr'
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityType` | `string` | required | Polymorphic entity type key |
| `entityId` | `string` | required | Entity UUID |
| `label` | `string?` | `'File Workspace'` | Button label text |
| `showCount` | `boolean?` | `true` | Show live file count badge |
| `defaultTab` | `'list' \| 'upload' \| 'link'` | `'list'` | Which modal tab opens |
| `variant` | `ButtonVariant?` | `'outline'` | shadcn/ui button variant |
| `size` | `ButtonSize?` | `'sm'` | shadcn/ui button size |
| `className` | `string?` | — | Extra Tailwind classes |

---

## 4. RBAC Permissions (Module-Scoped)

The File Manager uses dedicated, module-scoped permissions that are decoupled from generic entity CRUD permissions. This allows users to have read-only access to an entity but full upload access to its files (or vice versa).

| Entity Module | View Permission | Upload/Edit Permission | Unlink Permission |
|---------------|-----------------|------------------------|-------------------|
| **Project** | `project.file.workspace.view` | `project.file.workspace.upload` | `project.file.workspace.unlink` |
| **Land Acquisition** | `acquisition.file.workspace.view` | `acquisition.file.workspace.upload` | `acquisition.file.workspace.unlink` |
| **Proposal** | `proposal.file.workspace.view` | `proposal.file.workspace.upload` | `proposal.file.workspace.unlink` |
| **Payroll/Comp** | `payroll.file.workspace.view` | `payroll.file.workspace.upload` | `payroll.file.workspace.unlink` |
| **Global/Fallback** | `file.workspace.view` | `file.workspace.upload` | `file.workspace.unlink` |

These are resolved dynamically based on the `entityType` passed to the component and APIs. If the `entityType` does not match a known module (or is omitted), it falls back to the global file workspace permissions.

---

## 5. API Routes

### `GET /api/files/entity/[entityType]/[entityId]`

Fetches all files attached to the entity. Parses tags into `string[]` array.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "attachment_id": "uuid",
      "file_id": "uuid",
      "file_name": "gazette-notification.pdf",
      "file_size_kb": 428,
      "mime_type": "application/pdf",
      "tags": ["Gazette Notification", "Survey Map"],
      "status": "ACTIVE",
      "uploaded_by": "user-uuid",
      "entry_ts": "2026-08-07T09:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/files/entity/[entityType]/[entityId]`

Two modes, controlled by `Content-Type`:

#### A. Multipart Upload (new file with tags)
```
Content-Type: multipart/form-data
Body:
  file     — File binary
  tags     — JSON string: '["Justification Note","Survey Map"]'
  module   — Optional context string (defaults to "custom_upload")
```

Atomically creates `file_record` + `file_version` + `file_attachment` in a single DB transaction.

#### B. JSON Link (link existing repository files)
```
Content-Type: application/json
Body: { "file_ids": ["uuid1","uuid2"], "module": "linked_repo" }
```

Creates `file_attachment` rows for each `file_id` without duplicating storage.

---

### `DELETE /api/files/entity/[entityType]/[entityId]/[attachmentId]`

Unassigns (unlinks) a file from an entity.
- Enforces the corresponding `.unlink` permission (e.g. `project.file.workspace.unlink`).
- Deletes the `file_attachment` mapping row but leaves the underlying `file_record` and `file_version` untouched so it remains accessible in the global repository.

---

### `PATCH /api/files/[fileId]/tags`

Updates the `tags` field on `file_record`.

```
Content-Type: application/json
Body: { "tags": ["Justification Note", "Board Resolution"] }
```

---

## 6. Usage Examples

### Basic Integration in Any Entity View Page

```tsx
import { EntityFileManagerTrigger } from '@/shared/components/coalrr'
import { ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'

// In your proposal header / card action bar:
<EntityFileManagerTrigger
  entityType={ACQ_LAND_SCHEDULE}
  entityId={proposal.id}
  label="Open File Workspace"
  variant="default"
/>
```

### Open Directly on Upload Tab

```tsx
<EntityFileManagerTrigger
  entityType="project-master"
  entityId={project.id}
  label="Upload Project Documents"
  defaultTab="upload"
  variant="outline"
/>
```

### Full Modal Control

```tsx
const [open, setOpen] = React.useState(false)

<Button onClick={() => setOpen(true)}>Manage Files</Button>

<EntityFileManagerModal
  open={open}
  onOpenChange={setOpen}
  entityType="project-master"
  entityId={project.id}
  defaultTab="list"
/>
```

---

## 7. Tag System

### Preset Tags (built-in)
The upload tab shows these quick-select preset tags:

| Tag | Use Case |
|-----|---------|
| `Justification Note` | Project justification documents |
| `Survey Map` | Land survey maps and parcel records |
| `Gazette Notification` | Sec 4 / Sec 7 gazette notifications (CBA Act) |
| `Title Search Report` | 13-year landowner title search (Direct Purchase) |
| `Rate Valuation Minutes` | Tripartite rate valuation meeting minutes |
| `Board Resolution` | Board-level deviation or escalation documents |
| `Form XXII Deviation` | Form XXII board copy approvals |
| `Form VII Signatures` | Form VII signatory documents |
| `Forest Clearance` | Forest diversion clearance orders |

Custom tags can also be typed and added.

### Tag Storage Format
Tags are stored in `file_record.tags` as comma-separated strings:
```
"Gazette Notification,Survey Map,Title Search Report"
```

Tag parsing is handled in the API route with fallback for both CSV and JSON-array formats.

---

## 8. Adding New Entity Types

To embed in a new entity, pass the appropriate `entityType` key string. Use a constant from `module-codes.config.ts`:

```ts
// src/core/config/module-codes.config.ts
export const MODULE_CODES = {
  LAND_SCHEDULE:        'LAND_SCHEDULE',
  COMPENSATION_PAYROLL: 'COMPENSATION_PAYROLL',
  EMPLOYMENT_APP:       'EMPLOYMENT_APP',
  FORM_I_CLAIM:         'FORM_I_CLAIM',
} as const

export const ACQ_LAND_SCHEDULE      = 'acq_land_schedule'
export const COMPENSATION_PAYROLL   = 'compensation_payroll'
```

> [!IMPORTANT]
> **Never pass raw inline strings** like `"land_schedule"` or `"proposal"` as `entityType`. Always import and use the exported constant from `module-codes.config.ts`. This rule is enforced per `AGENTS.md` and `config-management.md`.

---

## 9. Integration Points

| Integration | Location |
|------------|---------|
| Proposal Header (Land Acquisition) | [`src/modules/land-acquisition/components/sections/ProposalHeaderSection.tsx`](file:///d:/coalrrnextjs/src/modules/land-acquisition/components/sections/ProposalHeaderSection.tsx) |
| Shared barrel export | [`src/shared/components/coalrr/index.ts`](file:///d:/coalrrnextjs/src/shared/components/coalrr/index.ts) |
| Entity Files API | [`src/app/api/files/entity/[entityType]/[entityId]/route.ts`](file:///d:/coalrrnextjs/src/app/api/files/entity/%5BentityType%5D/%5BentityId%5D/route.ts) |
| File Tags PATCH API | [`src/app/api/files/[fileId]/tags/route.ts`](file:///d:/coalrrnextjs/src/app/api/files/%5BfileId%5D/tags/route.ts) |
| Unit Tests | [`tests/unit/core/file-manager/EntityFileManager.test.ts`](file:///d:/coalrrnextjs/tests/unit/core/file-manager/EntityFileManager.test.ts) |
