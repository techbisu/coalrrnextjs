import { IUseCase } from '@/core/interfaces/UseCase.interface';
import { Result } from '@/core/result/Result';
import { IMineRepository } from '@/infrastructure/persistence/repositories/PrismaMineRepository';

interface UpdateMineAdjacencyDTO {
  mineCd: string;
  adjacentMineIds: string[];
}

export class UpdateMineAdjacencyUseCase implements IUseCase<UpdateMineAdjacencyDTO, void> {
  constructor(private mineRepository: IMineRepository) {}

  async execute(dto: UpdateMineAdjacencyDTO): Promise<Result<void>> {
    try {
      await this.mineRepository.updateAdjacency(dto.mineCd, dto.adjacentMineIds);
      return Result.ok(undefined);
    } catch (error: any) {
      return Result.fail(error.message || 'Failed to update mine adjacency');
    }
  }
}
