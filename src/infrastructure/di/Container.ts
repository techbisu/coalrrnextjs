import { PrismaMineRepository } from '../persistence/repositories/PrismaMineRepository'
import { AssignUserScopeUseCase } from '@/application/use-cases/org/AssignUserScopeUseCase'
import { TransferUserUseCase } from '@/application/use-cases/org/TransferUserUseCase'
import { ListUserScopeHistoryUseCase } from '@/application/use-cases/org/ListUserScopeHistoryUseCase'
import { UpdateMineAdjacencyUseCase } from '@/application/use-cases/org/UpdateMineAdjacencyUseCase'
import { GetAdjacentMinesUseCase } from '@/application/use-cases/org/GetAdjacentMinesUseCase'
import { PrismaUserOrgScopeRepository } from '../persistence/repositories/PrismaUserOrgScopeRepository'
import { PrismaRoleRepository } from '../persistence/repositories/PrismaRoleRepository'
import { PrismaPermissionRepository } from '../persistence/repositories/PrismaPermissionRepository'
import { GetAdminRolesUseCase } from '@/modules/admin/roles/application/use-cases/GetAdminRolesUseCase'
import { CreateAdminRoleUseCase } from '@/modules/admin/roles/application/use-cases/CreateAdminRoleUseCase'
import { UpdateAdminRoleUseCase } from '@/modules/admin/roles/application/use-cases/UpdateAdminRoleUseCase'
import { DeleteAdminRoleUseCase } from '@/modules/admin/roles/application/use-cases/DeleteAdminRoleUseCase'
import { GetAdminPermissionsUseCase } from '@/modules/admin/roles/application/use-cases/GetAdminPermissionsUseCase'
import { CreateAdminPermissionUseCase } from '@/modules/admin/roles/application/use-cases/CreateAdminPermissionUseCase'
import { UpdateAdminPermissionUseCase } from '@/modules/admin/roles/application/use-cases/UpdateAdminPermissionUseCase'
import { DeleteAdminPermissionUseCase } from '@/modules/admin/roles/application/use-cases/DeleteAdminPermissionUseCase'
import { PrismaAdminRoleRepository } from '@/modules/admin/roles/infrastructure/persistence/PrismaAdminRoleRepository'

import { AuthorizationService } from '@/core/authorization/services/AuthorizationService'
import { RoleService } from '@/core/authorization/services/RoleService'
import { PermissionService } from '@/core/authorization/services/PermissionService'

import { PrismaNomineePoolRepository } from '../persistence/repositories/PrismaNomineePoolRepository'
import { GetNomineePoolsUseCase } from '@/application/use-cases/employment/GetNomineePoolsUseCase'
import { GetNomineePoolDetailUseCase } from '@/application/use-cases/employment/GetNomineePoolDetailUseCase'

import { PrismaClaimRepository } from '../persistence/repositories/PrismaClaimRepository'
import { PrismaPlotRepository } from '../persistence/repositories/PrismaPlotRepository'

import { GetClaimsUseCase } from '@/application/use-cases/land-acquisition/claims/GetClaimsUseCase'
import { SubmitClaimUseCase } from '@/application/use-cases/land-acquisition/claims/SubmitClaimUseCase'
import { UpdateDraftClaimUseCase } from '@/application/use-cases/land-acquisition/claims/UpdateDraftClaimUseCase'
import { GetPlotsUseCase } from '@/application/use-cases/land-acquisition/GetPlotsUseCase'

import { PrismaProjectRepository } from '../persistence/repositories/PrismaProjectRepository'
import { PrismaPafRepository } from '../persistence/repositories/PrismaPafRepository'
import { PrismaLedgerEntryRepository } from '../persistence/repositories/PrismaLedgerEntryRepository'
import { PrismaRnrPayrollRepository } from '../persistence/repositories/PrismaRnrPayrollRepository'
import { PrismaPayrollsRepository } from '../persistence/repositories/PrismaPayrollsRepository'

