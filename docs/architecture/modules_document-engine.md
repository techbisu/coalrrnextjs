# modules/document-engine Module

## Purpose
This module is responsible for the document-engine layer of the application. It encapsulates the Application Layer Use Cases that orchestrate the lifecycle of document generation, utilizing the pure `src/lib/engines/docx` engine.

## File-by-file breakdown
| File | Description |
|------|-------------|
| `modules/document-engine/application/ResolverRegistry.ts` | Provides functionality related to ResolverRegistry. |
| `modules/document-engine/application/resolvers/FormIResolver.ts` | Provides functionality related to FormIResolver. |
| `modules/document-engine/application/resolvers/FormXXIIResolver.ts` | Provides functionality related to FormXXIIResolver. |
| `modules/document-engine/application/use-cases/StartDocumentWorkspaceUseCase.ts` | Orchestrates the initialization of a document workspace session. |
| `modules/document-engine/application/use-cases/SaveDocumentFormUseCase.ts` | Orchestrates saving dynamic form data to the draft. |
| `modules/document-engine/application/use-cases/GenerateDocumentUseCase.ts` | Orchestrates the final rendering of the `.docx` and saving to storage. |
| `modules/document-engine/domain/IDocumentInstanceRepository.ts` | Handles database operations for IDocumentInstance. |
| `modules/document-engine/domain/IDocumentResolver.ts` | Provides functionality related to IDocumentResolver. |
| `modules/document-engine/domain/IDocumentTemplateRepository.ts` | Handles database operations for IDocumentTemplate. |
| `modules/document-engine/infrastructure/persistence/PrismaDocumentInstanceRepository.ts` | Handles database operations for PrismaDocumentInstance. |
| `modules/document-engine/infrastructure/persistence/PrismaDocumentTemplateRepository.ts` | Handles database operations for PrismaDocumentTemplate. |

## Key dependencies
**Internal Modules:**
- `lib` (Core Document Engine)
- `infrastructure` (DI and Repositories)
- `shared`

**External Packages:**
- `@prisma/client`

## Entry points
- Accessed via REST API routes in `src/app/api/document-engine` utilizing DI containers.
