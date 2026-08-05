# Land Acquisition & Proposal Module

Manages the full lifecycle of Land Acquisition Proposals (LAPs) under CIL colliery projects, from initiation through plot scheduling, checklist compliance, and submission for approval.

## Architecture

- **Use Cases:** See `src/application/use-cases/proposal/`
- **Repository:** `PrismaAcqProposalRepository` (`src/infrastructure/persistence/repositories/`) — single source of truth for all `acq_proposal` and `plot_schedule` DB access
- **DI Wiring:** `src/infrastructure/di/modules/proposal.di.ts`
- **API Routes:** `src/app/api/proposals/`, `src/app/api/schedules/`
- **UI Modules:** `src/modules/land-acquisition/`, `src/modules/proposal/`
- **Validation Schemas:** `src/core/validation/schemas/proposal.schema.ts`

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

## Proposal Page Layout (12-Column Responsive Grid)

- **Left 8-Column Area**:
  - **Overview Tab**:
    - **Compliance Checklist**: Dynamic requirement rules with `Generated Form` Document Engine integration & inline **`Replace / Resubmit`** document workflow.
    - **Milestones Panel**: Dynamic title & description based on acquisition mode (`Purchase Milestones & Registrations` for Direct Purchase vs `Government Notifications & Statutory Milestones` for CBA/compulsory acquisition) + interactive **`Add Milestone`** modal.
  - **Plots & Annexures Tab**: Plot schedule table with Mouza, Annexure A/B/C breakdown, and Land Types.
- **Right 4-Column Sidebar**:
  - **Workflow Timeline**: Finite state machine node timeline with bounded scrolling container (`max-h-[380px]`).
  - **Actor Role & Approval Chain**: Unified state transition control with role simulation.
  - **Project Limits Check**: Live progress indicators for Land Area (Acres), Budget Ceiling (INR), and Employment Quota (Jobs).

## Proposal Lifecycle

```
Drafting → Checklist Complete → Submitted → Under Review → Approved / Rejected → Published
```

## Use Cases (registered in DI container)

| Export | Class | Purpose |
|--------|-------|---------|
| `getProposalsUseCase` | `GetProposalsUseCase` | List all proposals with project context |
| `createProposalUseCase` | `CreateProposalUseCase` | Create new proposal from schedule route |
| `getProposalDetailsUseCase` | `GetProposalDetailsUseCase` | Full details with plots |
| `submitProposalUseCase` | `SubmitProposalUseCase` | Submit proposal for review |
| `addPlotsToProposalUseCase` | `AddPlotsToProposalUseCase` | Add plot schedule rows |
| `updatePlotUseCase` | `UpdatePlotUseCase` | Edit plot + land types (transactional) |
| `deletePlotUseCase` | `DeletePlotUseCase` | Delete plot + cascade land types |

### Annexure Categorization & States

Plot schedule entries are categorized into 3 standard annexure states during adjacent colliery and unit review:
- **Annexure A — Fully Clear**: The plot can be acquired fully in this proposal.
- **Annexure B — Fully Purchased**: The plot cannot be acquired because it has already been purchased previously.
- **Annexure C — Partially Purchased**: The plot can be acquired only for the available/remaining unacquired area.

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

## Database Schema

- `acq_proposal` — master proposal record (schema: `acquisition`)
- `plot_schedule` — per-plot schedule rows linked to a proposal (stores plot annexure state: `A`, `B`, or `C`)
- `plot_schedule_land_type` — land type breakup per plot (`landt_id` and `sub_landt_id` mandatory), including `use_purpose` (e.g., EXCAVATION, SAFETY_ZONE, OB_DUMP, INFRASTRUCTURE, DIVERSION, REHABILITATION, OTHER) used for land-use allocation and Form XXII baseline deviation calculations.
- `manual_milestone` — manual legal and government milestone entries

## Translations

All user-facing strings use the `land_acquisition` namespace:

```tsx
const t = useAppTranslation('land_acquisition');
// Usage:
<DialogTitle>{t('dialog_title')}</DialogTitle>
<Button>{t('create_proposal')}</Button>
toast.success(t('plot_saved'));
```
