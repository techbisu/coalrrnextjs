import { PrismaNomineePoolRepository } from '@/infrastructure/persistence/repositories/PrismaNomineePoolRepository'
import { GetNomineePoolsUseCase } from '@/application/use-cases/employment/GetNomineePoolsUseCase'
import { GetNomineePoolDetailUseCase } from '@/application/use-cases/employment/GetNomineePoolDetailUseCase'

import { PrismaDocumentTemplateRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentTemplateRepository'
import { PrismaDocumentInstanceRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentInstanceRepository'

import { PrismaNotificationStorage } from '@/infrastructure/persistence/repositories/PrismaNotificationStorage'
import { NotificationConfig } from '@/core/notifications/NotificationConfig'
import { Audit } from '@/core/audit/services/AuditService'

const globalForCoreDI = globalThis as unknown as {
  getNomineePoolsUseCase: GetNomineePoolsUseCase | undefined
  getNomineePoolDetailUseCase: GetNomineePoolDetailUseCase | undefined
  documentTemplateRepository: PrismaDocumentTemplateRepository | undefined
  documentInstanceRepository: PrismaDocumentInstanceRepository | undefined
  jobDispatcher: import('@/core/jobs/services/JobDispatcherService').JobDispatcherService | undefined
}

const nomineePoolRepository = new PrismaNomineePoolRepository()
const documentTemplateRepository = new PrismaDocumentTemplateRepository()
const documentInstanceRepository = new PrismaDocumentInstanceRepository()
const notificationStorage = new PrismaNotificationStorage()

// Initialize Global Configs
NotificationConfig.initialize(notificationStorage)

export const getNomineePoolsUseCase = globalForCoreDI.getNomineePoolsUseCase ?? new GetNomineePoolsUseCase(nomineePoolRepository)
export const getNomineePoolDetailUseCase = globalForCoreDI.getNomineePoolDetailUseCase ?? new GetNomineePoolDetailUseCase(nomineePoolRepository)

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

import { JobDispatcherService } from '@/core/jobs/services/JobDispatcherService'
const jobDispatcherService = new JobDispatcherService()

export const jobDispatcher = globalForCoreDI.jobDispatcher ?? jobDispatcherService
export const Container = {
  jobDispatcher
}

if (process.env.NODE_ENV !== 'production') {
  globalForCoreDI.getNomineePoolsUseCase = getNomineePoolsUseCase
  globalForCoreDI.getNomineePoolDetailUseCase = getNomineePoolDetailUseCase
  globalForCoreDI.documentTemplateRepository = documentTemplateRepositoryExport
  globalForCoreDI.documentInstanceRepository = documentInstanceRepositoryExport
  globalForCoreDI.jobDispatcher = jobDispatcher
}
