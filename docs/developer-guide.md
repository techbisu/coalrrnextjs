# CoalrrNextjs Developer Guide

Welcome to the CoalrrNextjs developer guide. This document serves as the primary onboarding and reference guide for developers working on the codebase. It details the application architecture, folder structure, core philosophies, and essential developer workflows.

---

## 1. Introduction & Stack Overview

The application is built for enterprise scale, prioritizing maintainability, modularity, and strict adherence to software design principles. 

### Core Technologies
- **Framework:** Next.js (App Router)
- **Database ORM:** Prisma (PostgreSQL)
- **Styling:** Tailwind CSS & vanilla CSS (when needed)
- **UI Components:** shadcn/ui
- **Type System:** TypeScript

### Core Philosophy
Our architecture is heavily inspired by **Clean Architecture** and **Domain-Driven Design (DDD)**. We strictly enforce **SOLID principles**:
- **Single Responsibility:** Classes and functions do exactly one thing. If a file does more, it must be split.
- **Open/Closed:** We extend functionality via new UseCase or Repository implementations rather than modifying shared core logic.
- **Liskov Substitution:** Repository implementations must fully satisfy their interface contracts.
- **Interface Segregation:** We use small, focused repository interfaces instead of massive god-interfaces.
- **Dependency Inversion:** UseCases depend on repository INTERFACES (domain layer), never on PrismaRepository (infrastructure layer) directly.

---

## 2. Application Architecture & Data Flow

To ensure separation of concerns and maintainability, the application follows a strict layer flow. You must **never skip a layer** when building features.

### The Strict Layer Flow
`Entity (domain) → Repository interface (domain) → PrismaRepository (infrastructure) → UseCase (application) → API route (app) → UI component (ui)`

1. **Entity (Domain):** Represents core business objects and rules. Pure TypeScript, no framework dependencies.
2. **Repository Interface (Domain):** Defines the contract for data operations without specifying *how* the data is fetched.
3. **PrismaRepository (Infrastructure):** Implements the Repository interface using Prisma.
4. **UseCase (Application):** Orchestrates business logic using domain entities and repository interfaces. 
5. **API Route (App):** Next.js route handlers that receive HTTP requests, call the appropriate UseCase, and return a response. **No business logic lives here.**
6. **UI Component (UI):** React components (Server or Client) that render data and capture user input. **No business logic lives here.**

### Error Handling (`Result<T,E>`)
All mutations and complex domain logic must return a `Result<T,E>` object rather than throwing exceptions. This ensures errors are explicitly handled across layers and prevents internal exceptions from leaking into the UI or API responses.

### Dependency Injection (DI) Pattern
We use **Module-Level Containers** for wiring dependencies. 
- Example: `src/infrastructure/di/modules/<module>.di.ts`.
- **Never** add new UseCases directly to the global `src/infrastructure/di/Container.ts`. Add them to their respective module container, and ensure that module container is exported in the main `Container.ts`.
- Inside module `.di.ts` files, handle Fast Refresh cache using the `globalThis` pattern to prevent memory leaks during development.

---

## 3. Detailed Folder Structure (`src/`)

Every new file MUST go inside one of the approved folders below. **Never create a new top-level folder in `src/` without explicit approval.**

- **`app/`**: Next.js App Router (Pages, Layouts, API routes). **Strictly no business logic.**
- **`application/`**: Cross-cutting Use Cases that are not tied to any single feature module.
- **`components/`**: Shared UI components (shadcn/ui and custom). Reuse existing components before creating new ones. Break large views into section-wise sub-components for reusability.
- **`core/`**: System-wide services such as audit logging, authorization, notifications, jobs, and the `Result` type implementation.
- **`domain/`**: Pure business rules, Entities, and Value Objects.
- **`infrastructure/`**: PrismaRepository implementations, DI Containers, and external security integrations.
- **`lib/`**: Technical utilities (e.g., db client wrappers, URL helpers, formatters).
- **`localization/`**: i18n services, caches, and translation components.
- **`modules/`**: Feature-specific vertical slices (e.g., `project`, `proposal`, `land-acquisition`). Each module can contain its own internal `domain`, `application`, and `services` layers as needed. Mirror the `Project` module structure when creating new modules.
- **`providers/`**: React Context providers for global state and theme management.
- **`shared/`**: Shared React hooks and layouts.

---

## 4. Why We Use This Structure

- **Scalability in an Enterprise Context:** As the application grows, vertical slices (`modules/`) and strict layering prevent the codebase from becoming an entangled mess (spaghetti code).
- **Enforcing Separation of Concerns:** By keeping Next.js (the web framework) isolated in `app/`, the core business logic remains framework-agnostic. We can upgrade Next.js or change UI frameworks without rewriting our UseCases or Entities.
- **Consistency & Predictability:** Standardized patterns (like DI containers and the Result pattern) ensure that any developer jumping into a new module immediately understands where to find the routing, the business logic, and the database queries.
- **Testability:** Depending on repository interfaces (Dependency Inversion) makes it trivial to mock database interactions when unit testing UseCases.

---

## 5. Key Developer Workflows & Rules

### A. Background Jobs & Async Tasks
**Rule:** Any asynchronous work (emails, PDF generation, bulk processing) must be abstracted behind a single Job handler. 
- Define jobs as plain functions in `src/core/jobs/handlers/<jobName>.job.ts`.
- Dispatch jobs *only* through `JobDispatcherService` (`Container.jobDispatcher.dispatch(...)`).
- **Never** instantiate a queue client directly in a UseCase.
- The `JobDispatcherService` handles branching: inline execution in development and BullMQ (Redis) enqueueing in production.

### B. Configuration Management
**Rule:** NEVER hardcode configurable values (magic numbers, API limits, timeouts, retry counts, pagination sizes) in business logic or UI.
- Place module-specific constants in `src/core/config/<module>.config.ts` (e.g., `upload.config.ts`, `pagination.config.ts`).
- Environment variables (that change per deployment) go in `.env` and must be validated centrally in `src/core/config/env.ts` (using Zod/T3 Env) at startup.
- **Never** read `process.env.X` directly outside of `env.ts`.

### C. Validation
**Rule:** Use one source of truth for validation—both server and client.
- All Zod schemas live in `src/core/validation/schemas/<entity>.schema.ts`.
- **Server:** Every API route/UseCase must run `schema.parse()` before processing.
- **Client:** Every form must use `zodResolver(schema)` and configure React Hook Form with `mode: 'onTouched'` and `reValidateMode: 'onChange'`.
- Errors must render below fields using the shared `<FormField>` and `<FormMessage>` components.

### D. Security & Authorization (RBAC)
- **Authentication:** Every API Route and Server Action must have an explicit auth check. There are no "public by default" routes.
- **Authorization:** Every permission/role check must go through `AuthorizationService` via the DI Container. Never hardcode `if (user.role === 'admin')` inline.
- **Validation:** Validate on the server always; client-side validation is for UX only. Use parameterized queries exclusively (Prisma handles this).
- **Secrets:** Never log `.env` contents, credentials, or expose internal stack traces/database errors to the client.

### E. Package Hygiene
- Run the "reuse-check skill" before creating new code, and check if an existing package solves the problem before installing a new one.
- Any new package must be actively maintained, have no critical vulnerabilities, provide TypeScript support, and have a compatible license.
- Never update major versions silently or without user approval.

### F. Temporary Files
- If you need a temporary scratch file, place it in the `tmp/` folder (which is gitignored).
- You must delete the temporary file before marking a task complete.

---
*Following this guide ensures the CoalrrNextjs application remains secure, stable, and highly maintainable for years to come.*
