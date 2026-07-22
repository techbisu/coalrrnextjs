# application Module

## Purpose
This module is responsible for the application layer of the application. It encapsulates logic, components, and services specific to this domain.

## File-by-file breakdown
| File | Description |
|------|-------------|
| `application/middleware/validation.ts` | Provides functionality related to validation. |
| `application/use-cases/employment/GetNomineePoolDetailUseCase.ts` | Orchestrates business logic for GetNomineePoolDetail. |
| `application/use-cases/employment/GetNomineePoolsUseCase.ts` | Orchestrates business logic for GetNomineePools. |
| `application/use-cases/index.ts` | Provides functionality related to index. |
| `application/use-cases/land-acquisition/claims/GetClaimsUseCase.ts` | Orchestrates business logic for GetClaims. |
| `application/use-cases/land-acquisition/claims/SubmitClaimUseCase.ts` | Orchestrates business logic for SubmitClaim. |
| `application/use-cases/land-acquisition/claims/UpdateDraftClaimUseCase.ts` | Orchestrates business logic for UpdateDraftClaim. |
| `application/use-cases/land-acquisition/GetPlotsUseCase.ts` | Orchestrates business logic for GetPlots. |
| `application/use-cases/ledger/AppendLedgerEntryUseCase.ts` | Orchestrates business logic for AppendLedgerEntry. |
| `application/use-cases/ledger/ListLedgerEntriesUseCase.ts` | Orchestrates business logic for ListLedgerEntries. |
| `application/use-cases/org/AssignUserScopeUseCase.ts` | Orchestrates business logic for AssignUserScope. |
| `application/use-cases/org/GetAdjacentMinesUseCase.ts` | Orchestrates business logic for GetAdjacentMines. |
| `application/use-cases/org/ListUserScopeHistoryUseCase.ts` | Orchestrates business logic for ListUserScopeHistory. |
| `application/use-cases/org/TransferUserUseCase.ts` | Orchestrates business logic for TransferUser. |
| `application/use-cases/org/UpdateMineAdjacencyUseCase.ts` | Orchestrates business logic for UpdateMineAdjacency. |
| `application/use-cases/paf/CreatePafRecordUseCase.ts` | Orchestrates business logic for CreatePafRecord. |
| `application/use-cases/paf/DeletePafRecordUseCase.ts` | Orchestrates business logic for DeletePafRecord. |
| `application/use-cases/paf/GetPafRecordUseCase.ts` | Orchestrates business logic for GetPafRecord. |
| `application/use-cases/paf/ListPafRecordsUseCase.ts` | Orchestrates business logic for ListPafRecords. |
| `application/use-cases/paf/UpdatePafRecordUseCase.ts` | Orchestrates business logic for UpdatePafRecord. |
| `application/use-cases/payrolls/AddPayrollLineUseCase.ts` | Orchestrates business logic for AddPayrollLine. |
| `application/use-cases/payrolls/CreatePayrollUseCase.ts` | Orchestrates business logic for CreatePayroll. |
| `application/use-cases/payrolls/DeletePayrollLineUseCase.ts` | Orchestrates business logic for DeletePayrollLine. |
| `application/use-cases/payrolls/GetPayrollByIdUseCase.ts` | Orchestrates business logic for GetPayrollById. |
| `application/use-cases/payrolls/GetPayrollsUseCase.ts` | Orchestrates business logic for GetPayrolls. |
| `application/use-cases/payrolls/UpdatePayrollFactorUseCase.ts` | Orchestrates business logic for UpdatePayrollFactor. |
| `application/use-cases/project/CreateProjectUseCase.ts` | Orchestrates business logic for CreateProject. |
| `application/use-cases/project/GetProjectDashboardUseCase.ts` | Orchestrates business logic for GetProjectDashboard. |
| `application/use-cases/project/index.ts` | Provides functionality related to index. |
| `application/use-cases/project/LockProjectUseCase.ts` | Orchestrates business logic for LockProject. |
| `application/use-cases/project/UpdateProjectUseCase.ts` | Orchestrates business logic for UpdateProject. |
| `application/use-cases/proposal/AddPlotToProposalUseCase.ts` | Orchestrates business logic for AddPlotToProposal. |
| `application/use-cases/proposal/ApproveBoardDeviationUseCase.ts` | Orchestrates business logic for ApproveBoardDeviation. |
| `application/use-cases/proposal/CreateProposalUseCase.ts` | Orchestrates business logic for CreateProposal. |
| `application/use-cases/proposal/GetChecklistUseCase.ts` | Orchestrates business logic for GetChecklist. |
| `application/use-cases/proposal/GetProposalDetailsUseCase.ts` | Orchestrates business logic for GetProposalDetails. |
| `application/use-cases/proposal/GetProposalsUseCase.ts` | Orchestrates business logic for GetProposals. |
| `application/use-cases/proposal/index.ts` | Provides functionality related to index. |
| `application/use-cases/proposal/ReclassifyPlotUseCase.ts` | Orchestrates business logic for ReclassifyPlot. |
| `application/use-cases/proposal/RemovePlotFromProposalUseCase.ts` | Orchestrates business logic for RemovePlotFromProposal. |
| `application/use-cases/proposal/SubmitProposalUseCase.ts` | Orchestrates business logic for SubmitProposal. |
| `application/use-cases/proposal/UpdateChecklistItemUseCase.ts` | Orchestrates business logic for UpdateChecklistItem. |
| `application/use-cases/proposal/UpdateProposalUseCase.ts` | Orchestrates business logic for UpdateProposal. |
| `application/use-cases/rnr-payrolls/AddRnrPayrollLineUseCase.ts` | Orchestrates business logic for AddRnrPayrollLine. |
| `application/use-cases/rnr-payrolls/CreateRnrPayrollUseCase.ts` | Orchestrates business logic for CreateRnrPayroll. |
| `application/use-cases/rnr-payrolls/DeleteRnrPayrollLineUseCase.ts` | Orchestrates business logic for DeleteRnrPayrollLine. |
| `application/use-cases/rnr-payrolls/DeleteRnrPayrollUseCase.ts` | Orchestrates business logic for DeleteRnrPayroll. |
| `application/use-cases/rnr-payrolls/GetRnrPayrollsUseCase.ts` | Orchestrates business logic for GetRnrPayrolls. |
| `application/use-cases/rnr-payrolls/GetRnrPayrollUseCase.ts` | Orchestrates business logic for GetRnrPayroll. |
| `application/use-cases/rnr-payrolls/index.ts` | Provides functionality related to index. |
| `application/use-cases/rnr-payrolls/UpdateRnrPayrollLineUseCase.ts` | Orchestrates business logic for UpdateRnrPayrollLine. |
| `application/use-cases/rnr-payrolls/UpdateRnrPayrollStateUseCase.ts` | Orchestrates business logic for UpdateRnrPayrollState. |
| `application/validators/index.ts` | Provides functionality related to index. |
| `application/validators/schemas.ts` | Provides functionality related to schemas. |

