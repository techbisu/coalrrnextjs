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

## Database Schema

- `acq_proposal` — master proposal record (schema: `acquisition`)
- `plot_schedule` — per-plot schedule rows linked to a proposal
- `plot_schedule_land_type` — land type breakdown per plot
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
