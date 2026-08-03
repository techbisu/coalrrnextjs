# COALRR Project and Proposal Module Development Plan

## Scope Correction

The project and proposal modules should serve ECL Land Department users and citizen-facing claim/employment flows. Other approvals and departmental work should remain manual, using COALRR-generated forms, reports, notes, registers, and document packages.

In software terms:

- Project module = approved baseline and limit control.
- Proposal module = ECL Land Department proposal preparation, plot schedule, checklist compliance, generated document package, and manual milestone tracking.
- Citizen modules = claim and employment application intake connected to project/proposal records.

## Current Database Anchors

The current database already supports the core direction.

### Project Baseline

Use these as the source of truth:

- `master.project`
  - project code, ECL project code, name, description
  - approved/acquired area
  - sanctioned/completed employment
  - land and R&R budget
  - status, boundary, statutory clearances, locked date

- `master.proj_aprv`
  - approval references
  - approved area
  - employment sanctioned
  - land/R&R cap
  - approval type, level, document reference

- `master.proj_aprv_location`
  - area, mine, mouza-level approved area
  - land class breakup

### Proposal and Plot Schedule

Use these as the acquisition/proposal core:

- `acquisition.acq_proposal`
  - proposal number/date
  - area, mine, project
  - acquisition mode
  - purpose/justification
  - PR/scheme reference
  - within-limit flag
  - CMD/Board requirement
  - estimated land, rehab, employment costs
  - current stage and overall status
  - total acquisition/approved area

- `acquisition.plot_schedule`
  - proposal-linked plot schedule
  - plot number, mouza, JL, land areas
  - plot type and optional plot fields
  - possession proposal/status fields

- `acquisition.plot_schedule_land_type`
  - land type breakup per plot
  - area, area to acquire, acquired area, remaining area

### Global Services Already Present

Build on these instead of replacing them:

- `master.checklist_requirement_rule`
- `public.checklist_submission`
- `public.workflow_transitions`
- `public.workflow_review_task`
- `public.document_template`
- `public.document_instance`
- `public.outbox_events`
- `audit.activity_log`
- `audit.application_log`
- `public.user_org_scope`
- file/document management tables already present in the app

## Recommended Module Boundary

### Project Module Responsibilities

The project module should only manage approved project baseline:

- create/edit project draft
- attach PR/Scheme/Conceptual Report references
- define approved area, budget, employment quota, and R&R limits
- define approval locations by mouza/area/mine
- attach statutory clearances and boundary data
- lock project baseline
- generate project-level Form-XXII or approval note where required
- show consumed vs available limits

After lock, the project baseline should be mostly read-only. Changes should be new approval records, not edits to historical approvals.

### Proposal Module Responsibilities

The proposal module should handle ECL Land Department preparation work:

- create proposal under a locked project
- select acquisition mode
- prepare plot schedule
- calculate land type and mouza-wise abstracts
- check proposal area against project/location approval limits
- complete SOP checklist requirements
- generate proposal documents
- record manual approval milestones
- move proposal status forward only when checklist, documents, and milestones are complete

It should not attempt to digitize every external authority’s actual approval workflow.

## Global Service Layer Design

Create or standardize these shared services under `src/core` or `src/application/services`.

### 1. ProjectLimitService

Purpose: one service for all approved-limit checks.

Inputs:

- project code
- proposal ID
- area/mine/mouza
- acquisition mode
- proposed plot schedule totals
- estimated cost and employment count

Outputs:

- within approved area: yes/no
- within location area: yes/no
- within land budget: yes/no
- within R&R budget: yes/no
- within employment quota: yes/no
- requires CMD approval
- requires Board approval
- reason list

Used by:

- create proposal
- add/update/delete plot
- submit proposal
- Form-XXII generation
- dashboard

### 2. WorkflowService

Purpose: enforce allowed internal transitions.

Use `public.workflow_transitions` for configured transitions.

Recommended proposal states:

- `DRAFT`
- `PLOT_SCHEDULE_PREP`
- `CHECKLIST_PENDING`
- `DOCUMENT_PACKAGE_READY`
- `SENT_FOR_MANUAL_APPROVAL`
- `RETURNED_FOR_CORRECTION`
- `MANUAL_APPROVED`
- `MANUAL_REJECTED`
- `CLOSED`

For project:

- `DRAFT`
- `BASELINE_READY`
- `LOCKED`
- `REVISED_BY_APPROVAL`
- `ARCHIVED`

### 3. ChecklistService

Purpose: one engine for CL-1 to CL-6 and future SOP checks.

Use:

- `master.checklist_requirement_rule` as checklist definition
- `public.checklist_submission` as case response

Rules:

- checklist items are linked to `checkable_type` and `checkable_id`
- project checklists use project code
- proposal checklists use proposal ID
- citizen claim/employment checklists use application ID
- mandatory items must be complete before submission
- each response can store document evidence and page number in `user_input`

### 4. DocumentPackageService

Purpose: generate SOP document packages.

Use:

- `public.document_template`
- `public.document_instance`

For proposal:

- proposal note
- plot schedule
- mouza-wise abstract
- land type abstract
- checklist PDF
- Form-VII
- Form-XXII
- approval covering letter

For citizen claim:

- acknowledgement
- Form-I
- deficiency notice

For employment:

- Form-A
- Form-V
- Form-XI
- Form-XII
- Form-XIII
- Form-XIV
- Form-XXI
- Form-XXIII where needed

### 5. ManualMilestoneService

Purpose: record outside/manual steps without giving external users app access.

The current DB does not show a dedicated `manual_milestone` table. Add one.

Suggested table:

