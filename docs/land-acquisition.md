# Land Acquisition & Proposal Module

Manages the full lifecycle of Land Acquisition Proposals (LAPs) under CIL colliery projects, from initiation through plot scheduling, checklist compliance, and submission for approval.

## Architecture

- **Use Cases:** See `src/application/use-cases/proposal/`
- **Repository:** `PrismaAcqProposalRepository` (`src/infrastructure/persistence/repositories/`) — single source of truth for all `acq_proposal` and `plot_schedule` DB access
- **DI Wiring:** `src/infrastructure/di/modules/proposal.di.ts`
- **API Routes:** `src/app/api/proposals/`, `src/app/api/schedules/`
- **UI Modules:** `src/modules/land-acquisition/`, `src/modules/proposal/`
- **Validation Schemas:** `src/core/validation/schemas/proposal.schema.ts`

## Proposal Initiation Modal (`CreateProposalDialog.tsx`)

- **High-Speed 2-Step Wizard**:
  - **Step 1: Mode & Basic Parameters**: Workflow Type (Standard vs Draft PR Stage 1.4), Target Mining Project (`<ProjectSelect lockedOnly />`), Primary Acquisition Mode (`STANDARD_ACQ_MODES`: Direct Purchase, CBA Act, RFCTLARR Act), Proposal Reference No, and Notification/Proposal Date.
  - **Step 2: Techno-Economic Rates & Justification**: Per-acre compensation rates (Tenancy with emp, Tenancy without emp, Govt land, Forest land) + Form-XXII Item 8 inevitable justification.
- **Redundancy Cleanup**: Primary Acquisition Mode options render strictly `STANDARD_ACQ_MODES` (Direct Purchase, CBA Act, RFCTLARR Act). The "Draft Project Expansion / Checklist 1.4" option is removed from the primary mode picker because Draft PR Stage is already selected at the top level as `DRAFT_PR_CHECKLIST_1_4`.
- **UI Conditional Hiding**: When "Draft PR Stage (Checklist 1.4)" is selected, the Primary Acquisition Mode picker is automatically hidden.
- **Dynamic Master Mapping**: Primary Acquisition Mode maps directly to `master.acqu_mode.acq_mode_id` (`1` = CBA, `2` = RFCTLARR, `6` = Direct Purchase).
- **SOP Exceptional Cases**: Exceptional case declarations (Debottar Land, Tribal Land, Formal Negotiations) are managed inside the proposal workspace tabs after creation.

## API Endpoints

| Method | Route | Permission | Description |
|--------|-------|------------|-------------|
| GET | `/api/schedules` | `acquisition.view` | List all proposals |
| POST | `/api/schedules` | `acquisition.create` | Create a new proposal |
| GET | `/api/schedules/[id]` | `acquisition.view` | Get proposal details |
| PATCH | `/api/schedules/[id]` | `acquisition.edit` | Update proposal |
| POST | `/api/proposals` | `PROPOSAL_CREATE` | Initiate enterprise proposal |
| POST | `/api/proposals/[id]/plots` | `acquisition.edit` | Add plots to proposal |
| GET | `/api/proposals/[id]/plots/[plot_no]` | `acquisition.view` | Get plot details |
| PUT | `/api/proposals/[id]/plots/[plot_no]` | `acquisition.edit` | Edit a plot |
| DELETE | `/api/proposals/[id]/plots/[plot_no]` | `acquisition.edit` | Delete a plot |
| GET | `/api/proposals/[id]/limits` | `proposal.view` | Project limit compliance check |
| GET | `/api/proposals/[id]/milestones` | `proposal.view` | Fetch proposal milestones |
| POST | `/api/proposals/[id]/milestones` | `proposal.view` | Record a new proposal milestone |

## Modular Section UI Architecture (`src/modules/land-acquisition/components/sections/`)

