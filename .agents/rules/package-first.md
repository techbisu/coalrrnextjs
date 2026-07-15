# Package-First Rule

Before writing ANY custom implementation (auth, validation, forms, tables, charts,
file upload, PDF, email, payments, rate-limiting, caching, date handling, etc.):

## Mandatory check sequence
1. Search npm/existing package.json for a maintained package that solves this
2. Preference order: already-installed package > well-known Next.js-ecosystem package > custom code
3. A package qualifies as "good" only if: actively maintained (commit in last 6mo),
   widely used/recommended in the Next.js ecosystem, TypeScript support
4. State explicitly before coding: "Using [package] because [reason]"
   OR "No suitable package found for [X], building custom service because [reason]"

## Never do this
- Never hand-roll what a package already solves well (e.g. don't write custom date
  parsing when date-fns/dayjs exists, don't write custom form validation when
  zod+react-hook-form exists)
- Never install a second package that duplicates an already-installed one

## Reference table (extend as needed)
| Need | Use |
|---|---|
| Validation | zod (already in stack) |
| Forms | react-hook-form + zod |
| Tables/data grid | @tanstack/react-table |
| Dates | date-fns |
| PDF | @react-pdf/renderer or pdf-lib |
| File upload | uploadthing or existing infra |
| Auth | existing auth (already implemented — never replace) |
