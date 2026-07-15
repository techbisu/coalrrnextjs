# Service/Repository Layer Rule

## Mandatory
- NEVER call Prisma directly from API routes, UseCases, or components
- ALL data access goes through: Repository interface (domain) → PrismaRepository (infrastructure)
- ALL business logic goes through a UseCase (application) — never inline in API routes
- Before writing a new service: search_graph to check if a similar service/repository
  already exists — extend it, don't duplicate
- Cross-cutting concerns (logging, audit, notifications) → shared service, called from
  UseCases, never duplicated per-module

## Where services actually live (per get_architecture scan)
- System-wide/cross-cutting → src/core/<domain>/services/ (e.g. AuditService, AuthorizationService)
- Feature-specific domain logic → src/modules/<module>/services/ (e.g. ProjectService, FileService)
- Pure technical/infra → src/lib/<area>/ (e.g. UrlService, CaptchaService, PdfService)
- Orchestration (Use Cases) → src/application/use-cases/ OR src/modules/<module>/application/use-cases/

## MANDATORY: Dependency Injection
NEVER instantiate a service directly (no `new AuditService()` in a UseCase/route).
ALWAYS access services via src/infrastructure/di/Container.ts (e.g. Container.authService).
If a new service is created, it MUST be registered in Container.ts — not left unwired.

## Before creating a new service
1. search_graph the feature/domain name — a service may already exist in core/ or modules/
2. Decide placement: system-wide → core/, feature-specific → modules/<name>/services/,
   purely technical → lib/
3. Register it in Container.ts before using it anywhere
