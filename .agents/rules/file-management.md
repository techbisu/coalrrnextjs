# File Manager & Upload Rule

## Core Requirement
ANY file upload requirement across ANY module (proposal justifications, compliance checklist items, project statutory clearances, Form-XXII baseline documents, PAF census cards, etc.) MUST be processed through the central **File Manager** service layer (`file_record` and `file_attachment` tables).

## Mandatory Implementation Pattern
1. **Upload Engine**: Use `UploadFileUseCase` via `Container.uploadFileUseCase` or POST `/api/files/upload`.
2. **Polymorphic File Linking (`public.file_attachment`)**:
   - Files MUST be linked to their parent business entity using `public.file_attachment`:
     - `entity_type`: Target entity (e.g. `'workflow_action_history'`, `'acq_proposal'`, `'project'`, `'checklist_submission'`).
     - `entity_id`: Primary key of the parent entity.
     - `file_id`: Reference to `public.file_record.id`.
3. **Security & Validation**:
   - Max file size and allowed MIME types MUST be validated via `src/core/config/upload.config.ts`.
   - Filenames MUST be sanitized using path traversal prevention.
   - Virus scan checks MUST run via `ClamAVScanner` or clean status fallback.

4. **Document Engine Single Instance Replacement**:
   - When a document (Form-VII, Form-XXII) is regenerated for a `document_instance`, `GenerateDocumentUseCase` MUST delete/replace the previous file record and physical file (`deleteFileUseCase`) before creating the new file.
   - The system MUST NEVER accumulate duplicate file records or orphaned files for the same `document_instance` ID.

## Forbidden
- NEVER store raw file paths directly in entity columns without creating a `file_record` entry.
- NEVER create separate custom file upload tables per module (e.g., `proposal_files`, `project_files` are banned).
- NEVER read `process.env` directly for upload configs — consume `uploadConfig` from `src/core/config/upload.config.ts`.
- NEVER bypass `public.file_attachment` polymorphic linking.
- NEVER accumulate duplicate generated files for the same document instance on regeneration.
