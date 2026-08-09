---
trigger: always_on
---

# Configuration Management Rule

## Core requirement
NEVER hardcode a configurable value directly in business logic, components, or
UseCases (magic numbers, limits, feature flags, thresholds, default values, URLs,
timeouts, retry counts, file size limits, pagination sizes, etc.). Every such value
MUST live in a config file or env variable — never inline.

## Module-wise config files (mandatory structure)
`src/core/config/<module>.config.ts` — one config file per module/domain, not one
giant global config file:

D:\coalrrnextjs\src\config
├── app.config.ts → app-wide (name, version source, default locale, timezone)
├── project.config.ts → project module (baseline thresholds, area/budget limits UI defaults)
├── proposal.config.ts → proposal module (approval chain stages, deadlines)
├── upload.config.ts → file upload (max size, allowed types, dropzone limits)
├── job.config.ts → background jobs (retry counts, backoff, queue names)
├── auth.config.ts → auth/session (token expiry, rate-limit thresholds)
└── pagination.config.ts → shared list/table defaults (page size, max page size)

Each config file exports a typed, readonly object:
```ts
export const uploadConfig = {
  maxFileSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB ?? 10),
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  maxFilesPerUpload: Number(process.env.UPLOAD_MAX_FILES ?? 10),
} as const
```

## Env variables — for deployment/environment-level control only
Use `.env` (never committed — confirm `.env` stays in `.gitignore`) for values that
change PER ENVIRONMENT (dev/staging/prod): API keys, DB URL, Redis URL, feature flags
that differ by environment, rate limits that differ by environment, third-party
service URLs.

- ALL env vars accessed through a single validated source — reuse T3 Env or a
  `src/core/config/env.ts` that validates with zod at startup (fail fast if a
  required var is missing), never scattered raw `process.env.X` reads across the
  codebase
- Module config files (above) read from this validated env layer, not directly
  from `process.env`

## Before adding a new hardcoded-looking value
1. search_graph the value/setting name — check if a config entry already exists
   for it (reuse, don't duplicate)
2. Decide: does this change per environment (deployment)? → env var, validated in
   env.ts, consumed by the relevant module config file
   Does this change per business rule but same across environments? → module
   config file constant (not env var)
3. Never let a UseCase, component, or service read `process.env` directly —
   always through env.ts → module config

## Module & Checkable Entity Naming Rule (MANDATORY)
- ALL module codes and checkable entity types MUST use single exported constants from `src/core/config/module-codes.config.ts` (`MODULE_CODES`, `CHECKABLE_ENTITY_TYPES`, e.g., `CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE` or `ACQ_LAND_SCHEDULE = 'acq_land_schedule'`).
- Raw string aliases like `'land_schedule'`, `'acq_proposal'`, `'proposal'` scattered inline across application code or API routes are STRICTLY FORBIDDEN.

## Forbidden
- Never hardcode: page sizes, timeout values, retry counts, file size/type limits,
  approval deadline days, currency symbols, date formats, queue names, threshold
  percentages (e.g. "80% budget warning") — all go in the relevant module config
- Never hardcode raw entity / checkable type strings inline — always import `ACQ_LAND_SCHEDULE` or `CHECKABLE_ENTITY_TYPES`
- Never read `process.env.X` directly outside `src/core/config/env.ts`
- Never commit `.env` — only `.env.example` with placeholder values and comments

## Report requirement
When introducing a new configurable value, explicitly confirm:
"Config: [value] added to [module].config.ts" or "Env var: [NAME] added to env.ts +
.env.example, consumed by [module].config.ts"