- `id`
- `entity_type`
- `entity_id`
- `milestone_type`
- `authority_name`
- `reference_no`
- `sent_at`
- `received_at`
- `outcome`
- `remarks`
- `document_id`
- `entry_by`
- `entry_ts`

Used for:

- CMD approval
- Board approval
- District Authority action
- Gazette publication
- Personnel handoff
- Finance/payment confirmation
- Legal opinion reference

### 6. AuditService

Continue using the existing audit layer.

Every important action should write audit:

- project lock
- approval revision
- proposal create/update
- plot add/update/delete
- checklist completion
- document generation
- manual milestone recording
- proposal submit/return/close

### 7. OutboxEventService

Use `public.outbox_events` for async side effects:

- notification to ECL officers
- notification to citizen
- document generation job
- dashboard aggregate update
- deadline reminders

Events should be emitted inside the same transaction as the business change.

### 8. OrgScopeAuthorizationService

Use `public.user_org_scope`.

Rules:

- HQ users can see all projects/proposals.
- Area users see only their assigned areas.
- Unit/mine users see only assigned mine scope.
- Citizens see only their own applications.

## Recommended Development Flow

### Project Creation Flow

1. ECL officer creates project draft.
2. Officer adds approved PR/Scheme reference, budget, land limit, employment quota.
3. Officer adds approval records in `proj_aprv`.
4. Officer adds location-level approvals in `proj_aprv_location`.
5. System validates totals.
6. Officer uploads supporting documents.
7. Checklist service confirms required baseline checklist.
8. Project is locked.
9. Proposals can now be created under the project.

### Proposal Creation Flow

1. ECL officer selects locked project.
2. System loads remaining project limits.
3. Officer selects acquisition mode.
4. System creates `acq_proposal`.
5. Checklist service creates/loads applicable CL-1 requirements.
6. Officer adds plot schedule.
7. ProjectLimitService recalculates area/budget/employment impact.
8. If limits are exceeded, system marks Board/CMD requirement.
9. Officer completes checklist and uploads evidence.
10. DocumentPackageService generates proposal package.
11. Officer records manual submission milestone.
12. Officer records manual approval/return/rejection milestone.
13. Proposal state updates accordingly.

### Plot Schedule Flow

1. Add plot with mouza, plot type, plot number, bata, ROR area, proposed area.
2. Add land-type rows.
3. Validate:
   - no duplicate plot in same proposal
   - land-type area sums match plot area
   - proposed area does not exceed ROR area
   - proposed area does not exceed remaining project/location approval
4. Recompute proposal totals.
5. Emit audit and outbox event.

## API Shape

Keep APIs use-case oriented.

Project APIs:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/[id]`
- `PATCH /api/projects/[id]`
- `POST /api/projects/[id]/approvals`
- `POST /api/projects/[id]/locations`
- `POST /api/projects/[id]/lock`
- `GET /api/projects/[id]/limits`
- `GET /api/projects/[id]/dashboard`

Proposal APIs:

- `GET /api/proposals`
- `POST /api/proposals`
- `GET /api/proposals/[id]`
- `PATCH /api/proposals/[id]`
- `POST /api/proposals/[id]/plots`
- `PATCH /api/proposals/[id]/plots/[plotNo]`
- `DELETE /api/proposals/[id]/plots/[plotNo]`
- `GET /api/proposals/[id]/limits`
- `GET /api/proposals/[id]/checklist`
- `POST /api/proposals/[id]/checklist/[requirementId]`
- `POST /api/proposals/[id]/documents/generate`
- `POST /api/proposals/[id]/milestones`
- `POST /api/proposals/[id]/transition`

## UI Development Plan

### Project Screen

Tabs:

- Overview
- Approved Limits
- Approval Records
- Location/Mouza Breakup
- Documents
- Checklist
- Proposals
- Audit Timeline

Main actions:

- save draft
- add approval
- add location breakup
- validate baseline
- lock project
- generate Form-XXII/package

### Proposal Screen

Tabs:

- Overview
- Plot Schedule
- Land Type Abstract
- Limit Check
- Checklist
- Documents
- Manual Milestones
- Citizen Claims
- Employment Applications
- Audit Timeline

Main actions:

- add plots
- run limit check
- complete checklist
- generate package
- mark sent for manual approval
- record manual outcome
- return for correction
- close

## Database Changes Needed

Do not rebuild the existing schema. Add only missing support tables.

High priority:

- `public.manual_milestone`
- `public.deadline_tracker`
- `public.proposal_snapshot` for generated package/version snapshots
- indexes on `acquisition.acq_proposal(proj_cd, area_cd, mine_cd, overall_status)`
- indexes on `acquisition.plot_schedule(proposal_id, mouza_lgd, plot_no)`
- indexes on `public.checklist_submission(checkable_type, checkable_id, status)`

Medium priority:

- normalize file attachment modules if not already handled
- add document package table if one document instance is not enough
- add aggregate table/materialized view for dashboard counters

## Build Sequence

1. Stabilize shared services: authorization, audit, outbox, checklist, workflow.
2. Build `ProjectLimitService`.
3. Complete project baseline lock and approval-location UI.
4. Complete proposal creation and plot schedule UI.
5. Add live limit checks and Board/CMD requirement detection.
6. Configure CL-1 checklist for proposal.
7. Build document package generation for proposal.
8. Add manual milestone tracking.
9. Connect citizen Form-I claim and employment application to proposal/project context.
10. Add dashboards and reports.

## Final Recommendation

Develop project and proposal as one connected flow:

Project defines what is approved. Proposal consumes that approval and prepares SOP-ready files. Global services enforce limits, checklist completion, workflow transitions, document generation, manual milestone tracking, audit, notifications, and org-scope security.

This uses the current database correctly and keeps COALRR focused on ECL Land Department plus citizen claim/employment application work.
