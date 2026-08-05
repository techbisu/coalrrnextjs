import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { PrismaPafRepository } from '@/infrastructure/persistence/repositories/PrismaPafRepository'

import { CreateProjectUseCase } from '@/application/use-cases/project/CreateProjectUseCase'
import { UpdateProjectUseCase } from '@/application/use-cases/project/UpdateProjectUseCase'
import { GetProjectDashboardUseCase } from '@/application/use-cases/project/GetProjectDashboardUseCase'
import { GetProjectDetailUseCase } from '@/application/use-cases/project/GetProjectDetailUseCase'
import { DeleteProjectUseCase } from '@/application/use-cases/project/DeleteProjectUseCase'
import { BaselineLockUseCase } from '@/application/use-cases/project/BaselineLockUseCase'
import { ApproveFormXXIIUseCase } from '@/application/use-cases/project/ApproveFormXXIIUseCase'
import { GenerateFormXXIIUseCase } from '@/application/use-cases/project/GenerateFormXXIIUseCase'
import { ComplianceMonitorService } from '@/core/compliance/services/ComplianceMonitorService'
import { PrismaProjectApprovalLocationRepository } from '@/infrastructure/persistence/repositories/PrismaProjectApprovalLocationRepository'
import { ProjectChecklistResolver } from '@/modules/project-master/services/ProjectChecklistResolver'

import { ListPafRecordsUseCase } from '@/application/use-cases/paf/ListPafRecordsUseCase'
import { CreatePafRecordUseCase } from '@/application/use-cases/paf/CreatePafRecordUseCase'
import { GetPafRecordUseCase } from '@/application/use-cases/paf/GetPafRecordUseCase'
import { UpdatePafRecordUseCase } from '@/application/use-cases/paf/UpdatePafRecordUseCase'
import { DeletePafRecordUseCase } from '@/application/use-cases/paf/DeletePafRecordUseCase'

export function getProjectRepository() {
  return new PrismaProjectRepository()
}

export function getPafRepository() {
  return new PrismaPafRepository()
}

export const projectRepository = getProjectRepository()
export const pafRepository = getPafRepository()
export const locationRepository = new PrismaProjectApprovalLocationRepository()
export const complianceService = new ComplianceMonitorService(projectRepository, locationRepository)

export const createProjectUseCase = new CreateProjectUseCase(getProjectRepository())
export const updateProjectUseCase = new UpdateProjectUseCase(getProjectRepository())
export const getProjectDashboardUseCase = new GetProjectDashboardUseCase(getProjectRepository())
export const getProjectDetailUseCase = new GetProjectDetailUseCase(getProjectRepository())
export const deleteProjectUseCase = new DeleteProjectUseCase(getProjectRepository())
export const baselineLockUseCase = new BaselineLockUseCase(getProjectRepository())
export const approveFormXXIIUseCase = new ApproveFormXXIIUseCase(getProjectRepository())
export const generateFormXXIIUseCase = new GenerateFormXXIIUseCase(getProjectRepository(), complianceService)

export const projectChecklistResolver = new ProjectChecklistResolver(getProjectRepository())

export const listPafRecordsUseCase = new ListPafRecordsUseCase(pafRepository)
export const createPafRecordUseCase = new CreatePafRecordUseCase(pafRepository)
export const getPafRecordUseCase = new GetPafRecordUseCase(pafRepository)
export const updatePafRecordUseCase = new UpdatePafRecordUseCase(pafRepository)
export const deletePafRecordUseCase = new DeletePafRecordUseCase(pafRepository)