import { CreateProjectUseCase } from '@/application/use-cases/project/CreateProjectUseCase'
import { UpdateProjectUseCase } from '@/application/use-cases/project/UpdateProjectUseCase'
import { GetProjectDashboardUseCase } from '@/application/use-cases/project/GetProjectDashboardUseCase'
import { LockProjectUseCase } from '@/application/use-cases/project/LockProjectUseCase'

import { ListPafRecordsUseCase } from '@/application/use-cases/paf/ListPafRecordsUseCase'
import { CreatePafRecordUseCase } from '@/application/use-cases/paf/CreatePafRecordUseCase'
import { GetPafRecordUseCase } from '@/application/use-cases/paf/GetPafRecordUseCase'
import { UpdatePafRecordUseCase } from '@/application/use-cases/paf/UpdatePafRecordUseCase'
import { DeletePafRecordUseCase } from '@/application/use-cases/paf/DeletePafRecordUseCase'

import { ListLedgerEntriesUseCase } from '@/application/use-cases/ledger/ListLedgerEntriesUseCase'
import { AppendLedgerEntryUseCase } from '@/application/use-cases/ledger/AppendLedgerEntryUseCase'

import { GetRnrPayrollsUseCase } from '@/application/use-cases/rnr-payrolls/GetRnrPayrollsUseCase'
import { CreateRnrPayrollUseCase } from '@/application/use-cases/rnr-payrolls/CreateRnrPayrollUseCase'
import { GetRnrPayrollUseCase } from '@/application/use-cases/rnr-payrolls/GetRnrPayrollUseCase'
import { UpdateRnrPayrollStateUseCase } from '@/application/use-cases/rnr-payrolls/UpdateRnrPayrollStateUseCase'
import { DeleteRnrPayrollUseCase } from '@/application/use-cases/rnr-payrolls/DeleteRnrPayrollUseCase'
import { AddRnrPayrollLineUseCase } from '@/application/use-cases/rnr-payrolls/AddRnrPayrollLineUseCase'
import { UpdateRnrPayrollLineUseCase } from '@/application/use-cases/rnr-payrolls/UpdateRnrPayrollLineUseCase'
import { DeleteRnrPayrollLineUseCase } from '@/application/use-cases/rnr-payrolls/DeleteRnrPayrollLineUseCase'

import { GetPayrollsUseCase } from '@/application/use-cases/payrolls/GetPayrollsUseCase'
import { CreatePayrollUseCase } from '@/application/use-cases/payrolls/CreatePayrollUseCase'
import { GetPayrollByIdUseCase } from '@/application/use-cases/payrolls/GetPayrollByIdUseCase'
import { UpdatePayrollFactorUseCase } from '@/application/use-cases/payrolls/UpdatePayrollFactorUseCase'
import { AddPayrollLineUseCase } from '@/application/use-cases/payrolls/AddPayrollLineUseCase'
import { DeletePayrollLineUseCase } from '@/application/use-cases/payrolls/DeletePayrollLineUseCase'

import { PrismaNotificationStorage } from '../persistence/repositories/PrismaNotificationStorage'
import { GetSystemConfigsUseCase } from '@/modules/admin/settings/application/use-cases/GetSystemConfigsUseCase'
import { UpdateSystemConfigUseCase } from '@/modules/admin/settings/application/use-cases/UpdateSystemConfigUseCase'
import { PrismaSystemConfigRepository } from '@/modules/admin/settings/infrastructure/persistence/PrismaSystemConfigRepository'
import { NotificationConfig } from '@/core/notifications/NotificationConfig'

