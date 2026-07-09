# COALRR Enterprise Developer Handbook

Welcome to the **COALRR Developer Handbook**. This document is the single source of truth for the system's architecture, frameworks, conventions, and operational workflows. 

---

## 1. Project Overview
**Project Purpose:** COALRR digitizes land acquisition, census recording, and compensation (R&R) workflows for enterprise coal entities.
**Business Goals:** Eliminate paper trails, standardize compliance (CL-1), and ensure transparent payouts.
**Target Users:** HQ Approvers, Field Officers, GIS Engineers, and Compensation Clerks.
**Technology Stack:** Next.js (App Router), React, Prisma, PostgreSQL, Zustand, TailwindCSS, Shadcn UI.
**Architecture Style:** Modular, Domain-Driven, Service-Oriented (Strangler Fig pattern applied to legacy SPA).
**Major Features:** Dynamic Forms, Policy-Based Authorization, File Management, Workflow Engine.
**Modules:** Project Master, Land Acquisition, Census, Compensation, Payroll.

---

## 2. High Level Architecture

```mermaid
graph TD
    subgraph Presentation Layer [Next.js App Router]
        SC[Server Components]
        CC[Client Components]
        API[API Routes]
    end
    subgraph Core Frameworks [Cross-Cutting Concerns]
        AuthZ[Authorization]
        Audit[Audit & Logging]
        EventBus[Event Bus]
        Doc[Docx Engine]
    end
    subgraph Application Layer [Bounded Contexts]
        PS[Project Service]
        AS[Acquisition Service]
    end
    subgraph Infrastructure [Data Access]
        PR[Prisma Repo]
        DB[(PostgreSQL)]
    end
    SC --> Application Layer
    CC --> API
    API --> Application Layer
    Application Layer --> Core Frameworks
    Application Layer --> Infrastructure
    Infrastructure --> DB
```

- **Presentation Layer:** Next.js UI and HTTP boundaries. No business logic.
- **Application Layer:** Services that orchestrate business rules.
- **Infrastructure Layer:** Repositories handling database interaction.

---

## 3. Folder Structure

```text
src/
├── app/                  # Next.js Presentation Layer (Routes & APIs)
├── core/                 # Cross-Cutting Frameworks (Auth, Audit, Workflow)
├── modules/              # Domain-Driven Bounded Contexts (Project, Land)
│   └── [module-name]/
│       ├── components/   # Domain-specific UI
│       ├── services/     # Business logic
│       └── repositories/ # Prisma data access
└── shared/               # Global Reusable Assets (UI, Hooks, Utils)
```
**Rule:** Domain logic never goes in `shared`. Modules communicate via the `EventBus` or standard APIs, never by importing each other's internals.

---

## 4. Project Startup

```bash
# Clone and Install
git clone <url> && npm install

# Environment & DB
cp .env.example .env
npx prisma generate
npx prisma db push

# Seed Core Data (RBAC)
node scripts/seed.js

# Development
npm run dev

# Production Build
npm run build
npm start
```

---

## 5. Environment Variables

| Variable | Purpose | Required | Example | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection | Yes | `postgresql://user:pass@localhost:5432/coalrr` | Used by Prisma |
| `NEXT_PUBLIC_APP_URL` | Base application URL | Yes | `http://localhost:3000` | Used for CORS/Links |
| `JWT_SECRET` | Secret for session | Yes | `s3cr3t` | Min 32 chars |
| `AES_SECRET_KEY` | Secret for URLs | Yes | `aes_key` | Used for Secure Downloads |

---

## 6. Configuration System

Configuration in COALRR is decentralized and domain-specific to avoid a massive global config file bottleneck.

