import { PrismaClaimRepository } from '@/infrastructure/persistence/repositories/PrismaClaimRepository'
import { PrismaPlotRepository } from '@/infrastructure/persistence/repositories/PrismaPlotRepository'

import { GetClaimsUseCase } from '@/application/use-cases/land-acquisition/claims/GetClaimsUseCase'
import { SubmitClaimUseCase } from '@/application/use-cases/land-acquisition/claims/SubmitClaimUseCase'
import { UpdateDraftClaimUseCase } from '@/application/use-cases/land-acquisition/claims/UpdateDraftClaimUseCase'
import { GetPlotsUseCase } from '@/application/use-cases/land-acquisition/GetPlotsUseCase'

export const getClaimsUseCase = new GetClaimsUseCase(new PrismaClaimRepository())
export const submitClaimUseCase = new SubmitClaimUseCase(new PrismaClaimRepository(), new PrismaPlotRepository())
export const updateDraftClaimUseCase = new UpdateDraftClaimUseCase(new PrismaClaimRepository())
export const getPlotsUseCase = new GetPlotsUseCase(new PrismaPlotRepository())
