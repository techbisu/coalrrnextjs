# infrastructure Module

## Purpose
This module is responsible for the infrastructure layer of the application. It encapsulates logic, components, and services specific to this domain.

## File-by-file breakdown
| File | Description |
|------|-------------|
| `infrastructure/di/Container.ts` | Provides functionality related to Container. |
| `infrastructure/persistence/repositories/index.ts` | Provides functionality related to index. |
| `infrastructure/persistence/repositories/PrismaClaimRepository.ts` | Handles database operations for PrismaClaim. |
| `infrastructure/persistence/repositories/PrismaLedgerEntryRepository.ts` | Handles database operations for PrismaLedgerEntry. |
| `infrastructure/persistence/repositories/PrismaMineRepository.ts` | Handles database operations for PrismaMine. |
| `infrastructure/persistence/repositories/PrismaNomineePoolRepository.ts` | Handles database operations for PrismaNomineePool. |
| `infrastructure/persistence/repositories/PrismaNotificationStorage.ts` | Provides functionality related to PrismaNotificationStorage. |
| `infrastructure/persistence/repositories/PrismaPafRepository.ts` | Handles database operations for PrismaPaf. |
| `infrastructure/persistence/repositories/PrismaPayrollsRepository.ts` | Handles database operations for PrismaPayrolls. |
| `infrastructure/persistence/repositories/PrismaPermissionRepository.ts` | Handles database operations for PrismaPermission. |
| `infrastructure/persistence/repositories/PrismaPlotRepository.ts` | Handles database operations for PrismaPlot. |
| `infrastructure/persistence/repositories/PrismaProjectRepository.ts` | Handles database operations for PrismaProject. |
| `infrastructure/persistence/repositories/PrismaProposalRepository.ts` | Handles database operations for PrismaProposal. |
| `infrastructure/persistence/repositories/PrismaRnrPayrollRepository.ts` | Handles database operations for PrismaRnrPayroll. |
| `infrastructure/persistence/repositories/PrismaRoleRepository.ts` | Handles database operations for PrismaRole. |
| `infrastructure/persistence/repositories/PrismaUserOrgScopeRepository.ts` | Handles database operations for PrismaUserOrgScope. |
| `infrastructure/security/index.ts` | Provides functionality related to index. |
| `infrastructure/security/RateLimiter.ts` | Provides functionality related to RateLimiter. |

## Key dependencies
**Internal Modules:**
- `application`
- `modules`
- `core`
- `lib`
- `domain`

**External Packages:**
- `@prisma/client`
- `decimal.js`
- `crypto`

## Entry points
- `infrastructure/di/Container.ts`
