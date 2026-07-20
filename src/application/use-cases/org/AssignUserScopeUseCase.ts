import { IUseCase } from '@/core/interfaces/UseCase.interface';
import { Result } from '@/core/result/Result';
import { IUserOrgScopeRepository } from '@/domain/interfaces/IUserOrgScopeRepository';
import { ScopeLevel, user_org_scope } from '@prisma/client';
import { randomUUID } from 'crypto';

interface AssignUserScopeDTO {
  userId: string;
  scopeLevel: ScopeLevel;
  areaCd?: string;
  mineCd?: string;
  assignerId: string;
}

export class AssignUserScopeUseCase implements IUseCase<AssignUserScopeDTO, user_org_scope> {
  constructor(private userOrgScopeRepository: IUserOrgScopeRepository) {}

  async execute(dto: AssignUserScopeDTO): Promise<Result<user_org_scope>> {
    try {
      // Basic validation
      if (dto.scopeLevel === 'AREA' && !dto.areaCd) {
        return Result.fail('Area Code is required for AREA scope');
      }
      if (dto.scopeLevel === 'UNIT' && (!dto.areaCd || !dto.mineCd)) {
        return Result.fail('Area Code and Mine Code are required for UNIT scope');
      }

      // Find current active scope and close it
      const currentScope = await this.userOrgScopeRepository.getActiveScopeByUserId(dto.userId);
      if (currentScope) {
        await this.userOrgScopeRepository.closeScope(currentScope.id, new Date());
      }

      // Create new active scope
      const newScope = await this.userOrgScopeRepository.createScope({
        user_id: dto.userId,
        scope_level: dto.scopeLevel,
        area_cd: dto.scopeLevel === 'HQ' ? null : dto.areaCd!,
        mine_cd: dto.scopeLevel === 'UNIT' ? dto.mineCd! : null,
        effective_from: new Date(),
        effective_to: null,
        transfer_order_no: null,
        created_by: dto.assignerId
      });

      return Result.ok(newScope);
    } catch (error: any) {
      return Result.fail(error.message || 'Failed to assign user scope');
    }
  }
}
