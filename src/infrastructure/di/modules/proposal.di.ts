// Proposal & Land Acquisition DI Module
// Registers all proposal-related use cases into the global container singleton.
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository'
import { MODULE_CODES, resolveWorkflowCode } from '@/core/config/module-codes.config'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { ProjectLimitService } from '@/core/compliance/services/ProjectLimitService'

import { GetProposalsUseCase } from '@/application/use-cases/proposal/GetProposalsUseCase'
import { CreateProposalUseCase } from '@/application/use-cases/proposal/CreateProposalUseCase'
import { GetProposalDetailsUseCase } from '@/application/use-cases/proposal/GetProposalDetailsUseCase'
import { SubmitProposalUseCase } from '@/application/use-cases/proposal/SubmitProposalUseCase'
import { GetChecklistStatusUseCase } from '@/core/checklist/usecases/GetChecklistStatusUseCase'
import { ChecklistContextRegistry } from '@/core/checklist/registry/ChecklistContextRegistry'
import { PrismaChecklistRepository } from '@/infrastructure/persistence/repositories/PrismaChecklistRepository'
import { ProposalChecklistResolver } from '@/core/proposal/checklist/ProposalChecklistResolver'
import { GeneratedDocumentChecklistAdapter } from '@/core/checklist/services/GeneratedDocumentChecklistAdapter'
import { PrismaDocumentInstanceRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentInstanceRepository'
import { UpdateProposalUseCase } from '@/application/use-cases/proposal/UpdateProposalUseCase'
import { AddPlotsToProposalUseCase } from '@/application/use-cases/proposal/AddPlotsToProposalUseCase'
import { UpdatePlotUseCase } from '@/application/use-cases/proposal/UpdatePlotUseCase'
import { DeletePlotUseCase } from '@/application/use-cases/proposal/DeletePlotUseCase'
import { ApproveBoardDeviationUseCase } from '@/application/use-cases/proposal/ApproveBoardDeviationUseCase'
import { GetMouzaAbstractUseCase } from '@/application/use-cases/proposal/GetMouzaAbstractUseCase'
import { UpdateProposalCostSheetUseCase } from '@/application/use-cases/proposal/UpdateProposalCostSheetUseCase'
import { ProposalDocumentPackageService } from '@/modules/proposal/services/ProposalDocumentPackageService'

const globalForProposalDI = globalThis as unknown as {
  getProposalsUseCase: GetProposalsUseCase | undefined
  createProposalUseCase: CreateProposalUseCase | undefined
  getProposalDetailsUseCase: GetProposalDetailsUseCase | undefined
  getMouzaAbstractUseCase: GetMouzaAbstractUseCase | undefined
  updateProposalCostSheetUseCase: UpdateProposalCostSheetUseCase | undefined
  submitProposalUseCase: SubmitProposalUseCase | undefined
  updateProposalUseCase: UpdateProposalUseCase | undefined
  addPlotsToProposalUseCase: AddPlotsToProposalUseCase | undefined
  updatePlotUseCase: UpdatePlotUseCase | undefined
  deletePlotUseCase: DeletePlotUseCase | undefined
  approveBoardDeviationUseCase: ApproveBoardDeviationUseCase | undefined
  proposalDocumentPackageService: ProposalDocumentPackageService | undefined
}

export const acqProposalRepository = new PrismaAcqProposalRepository()
const projectRepository = new PrismaProjectRepository()
const projectLimitService = new ProjectLimitService()

import { processRegistry } from '@/core/workflow/ProcessRegistry'
import { GUARD_REGISTRY } from '@/core/workflow/guards'

// Checklist dependencies for SubmitProposalUseCase gate
const proposalChecklistRegistry = new ChecklistContextRegistry()
proposalChecklistRegistry.register(MODULE_CODES.LAND_SCHEDULE, new ProposalChecklistResolver(acqProposalRepository))
const checklistRepo = new PrismaChecklistRepository()
const documentInstanceRepository = new PrismaDocumentInstanceRepository()
const documentAdapter = new GeneratedDocumentChecklistAdapter(documentInstanceRepository, checklistRepo)
const proposalChecklistStatusUseCase = new GetChecklistStatusUseCase(checklistRepo, proposalChecklistRegistry, documentAdapter)

import { workflowTargetResolverRegistry } from '@/core/workflow/resolvers/WorkflowTargetResolverRegistry'
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'
import { db } from '@/lib/db'

// Register Module Target Resolvers in Core Registry
workflowTargetResolverRegistry.registerResolver({
  canResolve: (moduleCode, entityType) =>
    entityType === CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE || moduleCode === MODULE_CODES.LAND_SCHEDULE,
  resolveEntityStatus: async (_moduleCode, _entityType, entityId) => {
    const schedule = await db.acq_proposal.findUnique({
      where: { proposal_id: entityId },
      select: { current_stage_cd: true, overall_status: true, proposal_no: true, acq_mode_id: true },
    })
    if (!schedule) return null
    return {
      currentStateCode: schedule.current_stage_cd || schedule.overall_status || 'Drafting',
      workflowCode: resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, schedule.acq_mode_id ? Number(schedule.acq_mode_id) : undefined),
      title: schedule.proposal_no || `Proposal:${entityId}`,
    }
  },
})

