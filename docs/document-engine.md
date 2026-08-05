# Document Engine (Workspace) Documentation

The Document Engine is a Clean Architecture module responsible for managing the lifecycle of documents (Draft vs Generated, Dynamic Forms, Signatures) and orchestrating generation. It relies on the pure core engine (`src/lib/engines/docx`) for actual zip and XML manipulation.

## Core Architecture
- **Core Engine (`src/lib/engines/docx`)**: Pure, stateless `.docx` generation logic with `nullGetter()` protection.
- **Application Layer (`src/modules/document-engine/application/use-cases`)**: Clean Use Cases (`StartDocumentWorkspaceUseCase`, `GenerateDocumentUseCase`).
- **API Layer (`src/app/api/document-engine`)**: Secure REST API endpoints orchestrating Use Cases (`/workspace`, `/generate`, `/sign`, `/save-form`).
- **Shared UI (`src/shared/components/coalrr/DocumentWorkspaceModal.tsx`)**: Reusable platform UI workspace with dynamic forms, auto-collapsible panels, and sequential signature workflows.
- **File Management & HTML Preview (`FilePreview.tsx`)**: Renders `.docx` documents instantly in-browser using `mammoth.convertToHtml()`.

## Core Features
- **Idempotent Workspaces**: Workspaces are initialized as Drafts. Re-running generation cleanly overwrites the buffer and updates `document_instance`.
- **Dynamic Form Engine**: Fields defined in `document_template_field` dynamically render as a React form with `.passthrough()` Zod validation.
- **Auto-Collapsible Sidebar Card**: Form inputs ("Additional Information") auto-collapse upon saving/submitting, giving full focus to the preview and signatures.
- **Permission-Driven Signature Routing (`sig_permission`)**: Signature steps store exact permission names (`<template>.sign.<role>`) in `document_template_signature.sig_permission`.
- **Sequential Signature Pipeline**: Signatures are sorted by `display_order`. Step $N+1$ unlocks strictly after Step $N$ is signed.
- **In-Browser Mammoth HTML Preview**: Browser renders `.docx` buffers natively via HTML conversion without requiring server-side LibreOffice instances.

---

## How to Register a New Form Template (Step-by-Step)

Follow this guide to introduce a new document type (e.g., "Form XXIV") into the system.

### Step 1: Create the `.docx` Template
Create a Microsoft Word document. Place variables inside single curly braces `{}`.
- Single variables: `{ApplicantName}`, `{ProjectBoundary}`
- Tables/Loops: 
  ```text
  {#items}
  {itemName} - {itemCost}
  {/items}
  ```
- Signatures & Seals: `{Sig_GM_Page1}`, `{LandOfficer_Name}`, `{LandOfficer_Date}`

### Step 2: Store the File
For system-critical templates that must be tracked by version control, place your `.docx` file in the core engine's internal templates directory:
`src/lib/engines/docx/templates/FormXXIV_Template.docx`. 

### Step 3: Database Registry (`document_template`)
Register the core template in the database.
```sql
INSERT INTO document_template (id, template_code, template_name, storage_path)
VALUES (gen_random_uuid(), 'FORM-XXIV', 'Land Acquisition Notice', 'FormXXIV_Template.docx');
```

### Step 4: Configure Dynamic Form Fields (`document_template_field`)
Define the custom fields the user must fill out before generating the document.
```sql
INSERT INTO document_template_field (id, template_code, field_key, label, field_type, is_required, display_order, show_if)
VALUES 
(gen_random_uuid(), 'FORM-XXIV', 'NoticeDate', 'Notice Date', 'date', true, 1, null),
(gen_random_uuid(), 'FORM-XXIV', 'CustomRemarks', 'Remarks (Govt Only)', 'text', false, 2, 
  '{"ModeGovtTransfer": {"$eq": "1"}}'::jsonb
);
```

### Step 5: Configure Permission Signature Routing (`document_template_signature`)
Define signature steps in `document_template_signature` using explicit **permission names** in `sig_permission`:

```sql
INSERT INTO document_template_signature 
  (id, template_code, sig_permission, workflow_state, placeholders, is_required, display_order)
VALUES 
  -- Step 1: Requires permission 'form_xxiv.sign.land_cell_member'
  (gen_random_uuid(), 'FORM-XXIV', 'form_xxiv.sign.land_cell_member', 'AreaVetted', '{"name":"LandCell_Name","date":"LandCell_Date"}'::jsonb, true, 1),
  -- Step 2: Requires permission 'form_xxiv.sign.land_officer'
  (gen_random_uuid(), 'FORM-XXIV', 'form_xxiv.sign.land_officer', 'AreaVetted', '{"name":"LandOfficer_Name","date":"LandOfficer_Date"}'::jsonb, true, 2),
  -- Step 3: Requires permission 'form_xxiv.sign.area_gm'
  (gen_random_uuid(), 'FORM-XXIV', 'form_xxiv.sign.area_gm', 'Approved', '{"name":"AreaGM_Name","date":"AreaGM_Date"}'::jsonb, true, 3);
```

