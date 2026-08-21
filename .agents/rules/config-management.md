---
trigger: always_on
---

# Configuration Management Rule

## Core requirement (ABSOLUTE BAN ON HARDCODING)
NEVER hardcode ANYTHING statically in the code. This includes:
- Magic strings, IDs, template codes, or statuses.
- Business rule limits, feature flags, default values, thresholds, URLs, timeouts, retry counts, pagination sizes.
- UI Labels and text (which must go through i18n/translations).
Every such value MUST live in a database table, a module config file, or an env variable — absolutely zero inline hardcoding.

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

## Module & Checkable Entity Naming Rule (STRICTLY ENFORCED)

> This is a HARD rule. Every violation must be fixed before a PR can be merged.

### The single source of truth
ALL module codes and checkable entity types are defined EXCLUSIVELY in:
`src/core/config/module-codes.config.ts`

The exported constants are:
```ts
MODULE_CODES.LAND_SCHEDULE          // = 'LAND_SCHEDULE'
MODULE_CODES.COMPENSATION_PAYROLL   // = 'COMPENSATION_PAYROLL'
MODULE_CODES.EMPLOYMENT_APP         // = 'EMPLOYMENT_APP'
MODULE_CODES.FORM_I_CLAIM           // = 'FORM_I_CLAIM'

CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE      // = 'acq_land_schedule'
CHECKABLE_ENTITY_TYPES.COMPENSATION_PAYROLL   // = 'compensation_payroll'
CHECKABLE_ENTITY_TYPES.EMPLOYMENT_APPLICATION // = 'employment_application'
CHECKABLE_ENTITY_TYPES.FORM_I_CLAIM           // = 'form_i_claim'

ACQ_LAND_SCHEDULE  // shorthand alias for CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE
```

### Mandatory usage pattern
```ts
// ✅ CORRECT — always import and use the constant
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'

const rules = await db.checklist_requirement_rule.findMany({
  where: { module_code: MODULE_CODES.LAND_SCHEDULE }
})

const records = await db.manual_milestone.findMany({
  where: { entity_type: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE }
})
```

```ts
// ❌ FORBIDDEN — raw string literals anywhere in application code
where: { module_code: 'LAND_SCHEDULE' }           // FORBIDDEN
where: { module_code: 'LAND_ACQ_PROPOSAL' }        // FORBIDDEN
where: { entity_type: 'acq_land_schedule' }        // FORBIDDEN
where: { entity_type: 'land_schedule' }            // FORBIDDEN
where: { module_code: 'compensation_payroll' }     // FORBIDDEN
```

### Adding a new module (mandatory steps - Hybrid Approach)
Because we use a hybrid approach (DB for referential integrity + TS for compile-time safety), adding a new module requires dual-registration:
1. Add the new module to the Database: `INSERT INTO master.app_modules (module_code, name) VALUES ('NEW_MODULE', '...')` (create a DB migration/seed script).
2. Add the exact same module code to `MODULE_CODES` in `module-codes.config.ts`.
3. Add the entity type to `CHECKABLE_ENTITY_TYPES` in the same file.
4. Add any alias normalization to `normalizeModuleCode()` in the same file.
5. Only then use `MODULE_CODES.NEW_MODULE` across the codebase.

### Self-check before every edit
Before writing any string that looks like a module code or entity type:
- Is it already in MODULE_CODES or CHECKABLE_ENTITY_TYPES? → use the constant
- Is it a new module? → add it to module-codes.config.ts FIRST, then use the constant
- Never copy-paste the string value — always import the constant

## Forbidden
- Never hardcode: page sizes, timeout values, retry counts, file size/type limits,
  approval deadline days, currency symbols, date formats, queue names, threshold
  percentages (e.g. "80% budget warning") — all go in the relevant module config
- Never hardcode raw module code or entity type strings inline — always import from
  `module-codes.config.ts`
- Never read `process.env.X` directly outside `src/core/config/env.ts`
- Never commit `.env` — only `.env.example` with placeholder values and comments
- Never add a new module code as a raw string to a single file — it MUST be in
  module-codes.config.ts first

## Report requirement
When introducing a new configurable value, explicitly confirm:
"Config: [value] added to [module].config.ts" or "Env var: [NAME] added to env.ts +
.env.example, consumed by [module].config.ts"

When writing code that references a module code or entity type, confirm:
"Using MODULE_CODES.[X] / CHECKABLE_ENTITY_TYPES.[X] from module-codes.config.ts"