The proposal workspace page is structured into focused, single-responsibility child section components:
- **`ProposalHeaderSection.tsx`**: Top-level header hosting the **`<ProposalActionCenterBanner />`** Command Center.
- **`ProposalOverviewSection.tsx`**: Key metrics stat tiles, land category breakdown, and colliery metadata.
- **`ProposalChecklistSection.tsx`**: Wraps `GenericChecklistWorkspace` with dynamic `show_if` rules and Document Engine replace/resubmit workflow.
- **`ProposalMilestonesSection.tsx`**: Wraps `ManualMilestonePanel` for mode-specific statutory milestone dependencies.
- **`ProposalPlotsSection.tsx`**: Wraps `PlotScheduleManager` for plot selection and Annexure A/B/C breakdown.
- **`ProposalWorkflowSidebarSection.tsx`**: Right 4-column sidebar assembling `<ApprovalPanel />`, `<WorkflowTimelineFeed />`, and `<LimitCheckPanel />`.

## Lazy Loading & Performance Optimization Strategy

- **Dynamic Lazy Imports**: Heavy tab sections (`ProposalChecklistSection`, `ProposalPlotsSection`, `ProposalMilestonesSection`, `ProposalWorkflowSidebarSection`) are loaded dynamically using Next.js `next/dynamic` with `ssr: false` and custom skeleton fallbacks (`SectionSkeleton.tsx`).
- **Initial Render Optimization**: Initial page load completes in **<100ms** by deferring heavy child section bundle evaluation until tab activation, eliminating layout shifts.

## Proposal Page Layout (12-Column Responsive Grid)

- **Top**: **`<ProposalHeaderSection />`** Command Center Header.
- **Left 8-Column Area (Tabbed Workspace)**:
  - **Overview Tab**: `<ProposalOverviewSection />` (Summary stat tiles, tenancy vs govt/forest land breakdown).
  - **Compliance Checklist Tab**: `<ProposalChecklistSection />` (Dynamic requirement rules, document uploads, Form VII & XXII resubmissions).
  - **Plots & Annexures Tab**: `<ProposalPlotsSection />` (Plot schedule table with Mouza, Annexure A/B/C breakdown, and Land Types).
  - **Statutory Milestones Tab**: `<ProposalMilestonesSection />` (Statutory notifications and registration milestones).
- **Right 4-Column Sidebar**:
  - `<ProposalWorkflowSidebarSection />` combining `<ApprovalPanel />`, `<WorkflowTimelineFeed />`, and `<LimitCheckPanel />`.

## Checklist Service Architecture (`master.checklist_requirement_rule` & `public.checklist_submission`)

- **Database Model Mapping & Standard Constants**:
  - `master.checklist_requirement_rule`: Primary key is `chk_id` (`UUID`), unique requirement code is `chk_code` (`VarChar(50)`).
  - `public.checklist_submission`: `requirement_id` FK references `checklist_requirement_rule.chk_id`. `checkable_type` MUST match `ACQ_LAND_SCHEDULE` (`'acq_land_schedule'` imported from `@/core/config/module-codes.config.ts`).
  - **Multi-Tier Caching**: Checklist rules are cached via `ConfigCacheService` (L1 Process RAM + L2 Redis) to avoid DB load.
  - **Single Source of Truth Validation**: Rule metadata is validated with `ChecklistRequirementRuleSchema` in `src/shared/schemas/checklist-rule.schema.ts`.
- **Mode-Wise Filtering (`show_if`)**:
  - **Direct Purchase (`acq_mode_id = 6`)**: Renders 11 Universal Core items + 2 Direct Purchase items (*Landowner Title Search Report 13 Years* & *Tripartite Rate Valuation Committee Minutes*) + Form VII & Form XXII. Suppresses all CBA statutory forms (Form II, III, VIII, XVI, XXIV, 1A/1B) and RFCTLARR Board copies.
  - **CBA Act (`acq_mode_id = 1`)**: Renders Sec 4, Sec 7 Gazette Notifications, Form XVI 5-Point Certificate, Form II, Form III, Form VIII, Form XXIV, Form 1A/1B.

## Document Engine Single Instance File Replacement

