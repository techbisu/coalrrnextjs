---
trigger: always_on
---

# Security Rules

## Input Validation
- Validate ALL inputs with zod (see validation.md) before reaching a UseCase — server AND client
- Validate on the SERVER even if client already validated — client-side validation is
  UX only, never a security boundary
- Validate query params, route params, headers, and file uploads — not just request body
- Reject unknown/extra fields in payloads (zod `.strict()`) — don't silently accept
  and ignore unexpected fields

## Authentication & Session
- Never bypass existing auth middleware — reuse it, never re-implement auth logic
- Every API route/Server Action MUST have an explicit auth check — no route is
  "public by default"; if a route is intentionally public, state that explicitly
  in a comment and confirm with the user
- Session tokens: httpOnly + secure + sameSite cookies only — never store session
  tokens in localStorage/sessionStorage
- Enforce session expiry/refresh via the existing auth service — don't extend
  sessions indefinitely

## Authorization (RBAC)
- Every permission/role check goes through AuthorizationService via Container —
  never a hardcoded `if (user.role === 'admin')` check inline
- Enforce authorization on BOTH client (hide UI) AND server (reject request) —
  a client-only permission check is not a security control
- Check authorization on the SPECIFIC resource being accessed, not just the action
  type (e.g. confirm user has access to THIS project, not just "can view projects")
- Never trust a role/permission claim passed from the client — always re-derive
  from the authenticated session server-side

## Secrets & Env Vars
- No secrets in client components/bundles — server-only env vars stay server-only
  (never prefixed `NEXT_PUBLIC_` unless genuinely safe to expose)
- Never log/print .env contents or credentials — including in error messages,
  stack traces sent to client, or debug output
- All env access through the validated env.ts layer (per config-management.md) —
  never scattered raw `process.env.X` reads
- Never commit `.env`, API keys, private keys, or connection strings — confirm
  `.gitignore` covers these before any commit

## Injection Prevention
- Use parameterized queries only (Prisma handles this by default — never
  string-concat SQL, even for "just this one report query")
- Sanitize any user input rendered back in UI (XSS) — rely on React's default
  escaping, never use `dangerouslySetInnerHTML` with unsanitized user input
- Validate/sanitize file names before storage (path traversal prevention) —
  never use a raw user-supplied filename as a storage path
- Validate file content type server-side (magic-byte check), not just the
  client-reported MIME type, for any upload (per DocumentUploader flow)

## Rate Limiting & Abuse Prevention
- Rate-limit new mutation endpoints (reuse existing limiter, don't build a new one)
- Rate-limit auth endpoints (login, password reset, OTP) more strictly than
  general mutations — brute-force protection
- Rate-limit expensive read endpoints too if they touch heavy queries/reports,
  not just mutations

## Data Protection
- Never return more data than the UI needs from an API route (avoid over-fetching
  sensitive fields like password hashes, internal IDs meant to stay internal)
- PII/sensitive fields (Aadhaar, bank details, salary data) must be access-logged
  when read, not just when written
- Mask/redact sensitive fields in logs, error reports, and non-authorized UI views

## Audit Logging
- Audit-log sensitive mutations (create/update/delete on protected entities) using
  the existing audit logging service (Container.auditService)
- Audit-log sensitive READS too for high-value data (e.g. viewing salary/payroll
  records, approving Form-XXII deviations) — not just writes
- Audit entries must capture: who, what, when, and before/after values for updates

## Dependency & Supply Chain
- Before adding any new package (per package-first.md), also check it doesn't
  introduce known vulnerabilities — prefer packages with recent maintenance activity
- Run `npm audit` periodically; flag high/critical vulnerabilities to the user
  rather than silently ignoring them

## Error Handling
- Never expose internal error details, stack traces, or DB error messages to the
  client — return generic error messages, log full details server-side only
- Use the Result<T,E> pattern (architecture.md) to avoid leaking exceptions up
  through layers

## Before completing any task touching auth/permissions/sensitive data
State explicitly: "Auth check: [where/how]. Permission check: [which permission,
enforced client+server]. Audit logged: [yes/no + why]."