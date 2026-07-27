---
trigger: always_on
---

# Package Hygiene & Dependency Maintenance Rule

## Before installing ANY new package (in addition to package-first.md)

### Qualification checklist — a package must pass ALL of these
1. **Actively maintained** — a commit/release within the last 6 months (check npm
   page "Last publish" or GitHub commits)
2. **No known critical/high vulnerabilities** — check `npm audit` after install,
   and check the package's GitHub Security tab / Snyk advisory before installing
3. **Stable release** — prefer packages at v1.0.0+ with semver discipline; avoid
   0.x packages for core/critical paths (auth, payments, DB) unless there's no
   mature alternative — flag the risk explicitly if using one
4. **TypeScript support** — native types or a well-maintained @types package;
   avoid `any`-typed dependencies in a strict TS codebase
5. **License compatible** — MIT/Apache-2.0/BSD preferred; flag GPL/AGPL or
   unclear licenses before installing (enterprise/commercial use implications)
6. **Reasonable size/dependency footprint** — check bundle impact
   (bundlephobia.com or similar) for anything touching the client bundle;
   avoid a heavy package for a trivial need
7. **No duplicate functionality** — confirm via package-first.md check that
   nothing already installed solves this

### Before installing, report explicitly
"Package: [name]. Version: [x.x.x]. Last published: [date]. Weekly downloads:
[approx]. License: [type]. Vulnerabilities: [none/list]. Reason chosen over
alternatives: [why]."

## Version pinning & update policy
- Use exact or caret ranges per existing project convention — check package.json's
  current style (`^1.2.3` vs pinned `1.2.3`) and match it, don't mix styles
- Lockfile (package-lock.json) MUST be committed and never manually edited —
  only updated via `npm install`/`npm update`
- NEVER run a blanket `npm update` or bump major versions across the whole
  project without explicit user approval — major version bumps can introduce
  breaking changes into a production enterprise app

## Periodic maintenance check (run when asked, or proactively flag if stale)

  npm outdated # see what's behind
  npm audit # security vulnerabilities
  npm audit fix # safe, non-breaking fixes only — never --force without approval


Report format:
| Package | Current | Latest | Type (patch/minor/major) | Vulnerability? | Recommendation |

- Patch/minor updates with no breaking changes → safe to batch-update, do so
  after confirming with user
- Major version updates → handle ONE AT A TIME, in a separate task, read the
  package's migration guide/changelog first, run the full test suite after
- Never silently upgrade a package as a side effect of an unrelated task —
  dependency updates are their own explicit task

## Enterprise-fit specific checks (Next.js + Prisma + Postgres stack)
- Next.js ecosystem packages: prefer packages explicitly supporting App Router
  and the current Next.js major version in use — check compatibility notes
- Server-only packages (DB clients, file system, crypto) must never be
  importable into a Client Component — verify with `"use client"` boundary checks
- Avoid packages that patch global prototypes or inject side effects at import
  time — unpredictable in SSR/edge environments
- For anything touching auth/crypto/payments: prefer packages with a security
  audit history or backing from a known organization over a solo-maintainer
  package with low download counts

## Forbidden
- Never install a package with known unpatched critical vulnerabilities, even
  temporarily "to test something"
- Never install a package that hasn't been updated in 2+ years for a new feature
  — check for a maintained alternative first
- Never silently downgrade a package to fix an error without explaining why and
  confirming with the user
- Never remove `package-lock.json` or regenerate it from scratch to "fix" an issue
  without understanding the root cause first

## Report requirement
After any package install/update/removal, explicitly confirm:
"Added/Updated/Removed: [package@version]. Reason: [why]. Audit status: [clean/
flagged issues]. Breaking changes reviewed: [yes/no/n-a]."