- **Single File Record Rule**: Regenerating a form (Form-VII, Form-XXII) for a `document_instance` automatically deletes the previous file record and physical file (`deleteFileUseCase`) before saving the new buffer.
- Prevents file record duplication and orphaned storage files.

## Proposal Lifecycle (Direct Purchase vs Standard)

```
Direct Purchase (Mode 6): Drafting → UnitSubmitted → CrossCollieryVerification → AreaVetting → HqParallelVetting → GmLreReview → DocketIssued → Published
Standard LAP:           Drafting → UnitSubmitted → AreaVetting → HqParallelVetting → BoardEscalation → Published
```

### Form-VII Joint Reconciliation Signature Flow (12 Signatures: 6+6 Flow)
Form-VII requires a 12-signature joint reconciliation across colliery boundaries:
1. **Purchasing Colliery (Steps 1–6)**: Land Clerk, Survey Officer, Project Manager, Project Agent, Area Land Officer, Area General Manager.
2. **Adjacent Colliery (Steps 7–12)**: Adjacent Land Clerk, Adjacent Survey Officer, Adjacent Project Manager, Adjacent Project Agent, Adjacent Area Land Officer, Adjacent Area General Manager.
3. Seeding rule: `document_template_signature.seed.ts` seeds all 12 signature rules. Computed dynamically in `FormVIIResolver.ts`.

## Business Logic Rules & Categorization

### Dynamic Land Type Categorization (`buildLandCategoryMap`)
Land classification is driven dynamically by `master.landtype_master` hierarchy traversal rather than hardcoded IDs or static string names:
- **`TENANCY`**: Private tenancy land (Rayati, etc.)
- **`PATTA`**: Patta land / Forest Patta land
- **`GOVT`**: Government / PSU / Prior Govt land
- **`FOREST`**: Revenue Forest / Protected Forest / Notified Forest land

### Job Count Calculation Rule
- **Employment Quota**: Only `TENANCY` and `PATTA` land types contribute to the calculated employment quota (`Math.floor((tenancyLand + pattaLand) / 2)`).
- **Zero Jobs**: Government and Forest land types strictly yield **0 jobs**.

### Acquisition Mode Master Mapping (`master.acqu_mode`)
- `1`: CBA (A&D) Act 1957 (`cba_act`)
- `2`: RFCTLARR Act 2013 (`rfctlarr`)
- `3`: LTS / Transfer of Government Land (`govt_transfer`)
- `4`: Lease Government Land (`lease_govt`)
- `5`: Diversion of Forest Land (`forest_diversion`)
- `6`: Direct Purchase (`direct_purchase`)

---

## Database Schema & Audit Standards

- `acq_proposal` — master proposal record (schema: `acquisition`)
- `plot_schedule` — per-plot schedule rows linked to a proposal (stores plot annexure state: `A`, `B`, or `C`)
- `plot_schedule_land_type` — land type breakup per plot (`landt_id` and `sub_landt_id` mandatory), including `use_purpose` (e.g., EXCAVATION, SAFETY_ZONE, OB_DUMP, INFRASTRUCTURE, DIVERSION, REHABILITATION, OTHER) used for land-use allocation and Form XXII baseline deviation calculations.
- `checklist_requirement_rule` & `checklist_submission` — dynamic Checklist Service rules (`chk_id` PK, `chk_code` unique) and user submissions (`public.checklist_submission`).
- `file_record` & `file_attachment` — central File Manager polymorphic file linking (`public.file_attachment` with `entity_type = 'workflow_action_history'` or `'acq_proposal'`).
- `manual_milestone` — manual legal and government milestone entries
- **Audit Field Standard**: `entry_by` & `updt_by` store ONLY authenticated User ID (`String(auth.user.id)`). `entry_ts` & `updt_ts` store Epoch BigInt.

## Translations

All user-facing strings use the `land_acquisition` namespace:

```tsx
const t = useAppTranslation('land_acquisition');
// Usage:
<DialogTitle>{t('dialog_title')}</DialogTitle>
<Button>{t('create_proposal')}</Button>
toast.success(t('plot_saved'));
```