import { PrismaGenericMasterRepository } from '../../modules/admin/master-data/infrastructure/persistence/PrismaGenericMasterRepository'
import { GetMasterDataUseCase } from '../../modules/admin/master-data/application/use-cases/GetMasterDataUseCase'
import { CreateMasterDataUseCase } from '../../modules/admin/master-data/application/use-cases/CreateMasterDataUseCase'
import { UpdateMasterDataUseCase } from '../../modules/admin/master-data/application/use-cases/UpdateMasterDataUseCase'
import { PrismaDocumentTemplateRepository } from '../../modules/document-engine/infrastructure/persistence/PrismaDocumentTemplateRepository'
import { PrismaDocumentInstanceRepository } from '../../modules/document-engine/infrastructure/persistence/PrismaDocumentInstanceRepository'
import { PrismaAdminUserRepository } from '@/modules/admin/users/infrastructure/persistence/PrismaAdminUserRepository'
import { GetAdminUsersUseCase } from '@/modules/admin/users/application/use-cases/GetAdminUsersUseCase'
import { CreateAdminUserUseCase } from '@/modules/admin/users/application/use-cases/CreateAdminUserUseCase'
import { UpdateAdminUserUseCase } from '@/modules/admin/users/application/use-cases/UpdateAdminUserUseCase'
import { DeleteAdminUserUseCase } from '@/modules/admin/users/application/use-cases/DeleteAdminUserUseCase'

// Instantiate Repositories
const mineRepository = new PrismaMineRepository()
const userOrgScopeRepository = new PrismaUserOrgScopeRepository()
const roleRepository = new PrismaRoleRepository()
const permissionRepository = new PrismaPermissionRepository()
const adminRoleRepository = new PrismaAdminRoleRepository()
const nomineePoolRepository = new PrismaNomineePoolRepository()
const claimRepository = new PrismaClaimRepository()
const plotRepository = new PrismaPlotRepository()
const projectRepository = new PrismaProjectRepository()
const pafRepository = new PrismaPafRepository()
const ledgerEntryRepository = new PrismaLedgerEntryRepository()
const rnrPayrollRepository = new PrismaRnrPayrollRepository()
const payrollsRepository = new PrismaPayrollsRepository()
const notificationStorage = new PrismaNotificationStorage()
const genericMasterRepository = new PrismaGenericMasterRepository()
const documentTemplateRepository = new PrismaDocumentTemplateRepository()
const documentInstanceRepository = new PrismaDocumentInstanceRepository()
const adminUserRepository = new PrismaAdminUserRepository()

// Settings Module
const systemConfigRepository = new PrismaSystemConfigRepository()

// Initialize Global Configs
NotificationConfig.initialize(notificationStorage)

