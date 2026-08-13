# Database & Seeding Rules

## General
- `prisma/schema.prisma` is the ONLY schema source of truth
- All schema changes via `prisma migrate dev --name <desc>` — never edit DB manually
- No raw SQL unless wrapped inside a repository method
- Use transactions for any multi-table write
- Enforce constraints (FK, unique, not-null) at the DB level, not just app level

## Entity & Schema Modeling Rules (MANDATORY)
- **Primary Key Naming**: MUST name primary key columns using `<entity_name>_id` (e.g. `wah_id`, `state_id`, `proposal_id`, `schedule_id`). Default to UUID string generation (`@default(dbgenerated("gen_random_uuid()")) @db.VarChar(64)`). NEVER use generic `id` for primary keys on new entities.
- **Foreign Key Mapping**: MUST add explicit Foreign Key mappings (`@relation(...)` with constraints like `onDelete: SetNull`/`Cascade` and explicit relation maps).
- **Mandatory Audit Fields**: EVERY table MUST include the 4 standard audit fields:
  ```prisma
  entry_ts      BigInt?  @default(dbgenerated("date_part('epoch'::text, now())"))
  updt_ts       BigInt?  @default(dbgenerated("date_part('epoch'::text, now())"))
  entry_by      String?  @db.VarChar(64)
  updt_by       String?  @db.VarChar(64)
  ```
- **`entry_by` & `updt_by` Values (MANDATORY)**: MUST store ONLY the numeric/string authenticated User ID (e.g., `String(auth.user.id)`). NEVER store email addresses or full names in `entry_by` or `updt_by`.
- **`entry_ts` & `updt_ts` Values (MANDATORY)**: MUST use **Epoch BigInt** (`BigInt(Math.floor(Date.now() / 1000))` or `BigInt(Date.now())`) across all database write operations and timestamp fields. Date object strings are banned for audit timestamps.
- **Document / Attachment Mapping**: NEVER store `document_id` directly as a column on entity tables. ALWAYS use the reusable polymorphic `public.file_attachment` junction table (`file_id`, `entity_type`, `entity_id`, `module`) for linking file attachments to entities.

## Migration — one file per table (mandatory)
- Every migration MUST target ONE table/entity only — never bundle multiple unrelated table changes into a single migration file
- Migration name MUST reflect the table + change, e.g.:
  `prisma migrate dev --name add_status_column_to_proposal`
  `prisma migrate dev --name create_payroll_table`
- If a task touches 2+ tables, run migrate dev separately per table, in dependency order (parent tables before tables with FK to them)
- NEVER squash/combine existing migration files — each stays as its own immutable step

## Seeding — one file per table (mandatory)
- Every seed file covers exactly ONE table/entity: `prisma/seed/<table-name>.seed.ts`
- Every seed change MUST update ALL of these together, never just one:
  1. `prisma/seed/index.ts` (entry point — must import every seed module)
  2. `prisma/seed/<entity>.seed.ts` (the actual data)
  3. `prisma/seed/translations.seed.ts` — if the entity has any user-facing label/enum, translations MUST be added in the SAME task, not skipped

## Forbidden — will be rejected
- NEVER create a new file for a one-off seed (e.g. temp.ts, seed-fix.ts, quick-seed.ts)
- NEVER seed data outside `prisma/seed/`
- NEVER add a seed without running `search_graph` first to check if a seed for that entity already exists — extend it, don't duplicate
- NEVER combine multiple tables' seed data into one file
- NEVER store `document_id` directly on entity tables

## Reset/Drop policy — CRITICAL, never violate
- NEVER run `prisma migrate reset` or drop the full database, for ANY reason, without explicit user confirmation typed out for that specific request
- To reset/clear data for ONE table only, use a targeted approach:
  - `TRUNCATE TABLE "<table>" CASCADE;` wrapped in a repository/script method, table name explicit — never a loop over "all tables"
  - Or a scoped Prisma call: `prisma.<model>.deleteMany()` for that single model only
- Before any drop/truncate/reset action: state exactly which table and why, and wait for confirmation — this is a destructive-action gate, not optional

## Keep migration + seed folders in sync — mandatory after ANY schema change
Whenever `schema.prisma` is modified for a table:
1. Generate the migration file for that table (per rule above)
2. Update/create that table's seed file to match new/changed columns
3. Update `translations.seed.ts` if any new label/enum/status was added
4. Report explicitly: "Migration: [file]. Seed updated: [file]. Translations: [yes/no + why]"
Never leave migration and seed folders out of sync — a schema change without a corresponding seed update is treated as an incomplete task.

## Before writing any seed code
1. Run: `search_graph "seed" <entity name>`
2. If existing seed file found → edit that file only
3. If not found → create ONE file: `prisma/seed/<entity>.seed.ts`, then register it in `index.ts`
4. Confirm `translations.seed.ts` was touched if entity has labels/enums — if not applicable, state explicitly "no translations needed because X"
