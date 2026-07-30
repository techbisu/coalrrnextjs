// Proposal & Land Acquisition DI Module
// Registers all proposal-related use cases into the global container singleton.
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'

import { GetProposalsUseCase } from '@/application/use-cases/proposal/GetProposalsUseCase'
import { CreateProposalUseCase } from '@/application/use-cases/proposal/CreateProposalUseCase'
import { GetProposalDetailsUseCase } from '@/application/use-cases/proposal/GetProposalDetailsUseCase'
import { SubmitProposalUseCase } from '@/application/use-cases/proposal/SubmitProposalUseCase'
import { UpdateProposalUseCase } from '@/application/use-cases/proposal/UpdateProposalUseCase'
import { AddPlotsToProposalUseCase } from '@/application/use-cases/proposal/AddPlotsToProposalUseCase'
import { UpdatePlotUseCase } from '@/application/use-cases/proposal/UpdatePlotUseCase'
import { DeletePlotUseCase } from '@/application/use-cases/proposal/DeletePlotUseCase'

const globalForProposalDI = globalThis as unknown as {
  getProposalsUseCase: GetProposalsUseCase | undefined
  createProposalUseCase: CreateProposalUseCase | undefined
  getProposalDetailsUseCase: GetProposalDetailsUseCase | undefined
  submitProposalUseCase: SubmitProposalUseCase | undefined
  updateProposalUseCase: UpdateProposalUseCase | undefined
  addPlotsToProposalUseCase: AddPlotsToProposalUseCase | undefined
  updatePlotUseCase: UpdatePlotUseCase | undefined
  deletePlotUseCase: DeletePlotUseCase | undefined
}

export const acqProposalRepository = new PrismaAcqProposalRepository()
const projectRepository = new PrismaProjectRepository()

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
  new SubmitProposalUseCase(acqProposalRepository, projectRepository)

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

if (process.env.NODE_ENV !== 'production') {
  globalForProposalDI.getProposalsUseCase = getProposalsUseCase
  globalForProposalDI.createProposalUseCase = createProposalUseCase
  globalForProposalDI.getProposalDetailsUseCase = getProposalDetailsUseCase
  globalForProposalDI.submitProposalUseCase = submitProposalUseCase
  globalForProposalDI.updateProposalUseCase = updateProposalUseCase
  globalForProposalDI.addPlotsToProposalUseCase = addPlotsToProposalUseCase
  globalForProposalDI.updatePlotUseCase = updatePlotUseCase
  globalForProposalDI.deletePlotUseCase = deletePlotUseCase
}
