# Document Engine (Workspace) Documentation

The Document Engine is a Clean Architecture module responsible for managing the lifecycle of documents (Draft vs Generated, Dynamic Forms, Signatures) and orchestrating generation. It relies on the pure core engine (`src/lib/engines/docx`) for actual zip and XML manipulation.

## Core Architecture
- **Core Engine (`src/lib/engines/docx`)**: Pure, stateless `.docx` generation logic.
- **Application Layer (`src/modules/document-engine/application/use-cases`)**: Clean Use Cases (`StartDocumentWorkspaceUseCase`, `GenerateDocumentUseCase`).
- **API Layer (`src/app/api/document-engine`)**: Secure REST API endpoints orchestrating the Use Cases.
- **Shared UI (`src/components/coalrr/DocumentWorkspaceModal.tsx`)**: Reusable platform UI widget.

## Core Features
- **Idempotent Workspaces**: Workspaces are initialized as Drafts. Re-running the generation will cleanly overwrite the same file and database row rather than creating duplicates.
- **Dynamic Form Engine**: Fields defined in the database dynamically render as a React form.
- **Shared Validation**: Uses Zod to validate input dynamically on both the React frontend (via `react-hook-form`) and the Next.js API layer.
- **Advanced Conditional Logic**: Fields can be hidden or shown dynamically based on complex JSON `$show_if` rules (e.g. `$eq`, `$gt`, `$and`).
- **State-Based Signature Routing**: Signatures are dynamically injected into the document based on the Application's specific `workflow_state`.

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
- Signatures: `{Sig_GM_Page1}`

### Step 2: Store the File
For system-critical templates that must be tracked by version control, place your `.docx` file in the core engine's internal templates directory:
`src/lib/engines/docx/templates/FormXXIV_Template.docx`. 
*(Note: If users upload custom templates through the UI later, they will fallback to the `uploads/templates/` folder).*

### Step 3: Database Registry (`document_template`)
Register the core template in the database. Notice how the `storage_path` only needs the filename if it sits in the default internal directory.
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
  -- Example of complex conditional formatting: Only show if ModeGovtTransfer equals 1
  '{"ModeGovtTransfer": {"$eq": "1"}}'::jsonb
);
```

### Step 5: Configure Signature Routing (`document_template_signature`)
Define who needs to sign the document before the final generation, and where their signatures should be injected.
```sql
INSERT INTO document_template_signature (id, template_code, role, workflow_state, placeholders, is_required, display_order)
VALUES 
-- The General Manager signs if the workflow state is exactly 'PENDING_GM_APPROVAL'
(gen_random_uuid(), 'FORM-XXIV', 'GeneralManager', 'PENDING_GM_APPROVAL', '["Sig_GM_Page1", "Sig_GM_Page4"]'::jsonb, true, 1),
-- The Agent signs universally regardless of state
(gen_random_uuid(), 'FORM-XXIV', 'Agent', null, '["Sig_Agent"]'::jsonb, true, 2);
```

### Step 6: Create the Backend Resolver
Create a class in `src/modules/document-engine/application/resolvers/FormXXIVResolver.ts` that implements `IDocumentResolver`. This class fetches backend data and merges it with the dynamic form data.

```typescript
import { IDocumentResolver, ResolvedDocumentData, ResolverContext } from '../ResolverRegistry'

export class FormXXIVResolver implements IDocumentResolver {
  async resolve(applicationId: string, context?: ResolverContext): Promise<ResolvedDocumentData> {
    // 1. Fetch Backend Data
    // const applicationData = await db.application.findUnique(...)

    // 2. Extract Form Data (from Step 4)
    const customData = context?.form_data || {};

    return {
      fields: {
        // Map backend data
        "ApplicantName": "John Doe",
        "ModeGovtTransfer": "1", // Triggers the show_if rule from Step 4
        // Map custom form data
        "NoticeDate": customData.NoticeDate || '',
        "Remarks": customData.CustomRemarks || '',
      },
      tables: {
        "items": [ { "itemName": "Parcel A", "itemCost": "$500" } ]
      }
    }
  }
}
```

### Step 7: Register the Resolver
Finally, link your template code to your new resolver inside `src/modules/document-engine/application/ResolverRegistry.ts`.

```typescript
import { FormXXIVResolver } from './resolvers/FormXXIVResolver'

