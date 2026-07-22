import { PrismaAdminRoleRepository } from '@/modules/admin/roles/infrastructure/persistence/PrismaAdminRoleRepository'
import { GetAdminRolesUseCase } from '@/modules/admin/roles/application/use-cases/GetAdminRolesUseCase'
import { CreateAdminRoleUseCase } from '@/modules/admin/roles/application/use-cases/CreateAdminRoleUseCase'
import { UpdateAdminRoleUseCase } from '@/modules/admin/roles/application/use-cases/UpdateAdminRoleUseCase'
import { DeleteAdminRoleUseCase } from '@/modules/admin/roles/application/use-cases/DeleteAdminRoleUseCase'
import { GetAdminPermissionsUseCase } from '@/modules/admin/roles/application/use-cases/GetAdminPermissionsUseCase'
import { CreateAdminPermissionUseCase } from '@/modules/admin/roles/application/use-cases/CreateAdminPermissionUseCase'
import { UpdateAdminPermissionUseCase } from '@/modules/admin/roles/application/use-cases/UpdateAdminPermissionUseCase'
import { DeleteAdminPermissionUseCase } from '@/modules/admin/roles/application/use-cases/DeleteAdminPermissionUseCase'

import { GetSystemConfigsUseCase } from '@/modules/admin/settings/application/use-cases/GetSystemConfigsUseCase'
import { UpdateSystemConfigUseCase } from '@/modules/admin/settings/application/use-cases/UpdateSystemConfigUseCase'
import { PrismaSystemConfigRepository } from '@/modules/admin/settings/infrastructure/persistence/PrismaSystemConfigRepository'

import { PrismaGenericMasterRepository } from '@/modules/admin/master-data/infrastructure/persistence/PrismaGenericMasterRepository'
import { GetMasterDataUseCase } from '@/modules/admin/master-data/application/use-cases/GetMasterDataUseCase'
import { CreateMasterDataUseCase } from '@/modules/admin/master-data/application/use-cases/CreateMasterDataUseCase'
import { UpdateMasterDataUseCase } from '@/modules/admin/master-data/application/use-cases/UpdateMasterDataUseCase'

import { PrismaAdminUserRepository } from '@/modules/admin/users/infrastructure/persistence/PrismaAdminUserRepository'
import { GetAdminUsersUseCase } from '@/modules/admin/users/application/use-cases/GetAdminUsersUseCase'
import { CreateAdminUserUseCase } from '@/modules/admin/users/application/use-cases/CreateAdminUserUseCase'
import { UpdateAdminUserUseCase } from '@/modules/admin/users/application/use-cases/UpdateAdminUserUseCase'
import { DeleteAdminUserUseCase } from '@/modules/admin/users/application/use-cases/DeleteAdminUserUseCase'

const globalForAdminDI = globalThis as unknown as {
  getAdminRolesUseCase: GetAdminRolesUseCase | undefined
  createAdminRoleUseCase: CreateAdminRoleUseCase | undefined
  updateAdminRoleUseCase: UpdateAdminRoleUseCase | undefined
  deleteAdminRoleUseCase: DeleteAdminRoleUseCase | undefined
  
  getAdminPermissionsUseCase: GetAdminPermissionsUseCase | undefined
  createAdminPermissionUseCase: CreateAdminPermissionUseCase | undefined
  updateAdminPermissionUseCase: UpdateAdminPermissionUseCase | undefined
  deleteAdminPermissionUseCase: DeleteAdminPermissionUseCase | undefined
  
  getSystemConfigsUseCase: GetSystemConfigsUseCase | undefined
  updateSystemConfigUseCase: UpdateSystemConfigUseCase | undefined

  getMasterDataUseCase: GetMasterDataUseCase | undefined
  createMasterDataUseCase: CreateMasterDataUseCase | undefined
  updateMasterDataUseCase: UpdateMasterDataUseCase | undefined

  getAdminUsersUseCase: GetAdminUsersUseCase | undefined
  createAdminUserUseCase: CreateAdminUserUseCase | undefined
  updateAdminUserUseCase: UpdateAdminUserUseCase | undefined
  deleteAdminUserUseCase: DeleteAdminUserUseCase | undefined
}

const adminRoleRepository = new PrismaAdminRoleRepository()
const systemConfigRepository = new PrismaSystemConfigRepository()
const genericMasterRepository = new PrismaGenericMasterRepository()
const adminUserRepository = new PrismaAdminUserRepository()

