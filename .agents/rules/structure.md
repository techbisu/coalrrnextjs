# Project Structure Discipline

## Approved top-level folders (src/) — nothing outside this list without approval
app/            → Next.js routes, API routes, layouts — no business logic
application/    → cross-cutting Use Cases (not tied to one module)
components/     → shared UI — reuse before creating new
core/           → system-wide services (audit, authorization, notifications, Result type)
domain/         → Entities, Value Objects — pure business rules
infrastructure/ → PrismaRepository implementations, DI Container, security
lib/            → technical utilities (db client, url, captcha, document-engine, formatters)
localization/   → i18n services, caches, components
modules/        → feature modules, each with own domain/application/services as needed
providers/      → React context providers
shared/         → shared hooks, shared layouts

## Hard rule
Every new file MUST go inside one of the approved folders above. NEVER create a new
top-level folder without explicit user approval first.

## Before creating any file
1. Identify which existing layer it belongs to (see architecture.md)
2. If unsure which folder — ASK, do not guess by creating a new one
3. No file at project root except configs already there (package.json, tsconfig, etc.)

## Temporary files
If a temp/scratch file is needed mid-task (debug script, one-off check):
1. Create it inside a gitignored `tmp/` folder only
2. MUST delete it before marking the task complete — no exceptions
3. Final response must confirm: "Temp files created: [list] — all removed" or "None created"

## Component Size & Reusability Rule
Do not write excessively large files (e.g. over 500 lines). Focus on breaking down large UI views or complex logic into smaller, focused sub-components for better maintainability **section-wise**.
- If a section can be split, then do it.
- Every time you split a section, you MUST think: "Can this section be reused on another module if the data changes as per logic?" If yes, build it to be highly reusable and data-agnostic.
