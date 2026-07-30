---
trigger: always_on
---

# Validation Rule — Server + Client, One Source of Truth

## Global validation config (mandatory)
- ALL validation schemas live in ONE place: `src/shared/schemas/<entity>.schema.ts`
- `src/core/` is reserved for cross-cutting framework code (Audit, Auth, EventBus, Result) —
  never place schemas there
- Built with zod — this is the single source of truth for a field's rules
- Client (react-hook-form) and server (API route/UseCase) BOTH import the SAME schema
  — never redefine rules separately on each side

## Enforcement
- Server: every API route/UseCase input MUST run `schema.safeParse()` before processing —
  `schema.parse()` is banned (it throws `ZodError` and breaks the `Result<T,E>` pattern)
- Client: every form MUST use `zodResolver(schema)` from the same schema file
- If a new field/entity needs validation: add it to `src/shared/schemas/`, then import on
  both sides — never hardcode inline validation (no manual if-checks replacing zod)

## Realtime Client Validation (mandatory)
- EVERY form MUST be configured with:
  ```
  mode: 'onTouched'           // first error shows only after the user leaves the field
  reValidateMode: 'onChange'  // after that, re-validates on every keystroke
  ```
- NEVER use `mode: 'onSubmit'` (default) — errors must never wait until submit to appear
- NEVER set `mode: 'onChange'` alone — it fires errors before the user finishes typing
  the first pass and feels punishing; `onTouched` + `onChange` is the only approved combo

## Error Display (mandatory)
- Errors render BELOW the field, never as toast/alert-only, using the shared `<FormField>`
  + `<FormMessage>` wrapper (`src/shared/components/ui/form.tsx`) — never a custom per-field
  error implementation
- Every input MUST set `aria-invalid={!!errors[field]}`, `aria-describedby` linking to the
  error message `id`, and errors MUST render with `role="alert"`
- Reserve fixed vertical space for the error line (`min-h-[1.25rem]`) so field errors
  never cause layout shift/reflow

## Dynamic Forms (Document Engine fields)
- Fields rendered from `document_template_field` MUST resolve their zod shape from
  `src/shared/schemas/dynamic-form.schema.ts`, built at runtime from `field_type` +
  `is_required` + `show_if` — NOT hardcoded per template
- The server rebuilds this schema from the DB template on every request — never accept a
  schema definition from the client
- The same runtime-built schema MUST be sent to the server for revalidation on generate

## Internationalization (mandatory)
- Zod error messages are translation keys, not raw English sentences —
  e.g. `'validation.required'`, `'validation.positive_number'`, `'validation.invalid_email'`
- Never hardcode an English string as a Zod error message
- Client resolves the key via `t(error.message)` at render time (inside `<FormMessage>`) —
  the schema never contains display text
- If a key is missing from the locale file, fall back to English — never render the raw key

## Enforcement Checklist (for code review / AI agent self-check)
- [ ] Form uses `useForm({ resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange', defaultValues: {...} })`
- [ ] Schema imported from `src/shared/schemas/`, not redefined inline
- [ ] Every field wrapped in `<FormField>`/`<FormMessage>`, no manual error `<p>` tags
- [ ] Server route/UseCase calls the SAME `schema.safeParse()` before touching business logic — `parse()` banned
- [ ] No raw `<input>` without react-hook-form `register`/`Controller` binding
- [ ] All Zod error messages are translation keys (`validation.*`), not raw English strings