import { PrismaNomineePoolRepository } from '@/infrastructure/persistence/repositories/PrismaNomineePoolRepository'
import { MODULE_CODES } from '@/core/config/module-codes.config'
import { GetNomineePoolsUseCase } from '@/application/use-cases/employment/GetNomineePoolsUseCase'
import { GetNomineePoolDetailUseCase } from '@/application/use-cases/employment/GetNomineePoolDetailUseCase'

import { PrismaDocumentTemplateRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentTemplateRepository'
import { PrismaDocumentInstanceRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentInstanceRepository'

import { PrismaNotificationStorage } from '@/infrastructure/persistence/repositories/PrismaNotificationStorage'
import { NotificationConfig } from '@/core/notifications/NotificationConfig'
import { Audit } from '@/core/audit/services/AuditService'

import { ChecklistContextRegistry } from '@/core/checklist/registry/ChecklistContextRegistry'
import { PrismaChecklistRepository } from '@/infrastructure/persistence/repositories/PrismaChecklistRepository'
import { GeneratedDocumentChecklistAdapter } from '@/core/checklist/services/GeneratedDocumentChecklistAdapter'
import { GetChecklistStatusUseCase } from '@/core/checklist/usecases/GetChecklistStatusUseCase'
import { UpdateChecklistSubmissionUseCase } from '@/core/checklist/usecases/UpdateChecklistSubmissionUseCase'

import { ProjectChecklistResolver } from '@/modules/project-master/services/ProjectChecklistResolver'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { ProposalChecklistResolver } from '@/core/proposal/checklist/ProposalChecklistResolver'
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository'
import { ManualMilestoneService } from '@/core/workflow/services/ManualMilestoneService'
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
  manualMilestoneService: ManualMilestoneService | undefined
}

const nomineePoolRepository = new PrismaNomineePoolRepository()
const documentTemplateRepository = new PrismaDocumentTemplateRepository()
const documentInstanceRepository = new PrismaDocumentInstanceRepository()
const notificationStorage = new PrismaNotificationStorage()

// Initialize Global Configs
NotificationConfig.initialize(notificationStorage)

const checklistRegistry = globalForCoreDI.checklistRegistry ?? new ChecklistContextRegistry()

checklistRegistry.register('PROJECT_MASTER', new ProjectChecklistResolver(new PrismaProjectRepository()))
checklistRegistry.register(MODULE_CODES.LAND_SCHEDULE, new ProposalChecklistResolver(new PrismaAcqProposalRepository()))

const checklistRepository = new PrismaChecklistRepository()
const documentAdapter = new GeneratedDocumentChecklistAdapter(documentInstanceRepository, checklistRepository)

export const getNomineePoolsUseCase = globalForCoreDI.getNomineePoolsUseCase ?? new GetNomineePoolsUseCase(nomineePoolRepository)
export const getNomineePoolDetailUseCase = globalForCoreDI.getNomineePoolDetailUseCase ?? new GetNomineePoolDetailUseCase(nomineePoolRepository)

export const getChecklistStatusUseCase = globalForCoreDI.getChecklistStatusUseCase ?? new GetChecklistStatusUseCase(checklistRepository, checklistRegistry, documentAdapter)
export const updateChecklistSubmissionUseCase = globalForCoreDI.updateChecklistSubmissionUseCase ?? new UpdateChecklistSubmissionUseCase(checklistRepository, checklistRegistry)
export const manualMilestoneService = globalForCoreDI.manualMilestoneService ?? new ManualMilestoneService()

export const documentTemplateRepositoryExport = globalForCoreDI.documentTemplateRepository ?? documentTemplateRepository
export const documentInstanceRepositoryExport = globalForCoreDI.documentInstanceRepository ?? documentInstanceRepository

export const auditQueue = {
  push: (payload: any) => {
    const action = payload.event_type || payload.action || 'UNKNOWN'
    const entityInfo = payload.entity_name ? ` on ${payload.entity_name} (${payload.entity_id || 'unknown'})` : ''
    const remarks = payload.remarks ? ` | Remarks: ${payload.remarks}` : ''
    
    Audit.logCustomAction({
      activity: `[${action}]${entityInfo}${remarks}`,
      userId: payload.user_id || 'system'
    }).catch(console.error);
  }
}

import { processRegistry } from '@/core/workflow/ProcessRegistry'
import { processInstanceService } from '@/core/workflow/services/ProcessInstanceService'
import { workflowTaskService } from '@/core/workflow/services/WorkflowTaskService'
import { workflowBranchService } from '@/core/workflow/services/WorkflowBranchService'
import { workflowReactionService } from '@/core/workflow/services/WorkflowReactionService'

import { jobDispatcher as coreJobDispatcher } from '@/core/jobs/services/JobDispatcherService'

export const jobDispatcher = globalForCoreDI.jobDispatcher ?? coreJobDispatcher
export const Container = {
  jobDispatcher,
  checklistRegistry,
  getChecklistStatusUseCase,
  updateChecklistSubmissionUseCase,
  processRegistry,
  processInstanceService,
  workflowTaskService,
  workflowBranchService,
  workflowReactionService,
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
  globalForCoreDI.manualMilestoneService = manualMilestoneService
}