export const getAdminRolesUseCase = globalForAdminDI.getAdminRolesUseCase ?? new GetAdminRolesUseCase(adminRoleRepository)
export const createAdminRoleUseCase = globalForAdminDI.createAdminRoleUseCase ?? new CreateAdminRoleUseCase(adminRoleRepository)
export const updateAdminRoleUseCase = globalForAdminDI.updateAdminRoleUseCase ?? new UpdateAdminRoleUseCase(adminRoleRepository)
export const deleteAdminRoleUseCase = globalForAdminDI.deleteAdminRoleUseCase ?? new DeleteAdminRoleUseCase(adminRoleRepository)

export const getAdminPermissionsUseCase = globalForAdminDI.getAdminPermissionsUseCase ?? new GetAdminPermissionsUseCase(adminRoleRepository)
export const createAdminPermissionUseCase = globalForAdminDI.createAdminPermissionUseCase ?? new CreateAdminPermissionUseCase(adminRoleRepository)
export const updateAdminPermissionUseCase = globalForAdminDI.updateAdminPermissionUseCase ?? new UpdateAdminPermissionUseCase(adminRoleRepository)
export const deleteAdminPermissionUseCase = globalForAdminDI.deleteAdminPermissionUseCase ?? new DeleteAdminPermissionUseCase(adminRoleRepository)

export const getSystemConfigsUseCase = globalForAdminDI.getSystemConfigsUseCase ?? new GetSystemConfigsUseCase(systemConfigRepository)
export const updateSystemConfigUseCase = globalForAdminDI.updateSystemConfigUseCase ?? new UpdateSystemConfigUseCase(systemConfigRepository)

export const getMasterDataUseCase = globalForAdminDI.getMasterDataUseCase ?? new GetMasterDataUseCase(genericMasterRepository)
export const createMasterDataUseCase = globalForAdminDI.createMasterDataUseCase ?? new CreateMasterDataUseCase(genericMasterRepository)
export const updateMasterDataUseCase = globalForAdminDI.updateMasterDataUseCase ?? new UpdateMasterDataUseCase(genericMasterRepository)

export const getAdminUsersUseCase = globalForAdminDI.getAdminUsersUseCase ?? new GetAdminUsersUseCase(adminUserRepository)
export const createAdminUserUseCase = globalForAdminDI.createAdminUserUseCase ?? new CreateAdminUserUseCase(adminUserRepository)
export const updateAdminUserUseCase = globalForAdminDI.updateAdminUserUseCase ?? new UpdateAdminUserUseCase(adminUserRepository)
export const deleteAdminUserUseCase = globalForAdminDI.deleteAdminUserUseCase ?? new DeleteAdminUserUseCase(adminUserRepository)

if (process.env.NODE_ENV !== 'production') {
  globalForAdminDI.getAdminRolesUseCase = getAdminRolesUseCase
  globalForAdminDI.createAdminRoleUseCase = createAdminRoleUseCase
  globalForAdminDI.updateAdminRoleUseCase = updateAdminRoleUseCase
  globalForAdminDI.deleteAdminRoleUseCase = deleteAdminRoleUseCase
  
  globalForAdminDI.getAdminPermissionsUseCase = getAdminPermissionsUseCase
  globalForAdminDI.createAdminPermissionUseCase = createAdminPermissionUseCase
  globalForAdminDI.updateAdminPermissionUseCase = updateAdminPermissionUseCase
  globalForAdminDI.deleteAdminPermissionUseCase = deleteAdminPermissionUseCase
  
  globalForAdminDI.getSystemConfigsUseCase = getSystemConfigsUseCase
  globalForAdminDI.updateSystemConfigUseCase = updateSystemConfigUseCase

  globalForAdminDI.getMasterDataUseCase = getMasterDataUseCase
  globalForAdminDI.createMasterDataUseCase = createMasterDataUseCase
  globalForAdminDI.updateMasterDataUseCase = updateMasterDataUseCase

  globalForAdminDI.getAdminUsersUseCase = getAdminUsersUseCase
  globalForAdminDI.createAdminUserUseCase = createAdminUserUseCase
  globalForAdminDI.updateAdminUserUseCase = updateAdminUserUseCase
  globalForAdminDI.deleteAdminUserUseCase = deleteAdminUserUseCase
}
