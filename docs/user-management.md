# User Management, RBAC & Organizational Scope Module

Manages user identity, authentication, session tokens, multi-tenant organization isolation, Enterprise RBAC permissions, and dynamic organizational scope filtering (`user_org_scope`).

---

## Architecture

- **Authorization Service:** `AuthorizationService` (`src/core/authorization/services/AuthorizationService.ts`) — single source of truth for permission checks.
- **User Scope Service:** `UserScopeService` (`src/core/authorization/services/UserScopeService.ts`) — resolves organizational scope (`HQ`, `AREA`, `UNIT`) and generates Prisma `where` filtering criteria.
- **Repository:** `PrismaUserRepository` (`src/infrastructure/persistence/repositories/PrismaUserRepository.ts`) — handles persistence for `user` and `user_org_scope`.
- **DI Container Wiring:** Registered via `Container.authorizationService`, `Container.userScopeService`, and `Container.userRepository`.
- **API Endpoints:** `src/app/api/users/`, `src/app/api/auth/`

---

## Database Schema & Models

| Model | Schema | Primary Key | Purpose |
| :--- | :--- | :--- | :--- |
| **`public.user`** | `public` | `id` (Autoincrement) | Central user identity (email, mobile, name, designation, password hash, tenant ID, active status). |
| **`user_org_scope`** | `public` | `id` (CUID) | Organizational scope mapping (`scope_level`: `HQ`/`AREA`/`UNIT`, `area_cd`, `mine_cd`, `effective_from`, `effective_to`). |
| **`master.Tenant`** | `master` | `tenant_id` | Corporate multi-tenant master entity (e.g., ECL, CIL). |
| **`public.auth_session`**| `public` | `id` | Active user session token storage with expiration. |
| **`public.otp_session`** | `public` | `id` | Two-factor authentication & OTP verification sessions. |

---

## Organizational Scope Enforcement (`user_org_scope`)

User visibility and operational permissions are dynamically scoped via `UserScopeService.scopeToWhere(scope, 'area_cd', 'mine_cd')`:

```
   ┌─────────────────────────────────────────────────────────────┐
   │                         user_org_scope                      │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
   Scope Level: HQ        Scope Level: AREA        Scope Level: UNIT
   ──────────────────     ───────────────────      ──────────────────
   Company-Wide           Area-Wide                Mine-Specific
   All Areas & Mines      Filtered by area_cd      Filtered by mine_cd
```

1. **`HQ` Level**: Users (e.g. GM LRE, GM Planning) have full company-wide visibility across all areas and mine units.
2. **`AREA` Level**: Users (e.g. Area General Manager, Area Land Officer) can view and act on proposals across all colliery units under their assigned `area_cd`.
3. **`UNIT` Level**: Users (e.g. Unit Surveyor, Colliery Manager) are restricted to proposals belonging to their assigned `mine_cd` or proposals specifically forwarded to their mine as a target recipient (`pr_scheme_ref_no` / `adjacent_mine_ids`).

---

## API Endpoints

| Method | Route | Permission | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/users` | `user.view` | List users under active scope |
| POST | `/api/users` | `user.create` | Create new user account & scope |
| GET | `/api/users/[id]` | `user.view` | Get user details and scope breakdown |
| PATCH | `/api/users/[id]` | `user.edit` | Update user profile & designation |
| POST | `/api/users/[id]/scope` | `user.scope_edit` | Assign or update `user_org_scope` |
| POST | `/api/auth/login` | Public | Authenticate user & issue session token |
| POST | `/api/auth/logout` | Authenticated | Revoke session token |

---

## Security & Audit Logging

- **Server-Side Authorization**: Every API route and Server Action enforces authorization via `authorizeApi(permissionKey)`. Client-side UI checks are strictly UX indicators.
- **Session Tokens**: Stored exclusively in `httpOnly + secure + sameSite` cookies.
- **Audit Logging**: User scope assignments, role updates, authentication events, and sensitive data access write structured entries to `public.audit_log` with actor `user_id`, timestamps, and before/after values.
