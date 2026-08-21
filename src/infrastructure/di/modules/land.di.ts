import { PrismaClaimRepository } from '@/infrastructure/persistence/repositories/PrismaClaimRepository'
import { PrismaPlotRepository } from '@/infrastructure/persistence/repositories/PrismaPlotRepository'

import { GetClaimsUseCase } from '@/application/use-cases/land-acquisition/claims/GetClaimsUseCase'
import { SubmitClaimUseCase } from '@/application/use-cases/land-acquisition/claims/SubmitClaimUseCase'
import { UpdateDraftClaimUseCase } from '@/application/use-cases/land-acquisition/claims/UpdateDraftClaimUseCase'
import { GetPlotsUseCase } from '@/application/use-cases/land-acquisition/GetPlotsUseCase'
import { PlotSchedulePrerequisitePlugin } from '@/modules/land-acquisition/plugins/PlotSchedulePrerequisitePlugin'
import { entityPrerequisiteRegistry } from '@/core/workflow/plugins/EntityPrerequisiteRegistry'

const globalForLandDI = globalThis as unknown as {
  getClaimsUseCase: GetClaimsUseCase | undefined
  submitClaimUseCase: SubmitClaimUseCase | undefined
  updateDraftClaimUseCase: UpdateDraftClaimUseCase | undefined
  getPlotsUseCase: GetPlotsUseCase | undefined
  plotPrerequisiteRegistered: boolean | undefined
}

const claimRepository = new PrismaClaimRepository()
const plotRepository = new PrismaPlotRepository()

export const getClaimsUseCase = globalForLandDI.getClaimsUseCase ?? new GetClaimsUseCase(claimRepository)
export const submitClaimUseCase = globalForLandDI.submitClaimUseCase ?? new SubmitClaimUseCase(claimRepository, plotRepository)
export const updateDraftClaimUseCase = globalForLandDI.updateDraftClaimUseCase ?? new UpdateDraftClaimUseCase(claimRepository)
export const getPlotsUseCase = globalForLandDI.getPlotsUseCase ?? new GetPlotsUseCase(plotRepository)

// Register the Land Acquisition prerequisite plugin once at startup.
// This is the ONLY place where module-specific prerequisite logic is connected to the core.
if (!globalForLandDI.plotPrerequisiteRegistered) {
  entityPrerequisiteRegistry.register(new PlotSchedulePrerequisitePlugin(plotRepository))
  globalForLandDI.plotPrerequisiteRegistered = true
}

if (process.env.NODE_ENV !== 'production') {
  globalForLandDI.getClaimsUseCase = getClaimsUseCase
  globalForLandDI.submitClaimUseCase = submitClaimUseCase
  globalForLandDI.updateDraftClaimUseCase = updateDraftClaimUseCase
  globalForLandDI.getPlotsUseCase = getPlotsUseCase
}
