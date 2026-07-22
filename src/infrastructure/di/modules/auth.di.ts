import { PrismaMineRepository } from '@/infrastructure/persistence/repositories/PrismaMineRepository'
import { PrismaUserOrgScopeRepository } from '@/infrastructure/persistence/repositories/PrismaUserOrgScopeRepository'
import { PrismaRoleRepository } from '@/infrastructure/persistence/repositories/PrismaRoleRepository'
import { PrismaPermissionRepository } from '@/infrastructure/persistence/repositories/PrismaPermissionRepository'

import { AssignUserScopeUseCase } from '@/application/use-cases/org/AssignUserScopeUseCase'
import { TransferUserUseCase } from '@/application/use-cases/org/TransferUserUseCase'
import { ListUserScopeHistoryUseCase } from '@/application/use-cases/org/ListUserScopeHistoryUseCase'
import { UpdateMineAdjacencyUseCase } from '@/application/use-cases/org/UpdateMineAdjacencyUseCase'
import { GetAdjacentMinesUseCase } from '@/application/use-cases/org/GetAdjacentMinesUseCase'

import { AuthorizationService } from '@/core/authorization/services/AuthorizationService'
import { RoleService } from '@/core/authorization/services/RoleService'
import { PermissionService } from '@/core/authorization/services/PermissionService'

const globalForAuthDI = globalThis as unknown as {
  assignUserScopeUseCase: AssignUserScopeUseCase | undefined
  transferUserUseCase: TransferUserUseCase | undefined
  listUserScopeHistoryUseCase: ListUserScopeHistoryUseCase | undefined
  updateMineAdjacencyUseCase: UpdateMineAdjacencyUseCase | undefined
  getAdjacentMinesUseCase: GetAdjacentMinesUseCase | undefined
  userOrgScopeRepository: PrismaUserOrgScopeRepository | undefined
  authService: AuthorizationService | undefined
  roleService: RoleService | undefined
  permissionService: PermissionService | undefined
}

const mineRepository = new PrismaMineRepository()
const userOrgScopeRepository = new PrismaUserOrgScopeRepository()
const roleRepository = new PrismaRoleRepository()
const permissionRepository = new PrismaPermissionRepository()

export const assignUserScopeUseCase = globalForAuthDI.assignUserScopeUseCase ?? new AssignUserScopeUseCase(userOrgScopeRepository)
export const transferUserUseCase = globalForAuthDI.transferUserUseCase ?? new TransferUserUseCase(userOrgScopeRepository)
export const listUserScopeHistoryUseCase = globalForAuthDI.listUserScopeHistoryUseCase ?? new ListUserScopeHistoryUseCase(userOrgScopeRepository)
export const updateMineAdjacencyUseCase = globalForAuthDI.updateMineAdjacencyUseCase ?? new UpdateMineAdjacencyUseCase(mineRepository)
export const getAdjacentMinesUseCase = globalForAuthDI.getAdjacentMinesUseCase ?? new GetAdjacentMinesUseCase(mineRepository)
export const userOrgScopeRepositoryExport = globalForAuthDI.userOrgScopeRepository ?? userOrgScopeRepository

export const authService = globalForAuthDI.authService ?? new AuthorizationService(roleRepository, permissionRepository)
export const roleService = globalForAuthDI.roleService ?? new RoleService(roleRepository, permissionRepository)
export const permissionService = globalForAuthDI.permissionService ?? new PermissionService(permissionRepository)

if (process.env.NODE_ENV !== 'production') {
  globalForAuthDI.assignUserScopeUseCase = assignUserScopeUseCase
  globalForAuthDI.transferUserUseCase = transferUserUseCase
  globalForAuthDI.listUserScopeHistoryUseCase = listUserScopeHistoryUseCase
  globalForAuthDI.updateMineAdjacencyUseCase = updateMineAdjacencyUseCase
  globalForAuthDI.getAdjacentMinesUseCase = getAdjacentMinesUseCase
  globalForAuthDI.userOrgScopeRepository = userOrgScopeRepositoryExport
  globalForAuthDI.authService = authService
  globalForAuthDI.roleService = roleService
  globalForAuthDI.permissionService = permissionService
}
