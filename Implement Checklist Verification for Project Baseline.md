# Implement Checklist Verification for Project Baseline

This plan addresses the new requirements to integrate the project module with the checklist system.

## User Review Required

> [!IMPORTANT]
> **Checklist Rule IDs**: The checklist system uses specific `requirementId` strings (e.g., from `chk_master_new`). I need to know the exact `requirementId` or `rule_id` for:
> 1. The **PROJECT_REPORT** (PR doc) requirement.
> 2. The **Baseline Lock Approval Document** requirement.
> I will use placeholder constants for now, but these need to match your database seeds.

## Open Questions
- What is the `requirementId` for the PR Document in the `PROJECT_MASTER` checklist?
- What is the `requirementId` for the Baseline Lock approval document?
- The `CreateProjectUseCase` is currently synchronous and doesn't use the `UpdateChecklistSubmissionUseCase`. Should I inject `updateChecklistSubmissionUseCase` into it, or publish an event that a handler listens to?

## Proposed Changes

### `src/application/validators/schemas.ts`
- **[MODIFY]**: Update `CreateProjectSchema` to make `pr_doc_id` a required string instead of optional.

---

### `src/application/use-cases/project/CreateProjectUseCase.ts`
- **[MODIFY]**: Inject `UpdateChecklistSubmissionUseCase` (or use Container).
- **[MODIFY]**: Enforce `pr_doc_id` presence. 
- **[MODIFY]**: After saving the project, call `updateChecklistSubmissionUseCase.execute()` with the `PROJECT_REPORT` requirement ID to automatically mark it as submitted in the checklist module.

---

### `src/application/use-cases/project/BaselineLockUseCase.ts`
- **[MODIFY]**: Inject `GetChecklistStatusUseCase` and `UpdateChecklistSubmissionUseCase`.
- **[MODIFY]**: Before locking, call `getChecklistStatusUseCase.execute({ moduleCode: 'PROJECT_MASTER', checkableType: 'mst_project', checkableId: projectId })`.
- **[MODIFY]**: If `checklistStatus.value.isComplete` is false, return `Fail('Cannot lock baseline: Project checklist is not complete.')`.
- **[MODIFY]**: If `request.docId` is provided, call `updateChecklistSubmissionUseCase.execute()` to auto-sync the uploaded baseline lock document to the checklist.

---

### `src/infrastructure/di/modules/project.di.ts`
- **[MODIFY]**: Update the DI configuration to pass the checklist use cases (`getChecklistStatusUseCase` and `updateChecklistSubmissionUseCase`) from the core DI module into the constructors of `CreateProjectUseCase` and `BaselineLockUseCase`.

## Verification Plan

### Automated Tests
- No new automated tests are specified, but I will ensure TypeScript compilation passes.

### Manual Verification
- Attempt to lock a project baseline without completing the checklist; verify it fails.
- Create a project with a PR doc and verify the PR doc checklist item is auto-satisfied.
- Lock a baseline with an approval document and verify the checklist updates.
