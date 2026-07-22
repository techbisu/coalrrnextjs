# domain Module

## Purpose
This module is responsible for the domain layer of the application. It encapsulates logic, components, and services specific to this domain.

## File-by-file breakdown
| File | Description |
|------|-------------|
| `domain/entities/plot/index.ts` | Provides functionality related to index. |
| `domain/entities/plot/IPlotRepository.ts` | Handles database operations for IPlot. |
| `domain/entities/project/index.ts` | Provides functionality related to index. |
| `domain/entities/project/Project.ts` | Provides functionality related to Project. |
| `domain/entities/project/ProjectId.ts` | Provides functionality related to ProjectId. |
| `domain/entities/project/ProjectRepository.interface.ts` | Provides functionality related to ProjectRepository. |
| `domain/entities/proposal/AcquisitionMode.ts` | Provides functionality related to AcquisitionMode. |
| `domain/entities/proposal/Checklist.ts` | Provides functionality related to Checklist. |
| `domain/entities/proposal/index.ts` | Provides functionality related to index. |
| `domain/entities/proposal/Proposal.ts` | Provides functionality related to Proposal. |
| `domain/entities/proposal/ProposalId.ts` | Provides functionality related to ProposalId. |
| `domain/entities/proposal/ProposalRepository.interface.ts` | Provides functionality related to ProposalRepository. |
| `domain/entities/proposal/ProposalState.ts` | Provides functionality related to ProposalState. |
| `domain/entities/proposal/ScheduleCode.ts` | Provides functionality related to ScheduleCode. |
| `domain/index.ts` | Provides functionality related to index. |
| `domain/interfaces/IUserOrgScopeRepository.ts` | Handles database operations for IUserOrgScope. |
| `domain/value-objects/Area.ts` | Provides functionality related to Area. |
| `domain/value-objects/index.ts` | Provides functionality related to index. |
| `domain/value-objects/Money.ts` | Provides functionality related to Money. |

## Key dependencies
**Internal Modules:**
- `core`

**External Packages:**
- `@prisma/client`
- `decimal.js`

## Entry points
- No explicit entry points (Internal module).
