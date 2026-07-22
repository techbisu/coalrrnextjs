import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { PrismaPafRepository } from '@/infrastructure/persistence/repositories/PrismaPafRepository'

import { CreateProjectUseCase } from '@/application/use-cases/project/CreateProjectUseCase'
import { UpdateProjectUseCase } from '@/application/use-cases/project/UpdateProjectUseCase'
import { GetProjectDashboardUseCase } from '@/application/use-cases/project/GetProjectDashboardUseCase'
import { LockProjectUseCase } from '@/application/use-cases/project/LockProjectUseCase'
import { BaselineLockUseCase } from '@/application/use-cases/project/BaselineLockUseCase'
import { ApproveFormXXIIUseCase } from '@/application/use-cases/project/ApproveFormXXIIUseCase'
import { GenerateFormXXIIUseCase } from '@/application/use-cases/project/GenerateFormXXIIUseCase'
import { ComplianceMonitorService } from '@/core/compliance/services/ComplianceMonitorService'
import { PrismaProjectApprovalLocationRepository } from '@/infrastructure/persistence/repositories/PrismaProjectApprovalLocationRepository'

import { ListPafRecordsUseCase } from '@/application/use-cases/paf/ListPafRecordsUseCase'
import { CreatePafRecordUseCase } from '@/application/use-cases/paf/CreatePafRecordUseCase'
import { GetPafRecordUseCase } from '@/application/use-cases/paf/GetPafRecordUseCase'
import { UpdatePafRecordUseCase } from '@/application/use-cases/paf/UpdatePafRecordUseCase'
import { DeletePafRecordUseCase } from '@/application/use-cases/paf/DeletePafRecordUseCase'

const globalForProjectDI = globalThis as unknown as {
  createProjectUseCase: CreateProjectUseCase | undefined
  updateProjectUseCase: UpdateProjectUseCase | undefined
  getProjectDashboardUseCase: GetProjectDashboardUseCase | undefined
  lockProjectUseCase: LockProjectUseCase | undefined
  listPafRecordsUseCase: ListPafRecordsUseCase | undefined
  createPafRecordUseCase: CreatePafRecordUseCase | undefined
  getPafRecordUseCase: GetPafRecordUseCase | undefined
  updatePafRecordUseCase: UpdatePafRecordUseCase | undefined
  deletePafRecordUseCase: DeletePafRecordUseCase | undefined
  baselineLockUseCase: BaselineLockUseCase | undefined
  approveFormXXIIUseCase: ApproveFormXXIIUseCase | undefined
  generateFormXXIIUseCase: GenerateFormXXIIUseCase | undefined
}

const projectRepository = new PrismaProjectRepository()
const pafRepository = new PrismaPafRepository()
const locationRepository = new PrismaProjectApprovalLocationRepository()
const complianceService = new ComplianceMonitorService(projectRepository, locationRepository)

export const createProjectUseCase = globalForProjectDI.createProjectUseCase ?? new CreateProjectUseCase(projectRepository)
export const updateProjectUseCase = globalForProjectDI.updateProjectUseCase ?? new UpdateProjectUseCase(projectRepository)
export const getProjectDashboardUseCase = globalForProjectDI.getProjectDashboardUseCase ?? new GetProjectDashboardUseCase(projectRepository)
export const lockProjectUseCase = globalForProjectDI.lockProjectUseCase ?? new LockProjectUseCase(projectRepository)
export const baselineLockUseCase = globalForProjectDI.baselineLockUseCase ?? new BaselineLockUseCase(projectRepository)
export const approveFormXXIIUseCase = globalForProjectDI.approveFormXXIIUseCase ?? new ApproveFormXXIIUseCase(projectRepository)
export const generateFormXXIIUseCase = globalForProjectDI.generateFormXXIIUseCase ?? new GenerateFormXXIIUseCase(projectRepository, complianceService)

export const listPafRecordsUseCase = globalForProjectDI.listPafRecordsUseCase ?? new ListPafRecordsUseCase(pafRepository)
export const createPafRecordUseCase = globalForProjectDI.createPafRecordUseCase ?? new CreatePafRecordUseCase(pafRepository)
export const getPafRecordUseCase = globalForProjectDI.getPafRecordUseCase ?? new GetPafRecordUseCase(pafRepository)
export const updatePafRecordUseCase = globalForProjectDI.updatePafRecordUseCase ?? new UpdatePafRecordUseCase(pafRepository)
export const deletePafRecordUseCase = globalForProjectDI.deletePafRecordUseCase ?? new DeletePafRecordUseCase(pafRepository)

if (process.env.NODE_ENV !== 'production') {
  globalForProjectDI.createProjectUseCase = createProjectUseCase
  globalForProjectDI.updateProjectUseCase = updateProjectUseCase
  globalForProjectDI.getProjectDashboardUseCase = getProjectDashboardUseCase
  globalForProjectDI.lockProjectUseCase = lockProjectUseCase
  globalForProjectDI.listPafRecordsUseCase = listPafRecordsUseCase
  globalForProjectDI.createPafRecordUseCase = createPafRecordUseCase
  globalForProjectDI.getPafRecordUseCase = getPafRecordUseCase
  globalForProjectDI.updatePafRecordUseCase = updatePafRecordUseCase
  globalForProjectDI.deletePafRecordUseCase = deletePafRecordUseCase
  globalForProjectDI.baselineLockUseCase = baselineLockUseCase
  globalForProjectDI.approveFormXXIIUseCase = approveFormXXIIUseCase
  globalForProjectDI.generateFormXXIIUseCase = generateFormXXIIUseCase
}