// Global singletons to survive Next.js fast refresh during dev
const globalForDI = globalThis as unknown as {
  assignUserScopeUseCase: AssignUserScopeUseCase | undefined
  transferUserUseCase: TransferUserUseCase | undefined
  listUserScopeHistoryUseCase: ListUserScopeHistoryUseCase | undefined
  updateMineAdjacencyUseCase: UpdateMineAdjacencyUseCase | undefined
  getAdjacentMinesUseCase: GetAdjacentMinesUseCase | undefined
  userOrgScopeRepository: PrismaUserOrgScopeRepository | undefined
  authService: AuthorizationService | undefined
  roleService: RoleService | undefined
  permissionService: PermissionService | undefined
  
  getAdminRolesUseCase: GetAdminRolesUseCase | undefined
  createAdminRoleUseCase: CreateAdminRoleUseCase | undefined
  updateAdminRoleUseCase: UpdateAdminRoleUseCase | undefined
  deleteAdminRoleUseCase: DeleteAdminRoleUseCase | undefined
  
  getAdminPermissionsUseCase: GetAdminPermissionsUseCase | undefined
  createAdminPermissionUseCase: CreateAdminPermissionUseCase | undefined
  updateAdminPermissionUseCase: UpdateAdminPermissionUseCase | undefined
  deleteAdminPermissionUseCase: DeleteAdminPermissionUseCase | undefined
  getNomineePoolsUseCase: GetNomineePoolsUseCase | undefined
  getNomineePoolDetailUseCase: GetNomineePoolDetailUseCase | undefined
  getClaimsUseCase: GetClaimsUseCase | undefined
  submitClaimUseCase: SubmitClaimUseCase | undefined
  updateDraftClaimUseCase: UpdateDraftClaimUseCase | undefined
  getPlotsUseCase: GetPlotsUseCase | undefined
  createProjectUseCase: CreateProjectUseCase | undefined
  updateProjectUseCase: UpdateProjectUseCase | undefined
  getProjectDashboardUseCase: GetProjectDashboardUseCase | undefined
  lockProjectUseCase: LockProjectUseCase | undefined
  listPafRecordsUseCase: ListPafRecordsUseCase | undefined
  createPafRecordUseCase: CreatePafRecordUseCase | undefined
  getPafRecordUseCase: GetPafRecordUseCase | undefined
  updatePafRecordUseCase: UpdatePafRecordUseCase | undefined
  deletePafRecordUseCase: DeletePafRecordUseCase | undefined
  listLedgerEntriesUseCase: ListLedgerEntriesUseCase | undefined
  appendLedgerEntryUseCase: AppendLedgerEntryUseCase | undefined
  getRnrPayrollsUseCase: GetRnrPayrollsUseCase | undefined
  createRnrPayrollUseCase: CreateRnrPayrollUseCase | undefined
  getRnrPayrollUseCase: GetRnrPayrollUseCase | undefined
  updateRnrPayrollStateUseCase: UpdateRnrPayrollStateUseCase | undefined
  deleteRnrPayrollUseCase: DeleteRnrPayrollUseCase | undefined
  addRnrPayrollLineUseCase: AddRnrPayrollLineUseCase | undefined
  updateRnrPayrollLineUseCase: UpdateRnrPayrollLineUseCase | undefined
  deleteRnrPayrollLineUseCase: DeleteRnrPayrollLineUseCase | undefined
  getPayrollsUseCase: GetPayrollsUseCase | undefined
  createPayrollUseCase: CreatePayrollUseCase | undefined
  getPayrollByIdUseCase: GetPayrollByIdUseCase | undefined
  updatePayrollFactorUseCase: UpdatePayrollFactorUseCase | undefined
  addPayrollLineUseCase: AddPayrollLineUseCase | undefined
  deletePayrollLineUseCase: DeletePayrollLineUseCase | undefined

  getMasterDataUseCase: GetMasterDataUseCase | undefined
  createMasterDataUseCase: CreateMasterDataUseCase | undefined
  updateMasterDataUseCase: UpdateMasterDataUseCase | undefined
  documentTemplateRepository: PrismaDocumentTemplateRepository | undefined
  documentInstanceRepository: PrismaDocumentInstanceRepository | undefined
  getSystemConfigsUseCase: GetSystemConfigsUseCase | undefined
  updateSystemConfigUseCase: UpdateSystemConfigUseCase | undefined

  getAdminUsersUseCase: GetAdminUsersUseCase | undefined
  createAdminUserUseCase: CreateAdminUserUseCase | undefined
  updateAdminUserUseCase: UpdateAdminUserUseCase | undefined
  deleteAdminUserUseCase: DeleteAdminUserUseCase | undefined
}

import { Audit } from '@/core/audit'

export const auditQueue = {
  push: (payload: any) => {
    Audit.activity({
      event: payload.action || 'UNKNOWN',
      module: payload.module_name || 'unknown',
      description: payload.remarks,
      entityType: payload.entity_name,
      entityId: payload.entity_id,
      metadata: { user_id: payload.user_id, ...payload }
    }).catch(console.error);
  }
}

export const assignUserScopeUseCase = globalForDI.assignUserScopeUseCase ?? new AssignUserScopeUseCase(userOrgScopeRepository)
export const transferUserUseCase = globalForDI.transferUserUseCase ?? new TransferUserUseCase(userOrgScopeRepository)
export const listUserScopeHistoryUseCase = globalForDI.listUserScopeHistoryUseCase ?? new ListUserScopeHistoryUseCase(userOrgScopeRepository)
export const updateMineAdjacencyUseCase = globalForDI.updateMineAdjacencyUseCase ?? new UpdateMineAdjacencyUseCase(mineRepository)
export const getAdjacentMinesUseCase = globalForDI.getAdjacentMinesUseCase ?? new GetAdjacentMinesUseCase(mineRepository)
export const userOrgScopeRepositoryExport = globalForDI.userOrgScopeRepository ?? userOrgScopeRepository

