import { PrismaNomineePoolRepository } from '@/infrastructure/persistence/repositories/PrismaNomineePoolRepository'
import { GetNomineePoolsUseCase } from '@/application/use-cases/employment/GetNomineePoolsUseCase'
import { GetNomineePoolDetailUseCase } from '@/application/use-cases/employment/GetNomineePoolDetailUseCase'

import { PrismaDocumentTemplateRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentTemplateRepository'
import { PrismaDocumentInstanceRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentInstanceRepository'

import { PrismaNotificationStorage } from '@/infrastructure/persistence/repositories/PrismaNotificationStorage'
import { NotificationConfig } from '@/core/notifications/NotificationConfig'
import { Audit } from '@/core/audit/services/AuditService'

import { ChecklistContextRegistry } from '@/core/checklist/registry/ChecklistContextRegistry'
import { PrismaChecklistRepository } from '@/infrastructure/persistence/repositories/PrismaChecklistRepository'
import { GetChecklistStatusUseCase } from '@/core/checklist/usecases/GetChecklistStatusUseCase'
import { UpdateChecklistSubmissionUseCase } from '@/core/checklist/usecases/UpdateChecklistSubmissionUseCase'

import { ProjectChecklistResolver } from '@/modules/project-master/services/ProjectChecklistResolver'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { ProposalChecklistResolver } from '@/core/proposal/checklist/ProposalChecklistResolver'
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository'
import { db } from '@/lib/db'

const globalForCoreDI = globalThis as unknown as {
  getNomineePoolsUseCase: GetNomineePoolsUseCase | undefined
  getNomineePoolDetailUseCase: GetNomineePoolDetailUseCase | undefined
  documentTemplateRepository: PrismaDocumentTemplateRepository | undefined
  documentInstanceRepository: PrismaDocumentInstanceRepository | undefined
  jobDispatcher: import('@/core/jobs/services/JobDispatcherService').JobDispatcherService | undefined
  checklistRegistry: ChecklistContextRegistry | undefined
  getChecklistStatusUseCase: GetChecklistStatusUseCase | undefined
  updateChecklistSubmissionUseCase: UpdateChecklistSubmissionUseCase | undefined
}

const nomineePoolRepository = new PrismaNomineePoolRepository()
const documentTemplateRepository = new PrismaDocumentTemplateRepository()
const documentInstanceRepository = new PrismaDocumentInstanceRepository()
const notificationStorage = new PrismaNotificationStorage()

// Initialize Global Configs
NotificationConfig.initialize(notificationStorage)

const checklistRegistry = globalForCoreDI.checklistRegistry ?? new ChecklistContextRegistry()

checklistRegistry.register('PROJECT_MASTER', new ProjectChecklistResolver(new PrismaProjectRepository()))
checklistRegistry.register('LAND_ACQ_PROPOSAL', new ProposalChecklistResolver(new PrismaAcqProposalRepository()))

const checklistRepository = new PrismaChecklistRepository()

export const getNomineePoolsUseCase = globalForCoreDI.getNomineePoolsUseCase ?? new GetNomineePoolsUseCase(nomineePoolRepository)
export const getNomineePoolDetailUseCase = globalForCoreDI.getNomineePoolDetailUseCase ?? new GetNomineePoolDetailUseCase(nomineePoolRepository)

export const getChecklistStatusUseCase = globalForCoreDI.getChecklistStatusUseCase ?? new GetChecklistStatusUseCase(checklistRepository, checklistRegistry)
export const updateChecklistSubmissionUseCase = globalForCoreDI.updateChecklistSubmissionUseCase ?? new UpdateChecklistSubmissionUseCase(checklistRepository, checklistRegistry)

export const documentTemplateRepositoryExport = globalForCoreDI.documentTemplateRepository ?? documentTemplateRepository
export const documentInstanceRepositoryExport = globalForCoreDI.documentInstanceRepository ?? documentInstanceRepository

export const auditQueue = {
  push: (payload: any) => {
    Audit.logCustomAction({
      activity: payload.remarks || payload.action || 'UNKNOWN',
      userId: payload.user_id || 'system'
    }).catch(console.error);
  }
}

import { jobDispatcher as coreJobDispatcher } from '@/core/jobs/services/JobDispatcherService'

export const jobDispatcher = globalForCoreDI.jobDispatcher ?? coreJobDispatcher
export const Container = {
  jobDispatcher,
  checklistRegistry,
  getChecklistStatusUseCase,
  updateChecklistSubmissionUseCase
}

if (process.env.NODE_ENV !== 'production') {
  globalForCoreDI.getNomineePoolsUseCase = getNomineePoolsUseCase
  globalForCoreDI.getNomineePoolDetailUseCase = getNomineePoolDetailUseCase
  globalForCoreDI.documentTemplateRepository = documentTemplateRepositoryExport
  globalForCoreDI.documentInstanceRepository = documentInstanceRepositoryExport
  globalForCoreDI.jobDispatcher = jobDispatcher
  globalForCoreDI.checklistRegistry = checklistRegistry
  globalForCoreDI.getChecklistStatusUseCase = getChecklistStatusUseCase
  globalForCoreDI.updateChecklistSubmissionUseCase = updateChecklistSubmissionUseCase
}
