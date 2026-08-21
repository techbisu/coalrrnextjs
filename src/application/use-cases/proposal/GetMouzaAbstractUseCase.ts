/**
 * Get Mouza Abstract Use Case - Calculates Mouza-wise plot count and land type acreage totals.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository'
import { MouzaAbstractResultDTO } from '@/domain/entities/proposal'

export interface GetMouzaAbstractRequest {
  proposalId: string
}

export type GetMouzaAbstractResponse = MouzaAbstractResultDTO

export class GetMouzaAbstractUseCase implements IUseCase<GetMouzaAbstractRequest, GetMouzaAbstractResponse> {
  constructor(
    private readonly proposalRepository: PrismaAcqProposalRepository
  ) {}

  async execute(request: GetMouzaAbstractRequest): Promise<Result<GetMouzaAbstractResponse>> {
    if (!request.proposalId) {
      return Fail('Proposal ID is required')
    }

    const data = await this.proposalRepository.getMouzaAbstract(request.proposalId)

    if (!data) {
      return Fail('Proposal not found')
    }

    return Ok(data)
  }
}
