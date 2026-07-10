# COALRR DB Alignment — Implementation Plan

## Decisions locked in
- **IDs → bigint** (matches `disputedb`)
- **Audit fields → TIMESTAMP** with names `entry_ts`, `updt_ts`, `del_ts`, `entry_by`, `updt_by` (diverges from disputedb's epoch-bigint; import script converts epoch→timestamp)
- **Scope → all 21 master tables + 3 missing auth tables + add 5 common fields to every existing model**
- **Seed data → import from `disputedb`**

The 5 common fields applied to **every** table except pure M2M pivots (`role_has_permissions`, `model_has_roles`, `model_has_permissions`):
```prisma
entryTs  DateTime? @default(now()) @map("entry_ts")
updtTs   DateTime? @updatedAt      @map("updt_ts")
delTs    DateTime?                 @map("del_ts")     // NULL=active; soft-delete marker
entryBy  String?                   @map("entry_by")
updtBy   String?                   @map("updt_by")
```

---

## Phase 1 — Schema rewrite (`prisma/schema.prisma`)

### 1a. Global ID migration (every model)
- Change every `id String @id @default(cuid())` → `id BigInt @id @default(autoincrement())`
- Every FK field `xxxId String` → `xxxId BigInt` (e.g. `projectId String` → `projectId BigInt`)
- UUID-defaulted models (`CaptchaChallenge`, `CaptchaAuditLog`) → also `BigInt @default(autoincrement())`
- Singleton (`CaptchaConfig id @default("global")`) → keep as String key (not an entity ID)

### 1b. Add 5 common audit fields to ALL ~45 existing models
Add the block above to: `User`, `AuthSession`, `MstProject`, `MstMouza`, `MstPlot`, `LandSchedule`, `LandScheduleItem`, `FormIClaim`, `CompensationPayroll(+Line)`, `PafCensusRecord`, `RnrAssetPayroll(+Line)`, `FormDLedgerEntry`, `NomineePool(+Contribution)`, `EmploymentApplication`, `WorkflowReviewTask`, `Document`, `DocTemplate/Instance/Version/DynamicAnswer/WorkflowStep/Signature/AuditLog`, `DownloadLog`, `Grievance`, `CaptchaChallenge/Config/AuditLog`, `Language`, `TranslationModule/Key/Value/History`, `AuditLog/Change/Session/Security/Download`, `FileRecord/Version/Attachment`, `EventRegistry`, `NotificationTemplate/Rule/Log/Preference`, `SignedUrlLog`, `Role`, `Permission`.
- Drop redundant `createdAt`/`updatedAt` where they duplicate `entry_ts`/`updt_ts` (keep `@updatedAt` semantic on `updt_ts`).
- Replace `@default(now())` patterns with `entry_ts @default(now())`.

### 1c. Create 21 master models (new)
Geography chain (FK-linked):
`StateMaster`, `DistrictMaster`, `BlockMaster`, `PsMaster`, `MouzaMaster`, `VillMaster`

Domain:
`AreaMaster`, `MineMaster`, `LandtypeMaster`, `LandclassMaster`, `CastMaster`, `OwnerTypeMaster`, `PossrTypeMaster`, `AcquMode` (replaces hardcoded TS enum), `StatusMaster`, `PresentLandUse`

Files/checklist/nav:
`FileCategoryMaster`, `FileType`, `Module`, `PageList`, `ChkMasterNew`

Each with bigint PK matching disputedb's PK name (`state_lgd`, `district_lgd`, `acq_mode_id`, `area_cd`, `mine_cd`, etc.) and the 5 common fields.

### 1d. Create 3 missing auth models
- `PasswordReset` (email, token, created_at, expiry_time)
- `OtpVerify` (id, mobile_no, email_id, otp, otp_type, is_verified, entry_ts, updt_ts, expiry_time) — closes the security gap where any 6-digit OTP logs citizens in (`src/app/api/auth/login/route.ts`)
- `PswdHist` (user_id FK, old_password, entry_ts, …) — enables password-history policy

---

## Phase 2 — Migrations
- `prisma migrate dev --name align_disputedb_schema` — generates the SQL migration from the rewritten schema.
- Add `@@map("table_name")` to all models so physical table names match disputedb conventions (snake_case) where useful for the import.

---

## Phase 3 — Code blast-radius fixes (biggest part)

### 3a. Domain ID value objects
- `src/domain/entities/project/ProjectId.ts`: `extends ValueObject<string>` → `bigint`; replace `generateCuid()` with `BigInt` handling; `tryCreate` parses `BigInt(value)`.
- `src/domain/entities/proposal/ProposalId.ts`: same.
- `AcquisitionMode.ts`: replace hardcoded enum with a lookup against the new `AcquMode` table (or keep enum as a cache seeded from DB).

### 3b. API route handlers (23 files with `[id]`/`[itemId]`/`[recordId]`)
Convert param parsing from `string` to `bigint`:
```ts
// before
const { id } = await params  // string
// after
const id = BigInt((await params).id)
```
Files: `src/app/api/authorization/**/[id]/**`, `claims/[id]`, `employment/[id]`, `nominee-pools/[id]`, `paf/[id]`, `payrolls/[id]/lines/[lineId]`, `projects/[id](/lock)`, `rnr-payrolls/[id]/lines/[lineId]`, `schedules/[id]/(items/[itemId]|checklist|verify)`, `workflow/[recordType]/[recordId]`, `files/[fileId]/download`.

### 3c. Remaining ~30 API routes
Audit each for `.id` creation/comparison and any `where: { id: <string> }` → ensure bigint.

### 3d. Repositories
- `PrismaProjectRepository.ts`, `PrismaProposalRepository.ts`: change `findById(id: string)` → `bigint`; `where: { id }` already works if param is bigint.

### 3e. Prisma audit extension
- `src/core/audit/extensions/PrismaAuditExtension.ts`: `(result as any).id` now bigint — coerce to `String(...)` for `AuditLog.entityId` OR change `entityId` to `BigInt?`. Recommend `BigInt?`.
- Extend the extension to auto-populate `entry_by`/`updt_by` from `getCurrentUser().id` and set `entry_ts`/`updt_ts` on create, `updt_ts`/`updt_by` on update, and intercept deletes to set `del_ts` (soft delete) instead of hard delete.

### 3f. Client/dashboard (15 files)
- Convert any `id: string` props and URL-building to handle bigint (serialize as string in JSON responses, parse on send). TypeScript will flag these.

### 3g. Auth flow
- `src/app/api/auth/login/route.ts`: public-portal OTP branch → validate against new `OtpVerify` table (check `otp`, `is_verified`, `expiry_time`) instead of regex-only. This fixes the security hole.
- `src/lib/auth.ts`: `AuthUser.id` → bigint.

### 3h. Seed files
- `prisma/seed.ts`: remove reliance on returned string IDs; `connect:` works with bigint. Replace any `cuid()`/prefix generation.
- `src/core/authorization/seed/seedRolesAndPermissions.ts`: ensure role/permission IDs are bigint-safe.

---

## Phase 4 — Data import from `disputedb`
Create `prisma/import-from-disputedb.ts` (or a SQL script) that connects to `disputedb` (add `DISPUTEDB_URL` to `.env`) and copies into `coalrrnextjs`:
1. **Geography**: `state_master` → `district_master` → `block_master` → `ps_master` → `mouza_master` → `vill_master` (order matters, FK chain).
2. **Domain**: `area_master`, `mine_master`, `acqu_mode`, `status`, `cast_master`, `owner_type_master`, `possr_type_master`, `landtype_master`, `landclass_master`, `present_land_use`.
3. **Files/nav**: `module`, `page_list`, `file_category_master`, `file_type`, `chk_master_new`.
4. Convert each source row's `entry_ts/updt_ts/del_ts` (epoch bigint ms) → JS Date for the new TIMESTAMP columns.
5. Keep `disputedb` bigint PKs intact so cross-references stay valid.

---

## Phase 5 — Verification
- `npx prisma validate` + `npx prisma generate`
- `npx tsc --noEmit` to catch all the `string`/`bigint` type errors the migration creates (this is the safety net — TS will refuse to compile until every ID site is fixed).
- `npx prisma migrate dev` succeeds.
- Run import script on a test copy of `disputedb`.
- Manual smoke: login (ECL + public OTP), create project, create proposal with acquisition mode from new table.

---

## Risk / order-of-operations notes
- **TypeScript is the safety net.** After Phase 1+2, `tsc --noEmit` will produce dozens of `string`↔`bigint` errors — each is a precise work item for Phase 3. This is expected, not a regression.
- The audit-extension soft-delete change (Phase 3e) is behavior-changing: all `db.xxx.delete()` become soft-deletes. Verify no code relies on hard delete (e.g. seed wipe). Seed uses `deleteMany()` which would need `where: { delTs: ... }` awareness or a dedicated hard-reset.
- `CaptchaConfig` singleton keeps its string key — flagged as the one exception to bigint.
- Importing preserves disputedb PKs, so existing data relationships survive; only the *current app's* existing cuid data is orphaned (acceptable — it's demo/seed data).

## Files touched (summary counts)
- `prisma/schema.prisma` — full rewrite (1 file)
- ~53 API route files (23 need param changes, rest audited)
- ~15 client/dashboard files
- 2 repositories + 2 domain ID VOs + AcquisitionMode VO
- 1 Prisma extension + AuditService
- `src/lib/auth.ts`, `src/app/api/auth/login/route.ts`
- `prisma/seed.ts` + authorization seed
- New: `prisma/import-from-disputedb.ts`