export const authService = globalForDI.authService ?? new AuthorizationService(roleRepository, permissionRepository)
export const roleService = globalForDI.roleService ?? new RoleService(roleRepository, permissionRepository)
export const permissionService = globalForDI.permissionService ?? new PermissionService(permissionRepository)

export const getAdminRolesUseCase = new GetAdminRolesUseCase(adminRoleRepository)
export const createAdminRoleUseCase = new CreateAdminRoleUseCase(adminRoleRepository)
export const updateAdminRoleUseCase = new UpdateAdminRoleUseCase(adminRoleRepository)
export const deleteAdminRoleUseCase = new DeleteAdminRoleUseCase(adminRoleRepository)

export const getAdminPermissionsUseCase = new GetAdminPermissionsUseCase(adminRoleRepository)
export const createAdminPermissionUseCase = new CreateAdminPermissionUseCase(adminRoleRepository)
export const updateAdminPermissionUseCase = new UpdateAdminPermissionUseCase(adminRoleRepository)
export const deleteAdminPermissionUseCase = new DeleteAdminPermissionUseCase(adminRoleRepository)

export const getNomineePoolsUseCase = globalForDI.getNomineePoolsUseCase ?? new GetNomineePoolsUseCase(nomineePoolRepository)
export const getNomineePoolDetailUseCase = globalForDI.getNomineePoolDetailUseCase ?? new GetNomineePoolDetailUseCase(nomineePoolRepository)
export const getClaimsUseCase = globalForDI.getClaimsUseCase ?? new GetClaimsUseCase(claimRepository)
export const submitClaimUseCase = globalForDI.submitClaimUseCase ?? new SubmitClaimUseCase(claimRepository, plotRepository)
export const updateDraftClaimUseCase = globalForDI.updateDraftClaimUseCase ?? new UpdateDraftClaimUseCase(claimRepository)
export const getPlotsUseCase = globalForDI.getPlotsUseCase ?? new GetPlotsUseCase(plotRepository)
export const createProjectUseCase = globalForDI.createProjectUseCase ?? new CreateProjectUseCase(projectRepository)
export const updateProjectUseCase = globalForDI.updateProjectUseCase ?? new UpdateProjectUseCase(projectRepository)
export const getProjectDashboardUseCase = globalForDI.getProjectDashboardUseCase ?? new GetProjectDashboardUseCase(projectRepository)
export const lockProjectUseCase = globalForDI.lockProjectUseCase ?? new LockProjectUseCase(projectRepository)
export const listPafRecordsUseCase = globalForDI.listPafRecordsUseCase ?? new ListPafRecordsUseCase(pafRepository)
export const createPafRecordUseCase = globalForDI.createPafRecordUseCase ?? new CreatePafRecordUseCase(pafRepository)
export const getPafRecordUseCase = globalForDI.getPafRecordUseCase ?? new GetPafRecordUseCase(pafRepository)
export const updatePafRecordUseCase = globalForDI.updatePafRecordUseCase ?? new UpdatePafRecordUseCase(pafRepository)
export const deletePafRecordUseCase = globalForDI.deletePafRecordUseCase ?? new DeletePafRecordUseCase(pafRepository)
export const listLedgerEntriesUseCase = globalForDI.listLedgerEntriesUseCase ?? new ListLedgerEntriesUseCase(ledgerEntryRepository)
export const appendLedgerEntryUseCase = globalForDI.appendLedgerEntryUseCase ?? new AppendLedgerEntryUseCase(ledgerEntryRepository)
export const getRnrPayrollsUseCase = globalForDI.getRnrPayrollsUseCase ?? new GetRnrPayrollsUseCase(rnrPayrollRepository)
export const createRnrPayrollUseCase = globalForDI.createRnrPayrollUseCase ?? new CreateRnrPayrollUseCase(rnrPayrollRepository)
export const getRnrPayrollUseCase = globalForDI.getRnrPayrollUseCase ?? new GetRnrPayrollUseCase(rnrPayrollRepository)
export const updateRnrPayrollStateUseCase = globalForDI.updateRnrPayrollStateUseCase ?? new UpdateRnrPayrollStateUseCase(rnrPayrollRepository)
export const deleteRnrPayrollUseCase = globalForDI.deleteRnrPayrollUseCase ?? new DeleteRnrPayrollUseCase(rnrPayrollRepository)
export const addRnrPayrollLineUseCase = globalForDI.addRnrPayrollLineUseCase ?? new AddRnrPayrollLineUseCase(rnrPayrollRepository)
export const updateRnrPayrollLineUseCase = globalForDI.updateRnrPayrollLineUseCase ?? new UpdateRnrPayrollLineUseCase(rnrPayrollRepository)
export const deleteRnrPayrollLineUseCase = globalForDI.deleteRnrPayrollLineUseCase ?? new DeleteRnrPayrollLineUseCase(rnrPayrollRepository)
export const getPayrollsUseCase = globalForDI.getPayrollsUseCase ?? new GetPayrollsUseCase(payrollsRepository)
export const createPayrollUseCase = globalForDI.createPayrollUseCase ?? new CreatePayrollUseCase(payrollsRepository)
export const getPayrollByIdUseCase = globalForDI.getPayrollByIdUseCase ?? new GetPayrollByIdUseCase(payrollsRepository)
export const updatePayrollFactorUseCase = globalForDI.updatePayrollFactorUseCase ?? new UpdatePayrollFactorUseCase(payrollsRepository)
export const addPayrollLineUseCase = globalForDI.addPayrollLineUseCase ?? new AddPayrollLineUseCase(payrollsRepository)
export const deletePayrollLineUseCase = globalForDI.deletePayrollLineUseCase ?? new DeletePayrollLineUseCase(payrollsRepository)