### Step 6: Seed Permission to Roles (`permission` & `role_has_permission`)
```sql
-- 1. Create permission
INSERT INTO "permission" (id, name, guard_name, updt_ts)
VALUES (gen_random_uuid(), 'form_xxiv.sign.land_cell_member', 'web', NOW());

-- 2. Link permission to role
INSERT INTO "role_has_permission" (role_id, permission_id, updt_ts)
SELECT r.id, p.id, NOW()
FROM "role" r, "permission" p
WHERE r.name = 'area_officer' AND p.name = 'form_xxiv.sign.land_cell_member';
```

---

## Permission-Driven & Sequential Signature Architecture

### 1. `sig_permission` Column Mapping
`document_template_signature.sig_permission` stores the explicit permission string:
```
<template_code_lowercase>.sign.<role_code_lowercase>
```

#### Examples:
- **Form XXII**:
  - `form_xxii.sign.area_land_cell_member` (Step 1)
  - `form_xxii.sign.area_land_officer` (Step 2)
  - `form_xxii.sign.area_gm` (Step 3)
- **Form VII**:
  - `form_vii.sign.acq_land_clerk` (Step 1)
  - `form_vii.sign.acq_surveyor` (Step 2)
  - `form_vii.sign.acq_project_manager` (Step 3)
  - `form_vii.sign.acq_land_officer` (Step 5)
  - `form_vii.sign.acq_agm` (Step 6)

### 2. Sequential Step Enforcement
Signature steps are executed strictly in order of `display_order`:
- **Step 1**: Available immediately to authorized users.
- **Step 2**: Remains `Locked (Step 1 Pending)` until Step 1 signature is submitted and recorded in `document_instance.signature_data_json`.
- **Step 3**: Unlocks only after Step 2 signature is recorded.

---

## FormXXIIResolver & Document Engine Business Logic

### 1. File-Scoped Module Hoisting (`getFormVal`)
The `getFormVal` helper is defined at file scope (outside class methods) to ensure zero TDZ (Temporal Dead Zone) hoisting errors:
- Normalizes `formData` key lookup across `PascalCase`, `camelCase`, `snake_case`.
- Provides fallback defaults across DB columns and administrative strings (`"NO - Within Approved Limits"`).

### 2. Form XXII Use-Wise Deviation Placeholders
Row 3 (Deviation) of the Use-wise table supports the following placeholder aliases:
- **Excavating Area**: `{DevExcavating}`, `{DevExcavation}`, `{DevExcavatingArea}`, `{dev_excavating}`
- **Safety Zone**: `{DevSafetyZone}`, `{DevSafety}`, `{DevSafetyZoneArea}`, `{dev_safety_zone}`
- **OB Dump**: `{DevObDump}`, `{DevOb}`, `{DevObDumpArea}`, `{dev_ob_dump}`
- **Infrastructure**: `{DevInfrastructure}`, `{DevInfra}`, `{DevInfrastructureArea}`, `{dev_infrastructure}`
- **Diversion**: `{DevDiversion}`, `{DevDiversionArea}`, `{dev_diversion}`
- **Rehabilitation**: `{DevRehabilitation}`, `{DevRehab}`, `{DevRehabilitationArea}`, `{dev_rehabilitation}`
- **Other Purpose**: `{DevOther}`, `{DevOtherPurpose}`, `{DevOtherArea}`, `{dev_other}`
- **Total Deviation**: `{DevTotal}` (Type-Wise), `{DevUseTotal}` / `{dev_use_total}` (Use-Wise)

---

## API Endpoints Reference

| Route | Method | Payload / Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/document-engine/workspace` | `POST` | `{ templateCode, applicationId, extraData }` | Initializes workspace draft, returns fields, signatures, and user permissions |
| `/api/document-engine/generate` | `POST` | `{ instanceId }` | Resolves fields, applies signatures, generates `.docx` buffer, saves file |
| `/api/document-engine/sign` | `POST` | `{ instanceId, sig_permission, signatureText }` | Records signature entry in `signature_data_json` and auto-regenerates document |
| `/api/document-engine/save-form` | `POST` | `{ instanceId, formData }` | Saves form data with `.passthrough()` Zod schema validation |

