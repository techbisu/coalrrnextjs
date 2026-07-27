# File Management Module

## Overview
The File Management module is responsible for handling all file uploads, downloads, previewing, and attachments within the application. The module has been refactored to align closely with the established **Clean Architecture** patterns, **SOLID** principles, and configuration management rules defined in `AGENTS.md`.

## Architecture & Structure
The module is encapsulated inside `src/modules/file-management` and follows strict layer separation:

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

## Dependency Injection (DI)
The module heavily utilizes Dependency Injection to decouple Use Cases from Infrastructure implementations.

All module dependencies are wired up in `src/infrastructure/di/modules/file.di.ts` and exported through the global `Container.ts`.

```typescript
import { uploadFileUseCase } from '@/infrastructure/di/Container';

// Usage inside Server Actions or Route Handlers:
const result = await uploadFileUseCase.execute({ ... });
```

### Registered Use Cases
- `UploadFileUseCase`
- `DeleteFileUseCase`
- `DownloadFileUseCase`
- `LinkFileUseCase`
- `GetFilePreviewUseCase`

## Configuration Management
In accordance with `.agents/rules/config-management.md`, the module never reads `process.env` directly. 

1. **Environment Variables**: Defined in `.env` and strictly validated using Zod at application startup inside `src/core/config/env.ts`.
   - `UPLOAD_MAX_SIZE_MB`
   - `UPLOAD_MAX_FILES`
   - `STORAGE_PROVIDER`
   - `ENABLE_VIRUS_SCAN`

2. **Module Config**: The validated variables are consumed by the module-specific configuration file located at `src/core/config/upload.config.ts`. All application code relies on this `uploadConfig` object.

## Background Jobs & Audit Logs
While actual file uploads must be processed synchronously to return immediate feedback and file metadata to the HTTP client, side-effects like generating audit logs are strictly pushed to the background queue.

In accordance with `.agents/rules/background-jobs.md`, the `UploadFileUseCase` dispatches an `auditLog` event to the shared Background Job dispatcher without blocking the main thread:

```typescript
await Container.jobDispatcher.dispatch('auditLog', {
  type: 'CUSTOM_ACTIVITY',
  payload: {
    activity: `New file uploaded: ${request.originalName}`,
    userId: ownerId
  }
})
```

## Security 
The module implements multiple layers of security to prevent unauthorized access and protect against malicious uploads:

1. **Virus Scanning**: Integrated `ClamAVScanner` support to validate file buffers before storage.
2. **File Size/Type Limiting**: Enforced inside `UploadFileUseCase` via limits defined in `upload.config.ts`.
3. **Data Protection**: Document downloads via `downloadFileUseCase` enforce authorization. Document PDFs are dynamically watermarked with QR Codes tracing back to the user downloading the document.
4. **Sanitization**: Filenames are sanitized in the API routes using strict regex to prevent Path Traversal attacks.
5. **Storage Organization**: To prevent directory inode limits and improve scalability, files saved to both LocalStorage and S3 are grouped in directories automatically separated by `YYYY/MM/DD/` paths, ensuring a clean hierarchical structure over time.

## API Routes & Server Actions
All routes related to File Management interact exclusively with the DI container use cases:
- `POST /api/files/upload`: Secure endpoint to upload raw multipart form data files.
- `GET /api/files/[fileId]/download`: Streams secure document downloads and applies PDF watermarking.
- `POST /api/files/link`: Links an existing file record to a business entity.
- Server Actions (`actions.ts`): Reusable server action wrappers for Next.js Server Components.