workflowTargetResolverRegistry.registerResolver({
  canResolve: (moduleCode, entityType) =>
    entityType === CHECKABLE_ENTITY_TYPES.COMPENSATION_PAYROLL || moduleCode === MODULE_CODES.COMPENSATION_PAYROLL,
  resolveEntityStatus: async (_moduleCode, _entityType, entityId) => {
    const payroll = await (db as any).compensation_payroll?.findUnique({
      where: { payroll_id: entityId },
      select: { status: true, payroll_no: true },
    })
    if (!payroll) return null
    return {
      currentStateCode: payroll.status || 'Drafting',
      workflowCode: MODULE_CODES.COMPENSATION_PAYROLL,
      title: payroll.payroll_no || `Payroll:${entityId}`,
    }
  },
})

// Register LAND_ACQ_PROPOSAL in Generic Process Platform Registry
processRegistry.register({
  moduleCode: MODULE_CODES.LAND_SCHEDULE,
  processCode: MODULE_CODES.LAND_SCHEDULE,
  name: 'Land Acquisition Proposal Process',
  checklistResolver: new ProposalChecklistResolver(acqProposalRepository),
  guards: GUARD_REGISTRY,
  defaultWorkflowCode: MODULE_CODES.COMPENSATION_PAYROLL,
})

export const getProposalsUseCase =
  globalForProposalDI.getProposalsUseCase ??
  new GetProposalsUseCase(acqProposalRepository, projectRepository)

export const createProposalUseCase =
  globalForProposalDI.createProposalUseCase ??
  new CreateProposalUseCase(acqProposalRepository, projectRepository)

export const getProposalDetailsUseCase =
  globalForProposalDI.getProposalDetailsUseCase ??
  new GetProposalDetailsUseCase(acqProposalRepository)

export const getMouzaAbstractUseCase =
  globalForProposalDI.getMouzaAbstractUseCase ??
  new GetMouzaAbstractUseCase(acqProposalRepository)

export const submitProposalUseCase =
  globalForProposalDI.submitProposalUseCase ??
  new SubmitProposalUseCase(acqProposalRepository, projectRepository, projectLimitService, proposalChecklistStatusUseCase)

export const updateProposalUseCase =
  globalForProposalDI.updateProposalUseCase ??
  new UpdateProposalUseCase(acqProposalRepository)

export const addPlotsToProposalUseCase =
  globalForProposalDI.addPlotsToProposalUseCase ??
  new AddPlotsToProposalUseCase(acqProposalRepository)

export const updatePlotUseCase =
  globalForProposalDI.updatePlotUseCase ??
  new UpdatePlotUseCase(acqProposalRepository)

export const deletePlotUseCase =
  globalForProposalDI.deletePlotUseCase ??
  new DeletePlotUseCase(acqProposalRepository)

export const approveBoardDeviationUseCase =
  globalForProposalDI.approveBoardDeviationUseCase ??
  new ApproveBoardDeviationUseCase(acqProposalRepository, projectRepository)

export const updateProposalCostSheetUseCase =
  globalForProposalDI.updateProposalCostSheetUseCase ??
  new UpdateProposalCostSheetUseCase(acqProposalRepository)

export const proposalDocumentPackageService =
  globalForProposalDI.proposalDocumentPackageService ??
  new ProposalDocumentPackageService()

if (process.env.NODE_ENV !== 'production') {
  globalForProposalDI.getProposalsUseCase = getProposalsUseCase
  globalForProposalDI.createProposalUseCase = createProposalUseCase
  globalForProposalDI.getProposalDetailsUseCase = getProposalDetailsUseCase
  globalForProposalDI.getMouzaAbstractUseCase = getMouzaAbstractUseCase
  globalForProposalDI.updateProposalCostSheetUseCase = updateProposalCostSheetUseCase
  globalForProposalDI.submitProposalUseCase = submitProposalUseCase
  globalForProposalDI.updateProposalUseCase = updateProposalUseCase
  globalForProposalDI.addPlotsToProposalUseCase = addPlotsToProposalUseCase
  globalForProposalDI.updatePlotUseCase = updatePlotUseCase
  globalForProposalDI.deletePlotUseCase = deletePlotUseCase
  globalForProposalDI.approveBoardDeviationUseCase = approveBoardDeviationUseCase
  globalForProposalDI.proposalDocumentPackageService = proposalDocumentPackageService
}