export const getMasterDataUseCase = globalForDI.getMasterDataUseCase ?? new GetMasterDataUseCase(genericMasterRepository)
export const createMasterDataUseCase = globalForDI.createMasterDataUseCase ?? new CreateMasterDataUseCase(genericMasterRepository)
export const updateMasterDataUseCase = globalForDI.updateMasterDataUseCase ?? new UpdateMasterDataUseCase(genericMasterRepository)
export const documentTemplateRepositoryExport = globalForDI.documentTemplateRepository ?? documentTemplateRepository
export const documentInstanceRepositoryExport = globalForDI.documentInstanceRepository ?? documentInstanceRepository

export const getSystemConfigsUseCase = globalForDI.getSystemConfigsUseCase ?? new GetSystemConfigsUseCase(systemConfigRepository)
export const updateSystemConfigUseCase = globalForDI.updateSystemConfigUseCase ?? new UpdateSystemConfigUseCase(systemConfigRepository)

export const getAdminUsersUseCase = globalForDI.getAdminUsersUseCase ?? new GetAdminUsersUseCase(adminUserRepository)
export const createAdminUserUseCase = globalForDI.createAdminUserUseCase ?? new CreateAdminUserUseCase(adminUserRepository)
export const updateAdminUserUseCase = globalForDI.updateAdminUserUseCase ?? new UpdateAdminUserUseCase(adminUserRepository)
export const deleteAdminUserUseCase = globalForDI.deleteAdminUserUseCase ?? new DeleteAdminUserUseCase(adminUserRepository)

