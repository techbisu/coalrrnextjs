# coalrrnextjs — Agent Rules

Stack: Next.js + Prisma + Postgres. Architecture: Clean Architecture/DDD in src/.

## MANDATORY before any code change
1. Run reuse-check skill — never create new code without checking existing first
2. Run impact-check skill on any file with dependents
3. Follow .agents/rules/architecture.md exactly

## Codebase Memory (codebase-memory-mcp)
ALWAYS use search_graph / trace_path / get_architecture instead of grep/glob for code discovery.
If codebase-memory-mcp is unavailable, state explicitly: "codebase-memory-mcp unavailable, falling back to grep — confirm before proceeding." Never fall back silently.

## Hard Rules (full detail in .agents/rules/)
- Architecture: SOLID + Clean Architecture layering — architecture.md
- Database: seeding checklist, no raw SQL outside repositories — database.md
- Security: input validation, auth, secrets — security.md
- Package-first: use a maintained package before building custom — package-first.md
- UI consistency: reuse components, enterprise standards, no forced custom UI — ui-consistency.md
- Structure: no arbitrary folders/files, temp files must be deleted — structure.md
- Documentation: update docs/<module>.md after every feature — documentation.md
- Service layer: no direct Prisma calls outside repositories — service-layer.md
- Validation: one zod schema per entity, shared client+server — validation.md
- Optimization: think structure/perf before coding — optimization.md
- Translations: every page/module must use i18n, seeded module-wise — translations.md

## Do not touch
- old_schema.prisma (deprecated)
- .env (never read/write/print contents)

## After ANY DB/seed change
Explicitly list: files touched, and whether translations were updated. If skipped, state why.

## Tool Usage Transparency
At the start of any code discovery or pre-edit step, state which tool you used 
(search_graph/trace_path) or flag if falling back to grep.