export class ResolverRegistry {
  private resolvers: Map<string, IDocumentResolver> = new Map()

  constructor() {
    // Register here
    this.resolvers.set('FORM-XXIV', new FormXXIVResolver())
  }
}
```

---

## Reusability: Using the Engine in Any Module

The Document Engine is highly decoupled and can be dropped into **any** module (e.g., Land Acquisition, HR, Finance) simply by rendering the `DocumentWorkspaceModal` component.

### Example: Triggering from the UI
```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DocumentWorkspaceModal } from '@/components/coalrr';

export function LandAcquisitionDetailView({ applicationId }: { applicationId: string }) {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  return (
    <div>
      <h1>Land Acquisition Details</h1>
      
      {/* 1. Trigger Button */}
      <Button onClick={() => setIsWorkspaceOpen(true)}>
        Generate Form XXIV
      </Button>

      {/* 2. Reusable Workspace Component */}
      <DocumentWorkspaceModal
        isOpen={isWorkspaceOpen}
        onOpenChange={setIsWorkspaceOpen}
        templateCode="FORM-XXIV"
        businessId={applicationId}
      />
    </div>
  );
}
```
*That's it! The modal automatically communicates with the `/api/document-engine/...` endpoints to handle fetching the template, rendering the dynamic form, capturing signatures, and saving the final `.docx` file.*

---

## Advanced Examples

### 1. Advanced Conditional Rules (`$show_if`)
You can chain complex MongoDB-style query operators in the `document_template_field` table to make your forms incredibly smart.

```json
{
  "$and": [
    { "ModeGovtTransfer": { "$eq": "1" } },
    { "LandAreaHectares": { "$gt": 50 } },
    { "ProjectState": { "$in": ["Jharkhand", "West Bengal"] } }
  ]
}
```
*If a user configures this JSON rule on a "Rehabilitation Plan Upload" field, that field will ONLY render on the React form if the transfer is Govt, the area is > 50 Hectares, AND the state is Jharkhand or WB.*

### 2. Advanced Document Tables (`docxtemplater`)
If your resolver returns an array in the `tables` object, you can generate dynamic rows inside your `.docx` file.

**Resolver Return Data:**
```typescript
tables: {
  "Nominees": [ 
    { "Name": "Alice", "Share": "50%" },
    { "Name": "Bob", "Share": "50%" }
  ]
}
```

**Inside your Microsoft Word Template:**
Draw a standard table in Word. In the first cell of the row you want to repeat, put `{#Nominees}`. In the last cell, put `{/Nominees}`.

| Nominee Name | Share Percentage |
|--------------|------------------|
| `{#Nominees}{Name}` | `{Share}{/Nominees}` |

*When generated, docxtemplater will automatically duplicate the table row for Alice and Bob perfectly.*

### 3. Passing Extra Context to the Resolver (`extraData`)
If your backend database queries require more than just the `applicationId` (for example, you also need a `projectId`), you can pass arbitrary context from the UI straight into the Resolver.

**In the UI:**
```tsx
<DocumentWorkspaceModal
  templateCode="FORM-XXIV"
  businessId={applicationId}
  extraData={{ projectId: "PROJ-999" }}
  isOpen={isOpen}
  onOpenChange={setIsOpen}
/>
```

**In the Backend Resolver:**
The `extraData` is immediately forwarded to the `context.form_data` object in your resolver.

```typescript
export class FormXXIVResolver implements IDocumentResolver {
  async resolve(applicationId: string, context?: ResolverContext): Promise<ResolvedDocumentData> {
    
    // 1. Grab the extra context passed from the UI
    const projectId = context?.form_data?.projectId;

    // 2. Query the database using both IDs
    const data = await db.application.findUnique({
      where: { id: applicationId, project_id: projectId }
    });

    return { fields: {}, tables: {} };
  }
}
```