if (process.env.NODE_ENV !== 'production') {
  globalForDI.assignUserScopeUseCase = assignUserScopeUseCase
  globalForDI.transferUserUseCase = transferUserUseCase
  globalForDI.listUserScopeHistoryUseCase = listUserScopeHistoryUseCase
  globalForDI.updateMineAdjacencyUseCase = updateMineAdjacencyUseCase
  globalForDI.getAdjacentMinesUseCase = getAdjacentMinesUseCase
  globalForDI.userOrgScopeRepository = userOrgScopeRepositoryExport
  globalForDI.authService = authService
  globalForDI.roleService = roleService
  globalForDI.permissionService = permissionService
  
  globalForDI.getAdminRolesUseCase = getAdminRolesUseCase
  globalForDI.createAdminRoleUseCase = createAdminRoleUseCase
  globalForDI.updateAdminRoleUseCase = updateAdminRoleUseCase
  globalForDI.deleteAdminRoleUseCase = deleteAdminRoleUseCase
  
  globalForDI.getAdminPermissionsUseCase = getAdminPermissionsUseCase
  globalForDI.createAdminPermissionUseCase = createAdminPermissionUseCase
  globalForDI.updateAdminPermissionUseCase = updateAdminPermissionUseCase
  globalForDI.deleteAdminPermissionUseCase = deleteAdminPermissionUseCase
  globalForDI.getNomineePoolsUseCase = getNomineePoolsUseCase
  globalForDI.getNomineePoolDetailUseCase = getNomineePoolDetailUseCase
  globalForDI.getClaimsUseCase = getClaimsUseCase
  globalForDI.submitClaimUseCase = submitClaimUseCase
  globalForDI.updateDraftClaimUseCase = updateDraftClaimUseCase
  globalForDI.getPlotsUseCase = getPlotsUseCase
  globalForDI.createProjectUseCase = createProjectUseCase
  globalForDI.updateProjectUseCase = updateProjectUseCase
  globalForDI.getProjectDashboardUseCase = getProjectDashboardUseCase
  globalForDI.lockProjectUseCase = lockProjectUseCase
  globalForDI.listPafRecordsUseCase = listPafRecordsUseCase
  globalForDI.createPafRecordUseCase = createPafRecordUseCase
  globalForDI.getPafRecordUseCase = getPafRecordUseCase
  globalForDI.updatePafRecordUseCase = updatePafRecordUseCase
  globalForDI.deletePafRecordUseCase = deletePafRecordUseCase
  globalForDI.listLedgerEntriesUseCase = listLedgerEntriesUseCase
  globalForDI.appendLedgerEntryUseCase = appendLedgerEntryUseCase
  globalForDI.getRnrPayrollsUseCase = getRnrPayrollsUseCase
  globalForDI.createRnrPayrollUseCase = createRnrPayrollUseCase
  globalForDI.getRnrPayrollUseCase = getRnrPayrollUseCase
  globalForDI.updateRnrPayrollStateUseCase = updateRnrPayrollStateUseCase
  globalForDI.deleteRnrPayrollUseCase = deleteRnrPayrollUseCase
  globalForDI.addRnrPayrollLineUseCase = addRnrPayrollLineUseCase
  globalForDI.updateRnrPayrollLineUseCase = updateRnrPayrollLineUseCase
  globalForDI.deleteRnrPayrollLineUseCase = deleteRnrPayrollLineUseCase
  globalForDI.getPayrollsUseCase = getPayrollsUseCase
  globalForDI.createPayrollUseCase = createPayrollUseCase
  globalForDI.getPayrollByIdUseCase = getPayrollByIdUseCase
  globalForDI.updatePayrollFactorUseCase = updatePayrollFactorUseCase
  globalForDI.addPayrollLineUseCase = addPayrollLineUseCase
  globalForDI.deletePayrollLineUseCase = deletePayrollLineUseCase

  globalForDI.getMasterDataUseCase = getMasterDataUseCase
  globalForDI.createMasterDataUseCase = createMasterDataUseCase
  globalForDI.updateMasterDataUseCase = updateMasterDataUseCase
  globalForDI.documentTemplateRepository = documentTemplateRepositoryExport
  globalForDI.documentInstanceRepository = documentInstanceRepositoryExport
  globalForDI.getSystemConfigsUseCase = getSystemConfigsUseCase
  globalForDI.updateSystemConfigUseCase = updateSystemConfigUseCase

  globalForDI.getAdminUsersUseCase = getAdminUsersUseCase
  globalForDI.createAdminUserUseCase = createAdminUserUseCase
  globalForDI.updateAdminUserUseCase = updateAdminUserUseCase
  globalForDI.deleteAdminUserUseCase = deleteAdminUserUseCase
}