- **Application Config:** Environment variables (`.env`) for global constants like `NEXT_PUBLIC_APP_URL` and `NODE_ENV`.
- **Database Config:** Prisma schema handles connection pooling and connection strings via `DATABASE_URL`.
- **Authentication Config:** Configured inside `src/core/authorization/providers/AuthProvider.tsx` (token expiry, session rules).
- **Notification Config:** Event subscriptions and templates are registered in `src/core/notifications/EventBus.ts`.
- **Storage Config:** Environment variables dictate whether the `StorageProvider` uses local disk or remote buckets (`STORAGE_PROVIDER=minio`).
- **Localization Config:** Language fallback and routing managed by `next-intl` in `middleware.ts`.
- **Workflow Config:** State machines and transition guards are hardcoded in `src/core/workflow/states.ts` for type safety.
- **Document Engine Config:** Template keys and placeholder mappings are defined in `src/lib/engines/registry.ts`.
- **Audit Config:** The `AuditQueue` determines retention policies (e.g., automatically archiving logs older than 5 years).
- **Security Config:** Rate limiting thresholds and JWT algorithms are defined in `src/infrastructure/security/index.ts`.
- **Queue Config:** Job concurrency and retry limits are set in the BullMQ provider initialization.
- **Feature Flags:** Simple boolean toggles in the database (e.g., `MstTenant` settings) to dynamically enable/disable specific modules per tenant.

---

## 7. Authentication Framework
Handled via Next.js API Routes and Context.
**Flow:** POST `/api/auth/login` ➔ Server validates ➔ Sets HTTP-only secure cookie ➔ Client `useAuth()` hydrates React Context.

---

## 8. Authorization Framework
Uses a Spatie-like RBAC model.
**Server:** `await authorizeApi('proposal.create')`
**Client:** `<Can permission="proposal.create"> ... </Can>`
Permissions are cached in the HTTP-only cookie JWT payload.

---

## 9. Audit Framework
All critical mutations log to the immutable `AuditLog` table.
```typescript
AuditQueue.push({ action: 'LOCK_PROJECT', entityId: id, details: 'Locked baseline.' })
```
Allows visual reconstruction of any entity's timeline.

---

## 10. Notification Framework
Uses Event Driven Design.
```typescript
EventBus.publish({ eventName: 'PROJECT_LOCKED', data: { id } })
```
Subscribers in `src/core/notifications` handle pushing emails, SMS, or in-app alerts based on preferences.

---

## 11. Document Engine
Generates Form-D and Form-I via `.docx` templates.
1. Upload template with `{{placeholders}}`.
2. Map fields in `registry.ts`.
3. Call `DocxEngine.generate('FORM_I', payload)`.

---

## 12. File Management Framework
Wraps MinIO/S3 (Future) via a `StorageProvider` interface. Current implementation uses local block storage. All uploads run through virus scanning APIs (if configured) and generate audit records.

---

## 13. Secure Download Service
Files generate a time-limited, AES-encrypted JWT URL (`/api/files/download?token=XYZ`). This allows public QR-code scanning verification without requiring a login session.

---

## 14. Localization Framework
Managed via `next-intl`.
```tsx
const t = useAppTranslation('common'); return <h1>{t('welcome')}</h1>
```
Fallback is always English.

---

## 15. Workflow Engine
Finite State Machine inside `src/core/workflow`.
States include `Draft`, `Submitted`, `Approved`.
Transitions are protected by **Guards** (e.g., cannot approve proposal if area exceeds budget).

---

## 16. URL Framework
All links use the unified `routes` builder.
```typescript
const link = routes.proposal.details('SCH-123') // Prevents hardcoded strings
```

---

## 17. CAPTCHA Framework
Used for external forms and authentication. Currently implemented as a server-side verified Math CAPTCHA.

---

## 18. Event System
Decouples modules. Project Master fires `PROJECT_UPDATED`, and Land Acquisition module listens to it to recalculate land budgets without strict imports.

---

## 19. Background Job Framework
In-memory queue for dev. Future production will use **BullMQ + Redis** for asynchronous PDF generation and heavy R&R payroll calculations.

---

## 20. Storage Framework
`src/core/storage/StorageProvider`. Swap between Local/MinIO/S3 by changing `.env` variables without changing business logic.

---

