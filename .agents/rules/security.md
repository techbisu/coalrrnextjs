# Security Rules

- Validate ALL inputs with zod (see validation.md) before reaching a UseCase — server AND client
- Never bypass existing auth middleware — reuse it, never re-implement auth logic
- No secrets in client components/bundles — server-only env vars stay server-only
- Rate-limit new mutation endpoints (reuse existing limiter, don't build a new one)
- Never log/print .env contents or credentials
- Sanitize any user input rendered back in UI (XSS)
- Use parameterized queries only (Prisma handles this by default — never string-concat SQL)
- Audit-log sensitive mutations (create/update/delete on protected entities) using the
  existing audit logging service
