# modules/admin Module

## Purpose
This module is responsible for the modules/admin layer of the application. It encapsulates logic, components, and services specific to this domain.

## File-by-file breakdown
| File | Description |
|------|-------------|
| `modules/admin/master-data/application/use-cases/CreateMasterDataUseCase.ts` | Orchestrates business logic for CreateMasterData. |
| `modules/admin/master-data/application/use-cases/GetMasterDataUseCase.ts` | Orchestrates business logic for GetMasterData. |
| `modules/admin/master-data/application/use-cases/UpdateMasterDataUseCase.ts` | Orchestrates business logic for UpdateMasterData. |
| `modules/admin/master-data/config/MasterDataRegistry.ts` | Provides functionality related to MasterDataRegistry. |
| `modules/admin/master-data/domain/IGenericMasterRepository.ts` | Handles database operations for IGenericMaster. |
| `modules/admin/master-data/infrastructure/persistence/PrismaGenericMasterRepository.ts` | Handles database operations for PrismaGenericMaster. |
| `modules/admin/roles/application/use-cases/CreateAdminPermissionUseCase.ts` | Orchestrates business logic for CreateAdminPermission. |
| `modules/admin/roles/application/use-cases/CreateAdminRoleUseCase.ts` | Orchestrates business logic for CreateAdminRole. |
| `modules/admin/roles/application/use-cases/DeleteAdminPermissionUseCase.ts` | Orchestrates business logic for DeleteAdminPermission. |
| `modules/admin/roles/application/use-cases/DeleteAdminRoleUseCase.ts` | Orchestrates business logic for DeleteAdminRole. |
| `modules/admin/roles/application/use-cases/GetAdminPermissionsUseCase.ts` | Orchestrates business logic for GetAdminPermissions. |
| `modules/admin/roles/application/use-cases/GetAdminRolesUseCase.ts` | Orchestrates business logic for GetAdminRoles. |
| `modules/admin/roles/application/use-cases/UpdateAdminPermissionUseCase.ts` | Orchestrates business logic for UpdateAdminPermission. |
| `modules/admin/roles/application/use-cases/UpdateAdminRoleUseCase.ts` | Orchestrates business logic for UpdateAdminRole. |
| `modules/admin/roles/domain/repositories/IAdminRoleRepository.ts` | Handles database operations for IAdminRole. |
| `modules/admin/roles/infrastructure/persistence/PrismaAdminRoleRepository.ts` | Handles database operations for PrismaAdminRole. |
| `modules/admin/roles/presentation/actions.ts` | Provides functionality related to actions. |
| `modules/admin/settings/application/use-cases/GetSystemConfigsUseCase.ts` | Orchestrates business logic for GetSystemConfigs. |
| `modules/admin/settings/application/use-cases/UpdateSystemConfigUseCase.ts` | Orchestrates business logic for UpdateSystemConfig. |
| `modules/admin/settings/domain/entities/SystemConfig.ts` | Provides functionality related to SystemConfig. |
| `modules/admin/settings/domain/repositories/ISystemConfigRepository.ts` | Handles database operations for ISystemConfig. |
| `modules/admin/settings/infrastructure/persistence/PrismaSystemConfigRepository.ts` | Handles database operations for PrismaSystemConfig. |
| `modules/admin/users/application/use-cases/CreateAdminUserUseCase.ts` | Orchestrates business logic for CreateAdminUser. |
| `modules/admin/users/application/use-cases/DeleteAdminUserUseCase.ts` | Orchestrates business logic for DeleteAdminUser. |
| `modules/admin/users/application/use-cases/GetAdminUsersUseCase.ts` | Orchestrates business logic for GetAdminUsers. |
| `modules/admin/users/application/use-cases/UpdateAdminUserUseCase.ts` | Orchestrates business logic for UpdateAdminUser. |
| `modules/admin/users/domain/repositories/IAdminUserRepository.ts` | Handles database operations for IAdminUser. |
| `modules/admin/users/infrastructure/persistence/PrismaAdminUserRepository.ts` | Handles database operations for PrismaAdminUser. |
| `modules/admin/users/presentation/actions.ts` | Provides functionality related to actions. |

## Key dependencies
**Internal Modules:**
- `core`
- `lib`
- `infrastructure`

**External Packages:**
- `@prisma/client`
- `crypto`
- `next/cache`

## Entry points
- `modules/admin/master-data/application/use-cases/CreateMasterDataUseCase.ts`
- `modules/admin/master-data/application/use-cases/GetMasterDataUseCase.ts`
- `modules/admin/master-data/application/use-cases/UpdateMasterDataUseCase.ts`
- `modules/admin/roles/application/use-cases/CreateAdminPermissionUseCase.ts`
- `modules/admin/roles/application/use-cases/CreateAdminRoleUseCase.ts`
- `modules/admin/roles/application/use-cases/DeleteAdminPermissionUseCase.ts`
- `modules/admin/roles/application/use-cases/DeleteAdminRoleUseCase.ts`
- `modules/admin/roles/application/use-cases/GetAdminPermissionsUseCase.ts`
- `modules/admin/roles/application/use-cases/GetAdminRolesUseCase.ts`
- `modules/admin/roles/application/use-cases/UpdateAdminPermissionUseCase.ts`
- `modules/admin/roles/application/use-cases/UpdateAdminRoleUseCase.ts`
- `modules/admin/settings/application/use-cases/GetSystemConfigsUseCase.ts`
- `modules/admin/settings/application/use-cases/UpdateSystemConfigUseCase.ts`
- `modules/admin/users/application/use-cases/CreateAdminUserUseCase.ts`
- `modules/admin/users/application/use-cases/DeleteAdminUserUseCase.ts`
- `modules/admin/users/application/use-cases/GetAdminUsersUseCase.ts`
- `modules/admin/users/application/use-cases/UpdateAdminUserUseCase.ts`