## Key dependencies
**Internal Modules:**
- `app`
- `core`
- `modules`
- `domain`
- `infrastructure`
- `lib`

**External Packages:**
- `next/server`
- `zod`
- `crypto`
- `@prisma/client`
- `decimal.js`

## Entry points
- `application/use-cases/employment/GetNomineePoolDetailUseCase.ts`
- `application/use-cases/employment/GetNomineePoolsUseCase.ts`
- `application/use-cases/land-acquisition/claims/GetClaimsUseCase.ts`
- `application/use-cases/land-acquisition/claims/SubmitClaimUseCase.ts`
- `application/use-cases/land-acquisition/claims/UpdateDraftClaimUseCase.ts`
- `application/use-cases/land-acquisition/GetPlotsUseCase.ts`
- `application/use-cases/ledger/AppendLedgerEntryUseCase.ts`
- `application/use-cases/ledger/ListLedgerEntriesUseCase.ts`
- `application/use-cases/org/AssignUserScopeUseCase.ts`
- `application/use-cases/org/GetAdjacentMinesUseCase.ts`
- `application/use-cases/org/ListUserScopeHistoryUseCase.ts`
- `application/use-cases/org/TransferUserUseCase.ts`
- `application/use-cases/org/UpdateMineAdjacencyUseCase.ts`
- `application/use-cases/paf/CreatePafRecordUseCase.ts`
- `application/use-cases/paf/DeletePafRecordUseCase.ts`
- `application/use-cases/paf/GetPafRecordUseCase.ts`
- `application/use-cases/paf/ListPafRecordsUseCase.ts`
- `application/use-cases/paf/UpdatePafRecordUseCase.ts`
- `application/use-cases/payrolls/AddPayrollLineUseCase.ts`
- `application/use-cases/payrolls/CreatePayrollUseCase.ts`
- `application/use-cases/payrolls/DeletePayrollLineUseCase.ts`
- `application/use-cases/payrolls/GetPayrollByIdUseCase.ts`
- `application/use-cases/payrolls/GetPayrollsUseCase.ts`
- `application/use-cases/payrolls/UpdatePayrollFactorUseCase.ts`
- `application/use-cases/project/CreateProjectUseCase.ts`
- `application/use-cases/project/GetProjectDashboardUseCase.ts`
- `application/use-cases/project/LockProjectUseCase.ts`
- `application/use-cases/project/UpdateProjectUseCase.ts`
- `application/use-cases/proposal/AddPlotToProposalUseCase.ts`
- `application/use-cases/proposal/ApproveBoardDeviationUseCase.ts`
- `application/use-cases/proposal/CreateProposalUseCase.ts`
- `application/use-cases/proposal/GetChecklistUseCase.ts`
- `application/use-cases/proposal/GetProposalDetailsUseCase.ts`
- `application/use-cases/proposal/GetProposalsUseCase.ts`
- `application/use-cases/proposal/ReclassifyPlotUseCase.ts`
- `application/use-cases/proposal/RemovePlotFromProposalUseCase.ts`
- `application/use-cases/proposal/SubmitProposalUseCase.ts`
- `application/use-cases/proposal/UpdateChecklistItemUseCase.ts`
- `application/use-cases/proposal/UpdateProposalUseCase.ts`
- `application/use-cases/rnr-payrolls/AddRnrPayrollLineUseCase.ts`
- `application/use-cases/rnr-payrolls/CreateRnrPayrollUseCase.ts`
- `application/use-cases/rnr-payrolls/DeleteRnrPayrollLineUseCase.ts`
- `application/use-cases/rnr-payrolls/DeleteRnrPayrollUseCase.ts`
- `application/use-cases/rnr-payrolls/GetRnrPayrollsUseCase.ts`
- `application/use-cases/rnr-payrolls/GetRnrPayrollUseCase.ts`
- `application/use-cases/rnr-payrolls/UpdateRnrPayrollLineUseCase.ts`
- `application/use-cases/rnr-payrolls/UpdateRnrPayrollStateUseCase.ts`
