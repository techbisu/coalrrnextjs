// Proposal & Land Acquisition DI Module
// Registers all proposal-related use cases into the global container singleton.
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository'
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
import { ProposalWorkflowService } from '@/modules/proposal/services/ProposalWorkflowService'
import { ProposalDocumentPackageService } from '@/modules/proposal/services/ProposalDocumentPackageService'

const globalForProposalDI = globalThis as unknown as {
  getProposalsUseCase: GetProposalsUseCase | undefined
  createProposalUseCase: CreateProposalUseCase | undefined
  getProposalDetailsUseCase: GetProposalDetailsUseCase | undefined
  submitProposalUseCase: SubmitProposalUseCase | undefined
  updateProposalUseCase: UpdateProposalUseCase | undefined
  addPlotsToProposalUseCase: AddPlotsToProposalUseCase | undefined
  updatePlotUseCase: UpdatePlotUseCase | undefined
  deletePlotUseCase: DeletePlotUseCase | undefined
  approveBoardDeviationUseCase: ApproveBoardDeviationUseCase | undefined
  proposalWorkflowService: ProposalWorkflowService | undefined
  proposalDocumentPackageService: ProposalDocumentPackageService | undefined
}

export const acqProposalRepository = new PrismaAcqProposalRepository()
const projectRepository = new PrismaProjectRepository()
const projectLimitService = new ProjectLimitService()

// Checklist dependencies for SubmitProposalUseCase gate
const proposalChecklistRegistry = new ChecklistContextRegistry()
proposalChecklistRegistry.register('LAND_ACQ_PROPOSAL', new ProposalChecklistResolver(acqProposalRepository))
const checklistRepo = new PrismaChecklistRepository()
const documentInstanceRepository = new PrismaDocumentInstanceRepository()
const documentAdapter = new GeneratedDocumentChecklistAdapter(documentInstanceRepository, checklistRepo)
const proposalChecklistStatusUseCase = new GetChecklistStatusUseCase(checklistRepo, proposalChecklistRegistry, documentAdapter)

export const getProposalsUseCase =
  globalForProposalDI.getProposalsUseCase ??
  new GetProposalsUseCase(acqProposalRepository, projectRepository)

export const createProposalUseCase =
  globalForProposalDI.createProposalUseCase ??
  new CreateProposalUseCase(acqProposalRepository, projectRepository)

export const getProposalDetailsUseCase =
  globalForProposalDI.getProposalDetailsUseCase ??
  new GetProposalDetailsUseCase(acqProposalRepository)

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

export const proposalWorkflowService =
  globalForProposalDI.proposalWorkflowService ??
  new ProposalWorkflowService(acqProposalRepository)

export const proposalDocumentPackageService =
  globalForProposalDI.proposalDocumentPackageService ??
  new ProposalDocumentPackageService()

if (process.env.NODE_ENV !== 'production') {
  globalForProposalDI.getProposalsUseCase = getProposalsUseCase
  globalForProposalDI.createProposalUseCase = createProposalUseCase
  globalForProposalDI.getProposalDetailsUseCase = getProposalDetailsUseCase
  globalForProposalDI.submitProposalUseCase = submitProposalUseCase
  globalForProposalDI.updateProposalUseCase = updateProposalUseCase
  globalForProposalDI.addPlotsToProposalUseCase = addPlotsToProposalUseCase
  globalForProposalDI.updatePlotUseCase = updatePlotUseCase
  globalForProposalDI.deletePlotUseCase = deletePlotUseCase
  globalForProposalDI.approveBoardDeviationUseCase = approveBoardDeviationUseCase
  globalForProposalDI.proposalWorkflowService = proposalWorkflowService
  globalForProposalDI.proposalDocumentPackageService = proposalDocumentPackageService
}