## 21. Repository Pattern
**Rule:** No business logic in Repositories. Only Prisma calls.
```typescript
export class ProjectRepository {
  static async findById(id: string) { return prisma.mstProject.findUnique({ where: { id } }) }
}
```

---

## 22. Service Layer
Orchestrates Repositories, Events, and Audits.
```typescript
export class ProjectService {
  static async lockProject(id: string) {
    const p = await Repo.findById(id); if (p.locked) throw Error()
    await Repo.lock(id); EventBus.publish(...); AuditQueue.push(...)
  }
}
```

---

## 23. Policies
`src/core/authorization/policies/`. Encapsulates complex boolean logic (e.g., `canEditProposal(user, proposal) => isOwner || isAdmin`).

---

## 24. API Layer
Thin routes: Validate Session ➔ Validate Payload (Zod) ➔ Call Service ➔ Return Standard `ok()` or `badRequest()`.

---

## 25. Database
Uses Prisma with strict foreign keys, cascading soft deletes, and composite indices on `tenantId` (future).

---

## 26. Component Library
`src/shared/components/ui`. Uses Shadcn.
**Do:** Pass standard HTML props. **Don't:** Put business logic inside `Button.tsx`.

---

## 27. Hooks
`src/shared/hooks/`. Examples include `useDebounce`, `useMediaQuery`. Keeps UI clean.

---

## 28. Providers
`src/providers/`. Global contexts like `ThemeProvider`, `AuthProvider`, `QueryClientProvider`.

---

## 29. Middleware
Next.js `middleware.ts`. Protects `/api/*` and `/(dashboard)/*` at the edge using JWT verification.

---

## 30. Validators
Uses Zod schemas (`src/application/validators`). Shared between client-side form validation and API payload validation.

---

## 31. Utilities
`src/shared/utils/`. Contains `formatINR()`, `timeAgo()`, `cn()` for Tailwind class merging.

---

## 32. Coding Standards
- **Files:** PascalCase (`ProjectView.tsx`), kebab-case (`project-master`).
- **Interfaces:** Prefix with `I` (e.g., `IProject`).
- **State:** Prefer Server State (React Query) over Client State (Zustand) where possible.

---

## 33. Enterprise Development Guidelines (Adding a Feature)
1. DB: Add to `schema.prisma`.
2. Module: Create `src/modules/xyz/`.
3. Repo: Create `XyzRepository.ts`.
4. Service: Create `XyzService.ts`.
5. API: Create `/api/xyz/route.ts`.
6. UI: Create `/app/(dashboard)/xyz/page.tsx`.

---

## 34. Error Handling
Global try/catch in APIs returns `serverError(message)`. Domain errors (e.g., `ValidationException`) return HTTP 400.

---

## 35. Performance Guidelines
- **N+1 Queries:** Use Prisma `include` properly.
- **Client Bundles:** Use Server Components by default. Add `'use client'` strictly at the leaf component level.

---

## 36. Security Guidelines
- CSRF protection via Next.js defaults.
- XSS protection via React DOM escaping.
- No direct database IDs in URLs (use CUIDs or slugs).

---

## 37. Deployment Guide
Deploy via Vercel or Docker. Dockerfile included in root uses multi-stage builds. Ensure `DATABASE_URL` is set to the production PgBouncer instance.

---

## 38. Troubleshooting Guide
- **403 Forbidden:** Check `RolePermission` tables in Postgres.
- **Module Not Found:** Ensure `tsconfig.json` alias paths (`@/core/*`) are correct.
- **Prisma Error:** Run `npx prisma generate` after schema changes.

---

## 39. FAQ
- **How to add a translation?** Add key to `messages/en/common.json`.
- **How to upload a file?** Use `FileService.upload()`.

---

## 40. Future Roadmap
1. Complete SPA ➔ App Router Strangler Fig migration.
2. Replace local queues with **Redis/BullMQ**.
3. Implement Multi-Tenant PostgreSQL RLS (Row Level Security).
