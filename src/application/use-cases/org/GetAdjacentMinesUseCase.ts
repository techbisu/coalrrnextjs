import { IUseCase } from '@/core/interfaces/UseCase.interface';
import { Result } from '@/core/result/Result';
import { IMineRepository } from '@/infrastructure/persistence/repositories/PrismaMineRepository';
import { mine_master } from '@prisma/client';

export class GetAdjacentMinesUseCase implements IUseCase<string, mine_master[]> {
  constructor(private mineRepository: IMineRepository) {}

  async execute(mineCd: string): Promise<Result<mine_master[]>> {
    try {
      const adjacent = await this.mineRepository.getAdjacentMines(mineCd);
      return Result.ok(adjacent);
    } catch (error: any) {
      return Result.fail(error.message || 'Failed to fetch adjacent mines');
    }
  }
}
