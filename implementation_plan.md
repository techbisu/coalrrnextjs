# Refactor Form-XXII to Generic Document Engine

The current implementation of Form-XXII uses hardcoded API routes (`/api/projects/[id]/form-xxii/...`) and bespoke UseCases (`generateFormXXIIUseCase`, `approveFormXXIIUseCase`), violating the Clean Architecture rules (`service-layer.md`) and bypassing the existing `Document Engine` architecture.

This plan details how to remove the hardcoded Form-XXII logic and replace it with the generic, dynamic Document Engine.

## User Review Required

> [!WARNING]
> This refactoring will replace the custom `<FormXXIIModal />` with the generic `<DocumentWorkspaceModal />`. We need to ensure that any custom UI inputs (e.g., specific deviation justifications currently in the Form-XXII modal) are properly migrated to the dynamic database `document_template_field` configuration so they still render in the generic modal.

## Open Questions

> [!IMPORTANT]
> 1. Are there specific approval side-effects (e.g., locking the project, sending emails) in `approveFormXXIIUseCase` that need to be preserved when the document moves to the `APPROVED` state in the generic Document Engine? If so, we should handle these via Domain Events rather than a hardcoded approval route.
> 2. Should we keep the existing `generateFormXXIIUseCase` business logic and move it to a `FormXXIIResolver`, or is it pure CRUD data that the default generic resolver can handle?

## Proposed Changes

---

### API Layer (Removals)

We will delete the hardcoded Form-XXII endpoints, as they will be replaced by the generic `/api/document-engine` routes and a new generic document fetcher.

#### [DELETE] [form-xxii/route.ts](file:///D:/coalrrnextjs/src/app/api/projects/%5Bid%5D/form-xxii/route.ts)
#### [DELETE] [draft/route.ts](file:///D:/coalrrnextjs/src/app/api/projects/%5Bid%5D/form-xxii/draft/route.ts)
#### [DELETE] [approve/route.ts](file:///D:/coalrrnextjs/src/app/api/projects/%5Bid%5D/form-xxii/approve/route.ts)

---

### API & UseCase Layer (Additions/Modifications)

We will create a generic endpoint to list documents for a project by template code, and migrate the Form-XXII specific generation logic into a Document Engine Resolver.

#### [NEW] [route.ts](file:///D:/coalrrnextjs/src/app/api/projects/%5Bid%5D/documents/route.ts)
Create a generic GET endpoint `/api/projects/[id]/documents` that accepts a `?templateCode=` query parameter. This replaces the hardcoded `form-xxii/route.ts`.

#### [NEW] [GetProjectDocumentsUseCase.ts](file:///D:/coalrrnextjs/src/modules/document-engine/application/use-cases/GetProjectDocumentsUseCase.ts)
Create a UseCase that fetches `document_instance` and `file_attachment` data dynamically based on the project ID and provided `templateCode`. This will house the logic previously found in `form-xxii/route.ts`, but in a generic way.

#### [NEW] [FormXXIIResolver.ts](file:///D:/coalrrnextjs/src/modules/document-engine/application/resolvers/FormXXIIResolver.ts)
Migrate the data fetching logic from `generateFormXXIIUseCase` into a standard `IDocumentResolver`. This class will fetch the `land_schedule` and project data and map it to the Document Engine's `{ fields, tables }` format.

#### [MODIFY] [ResolverRegistry.ts](file:///D:/coalrrnextjs/src/modules/document-engine/application/ResolverRegistry.ts)
Register the new `FormXXIIResolver` under the key `FORM-XXII`.

---

### UI Layer

We will swap out the custom Form-XXII modal for the reusable `DocumentWorkspaceModal`.

#### [DELETE] [FormXXIIModal.tsx](file:///D:/coalrrnextjs/src/modules/project-master/components/FormXXIIModal.tsx)
Delete the custom modal.

#### [MODIFY] [ProjectMasterView.tsx](file:///D:/coalrrnextjs/src/modules/project-master/components/ProjectMasterView.tsx)
- Replace imports and usage of `<FormXXIIModal />` with `<DocumentWorkspaceModal templateCode="FORM-XXII" />`.
- Update data fetching to call `/api/projects/[id]/documents?templateCode=FORM-XXII`.

#### [MODIFY] [AcquisitionDetail.tsx](file:///D:/coalrrnextjs/src/modules/land-acquisition/components/AcquisitionDetail.tsx)
- Replace imports and usage of `<FormXXIIModal />` with `<DocumentWorkspaceModal templateCode="FORM-XXII" />`.

## Verification Plan

### Automated Tests
- Run Next.js build: `npm run build` to ensure no broken imports from the deleted routes/components.
- Run test suites for the `document-engine` module (if available) to ensure the new resolver works correctly.

### Manual Verification
1. Navigate to the Project Master view and click the "Generate Form XXII" button.
2. Verify that the generic `DocumentWorkspaceModal` opens instead of the old custom modal.
3. Verify that the dynamic form fields (if any are configured for FORM-XXII) appear correctly.
4. Generate the document and verify the downloaded `.docx` contains the correct mapped data from the resolver.
5. Verify that the dashboard correctly lists the generated Form-XXII using the new generic GET endpoint.
