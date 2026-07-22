import { PrismaNomineePoolRepository } from '@/infrastructure/persistence/repositories/PrismaNomineePoolRepository'
import { GetNomineePoolsUseCase } from '@/application/use-cases/employment/GetNomineePoolsUseCase'
import { GetNomineePoolDetailUseCase } from '@/application/use-cases/employment/GetNomineePoolDetailUseCase'

import { PrismaDocumentTemplateRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentTemplateRepository'
import { PrismaDocumentInstanceRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentInstanceRepository'

import { PrismaNotificationStorage } from '@/infrastructure/persistence/repositories/PrismaNotificationStorage'
import { NotificationConfig } from '@/core/notifications/NotificationConfig'
import { Audit } from '@/core/audit'

const globalForCoreDI = globalThis as unknown as {
  getNomineePoolsUseCase: GetNomineePoolsUseCase | undefined
  getNomineePoolDetailUseCase: GetNomineePoolDetailUseCase | undefined
  documentTemplateRepository: PrismaDocumentTemplateRepository | undefined
  documentInstanceRepository: PrismaDocumentInstanceRepository | undefined
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

if (process.env.NODE_ENV !== 'production') {
  globalForCoreDI.getNomineePoolsUseCase = getNomineePoolsUseCase
  globalForCoreDI.getNomineePoolDetailUseCase = getNomineePoolDetailUseCase
  globalForCoreDI.documentTemplateRepository = documentTemplateRepositoryExport
  globalForCoreDI.documentInstanceRepository = documentInstanceRepositoryExport
}
