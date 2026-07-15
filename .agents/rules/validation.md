# Validation Rule — Server + Client, One Source of Truth

## Global validation config (mandatory)
- ALL validation schemas live in ONE place: src/core/validation/schemas/<entity>.schema.ts
- Built with zod — this is the single source of truth for a field's rules
- Client (react-hook-form) and server (API route/UseCase) BOTH import the SAME schema
  — never redefine rules separately on each side

## Enforcement
- Server: every API route/UseCase input MUST run schema.parse() before processing — no exceptions
- Client: every form MUST use zodResolver(schema) from the same schema file
- If a new field/entity needs validation: add it to schemas/, then import on both sides —
  never hardcode inline validation (no manual if-checks replacing zod)
