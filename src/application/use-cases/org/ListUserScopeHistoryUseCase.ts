import { IUseCase } from '@/core/interfaces/UseCase.interface';
import { Result } from '@/core/result/Result';
import { IUserOrgScopeRepository } from '@/domain/interfaces/IUserOrgScopeRepository';
import { user_org_scope } from '@prisma/client';

interface ListUserScopeHistoryDTO {
  userId: string;
}

export class ListUserScopeHistoryUseCase implements IUseCase<ListUserScopeHistoryDTO, user_org_scope[]> {
  constructor(private userOrgScopeRepository: IUserOrgScopeRepository) {}

  async execute(dto: ListUserScopeHistoryDTO): Promise<Result<user_org_scope[]>> {
    try {
      const history = await this.userOrgScopeRepository.getScopeHistory(dto.userId);
      return Result.ok(history);
    } catch (error: any) {
      return Result.fail(error.message || 'Failed to fetch user scope history');
    }
  }
}
