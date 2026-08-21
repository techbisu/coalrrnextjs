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
import { PrismaEntityFlagRepository } from '@/core/flags/infrastructure/persistence/PrismaEntityFlagRepository'
import { EntityFlagService } from '@/core/flags/services/EntityFlagService'
import { FactResolver } from '@/core/flags/services/FactResolver'
import { AcqLandScheduleFactAdapter } from '@/core/flags/adapters/AcqLandScheduleFactAdapter'
import { ProjectFactAdapter } from '@/core/flags/adapters/ProjectFactAdapter'
import { ConditionContextBuilder } from '@/core/flags/services/ConditionContextBuilder'

import { PrismaWorkflowStateRepository } from '@/infrastructure/persistence/repositories/PrismaWorkflowStateRepository'
import { DocumentSignatureRequirementResolver } from '@/core/document-requirement/DocumentSignatureRequirementResolver'

import { processRegistry } from '@/core/workflow/ProcessRegistry'
import { processInstanceService } from '@/core/workflow/services/ProcessInstanceService'
import { workflowTaskService } from '@/core/workflow/services/WorkflowTaskService'
import { workflowBranchService } from '@/core/workflow/services/WorkflowBranchService'
import { workflowReactionService } from '@/core/workflow/services/WorkflowReactionService'
import { jobDispatcher as coreJobDispatcher } from '@/core/jobs/services/JobDispatcherService'

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
  workflowStateRepository: PrismaWorkflowStateRepository | undefined
  documentSignatureRequirementResolver: DocumentSignatureRequirementResolver | undefined
}

const nomineePoolRepository = new PrismaNomineePoolRepository()
const documentTemplateRepository = new PrismaDocumentTemplateRepository()
const documentInstanceRepository = new PrismaDocumentInstanceRepository()
const notificationStorage = new PrismaNotificationStorage()
const workflowStateRepository = globalForCoreDI.workflowStateRepository ?? new PrismaWorkflowStateRepository()

// Initialize Global Configs
NotificationConfig.initialize(notificationStorage)

export const entityFlagRepository = new PrismaEntityFlagRepository()
export const entityFlagService = new EntityFlagService(entityFlagRepository)

export const factResolver = new FactResolver(entityFlagRepository)
factResolver.registerAdapter(new AcqLandScheduleFactAdapter())
factResolver.registerAdapter(new ProjectFactAdapter())

export const conditionContextBuilder = new ConditionContextBuilder(factResolver)

const checklistRegistry = globalForCoreDI.checklistRegistry ?? new ChecklistContextRegistry()

checklistRegistry.register('PROJECT_MASTER', new ProjectChecklistResolver(new PrismaProjectRepository()))
checklistRegistry.register(MODULE_CODES.LAND_SCHEDULE, new ProposalChecklistResolver(new PrismaAcqProposalRepository(), conditionContextBuilder))

const checklistRepository = new PrismaChecklistRepository()
const documentAdapter = new GeneratedDocumentChecklistAdapter(documentInstanceRepository, checklistRepository)

// DocumentSignatureRequirementResolver — injected with the template repository, not using global db
const documentSignatureRequirementResolver = globalForCoreDI.documentSignatureRequirementResolver ?? new DocumentSignatureRequirementResolver(documentTemplateRepository)

export const getNomineePoolsUseCase = globalForCoreDI.getNomineePoolsUseCase ?? new GetNomineePoolsUseCase(nomineePoolRepository)
export const getNomineePoolDetailUseCase = globalForCoreDI.getNomineePoolDetailUseCase ?? new GetNomineePoolDetailUseCase(nomineePoolRepository)

export const getChecklistStatusUseCase = globalForCoreDI.getChecklistStatusUseCase ?? new GetChecklistStatusUseCase(checklistRepository, checklistRegistry, documentAdapter, workflowStateRepository)
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
  entityFlagRepository,
  entityFlagService,
  factResolver,
  conditionContextBuilder,
  auditQueue,
  /** Repositories — inject into services instead of using db directly */
  documentInstanceRepository,
  documentTemplateRepository,
  workflowStateRepository,
  documentSignatureRequirementResolver,
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
  globalForCoreDI.workflowStateRepository = workflowStateRepository
  globalForCoreDI.documentSignatureRequirementResolver = documentSignatureRequirementResolver
}
