import { IUseCase } from '@/core/interfaces/UseCase.interface';
import { Result } from '@/core/result/Result';
import { IUserOrgScopeRepository } from '@/domain/interfaces/IUserOrgScopeRepository';
import { ScopeLevel, user_org_scope } from '@prisma/client';

interface TransferUserDTO {
  userId: string;
  newScopeLevel: ScopeLevel;
  newAreaCd?: string;
  newMineCd?: string;
  transferOrderNo: string;
  effectiveFrom: Date; // Can be immediate or future
  assignerId: string;
}

export class TransferUserUseCase implements IUseCase<TransferUserDTO, user_org_scope> {
  constructor(private userOrgScopeRepository: IUserOrgScopeRepository) {}

  async execute(dto: TransferUserDTO): Promise<Result<user_org_scope>> {
    try {
      if (dto.newScopeLevel === 'AREA' && !dto.newAreaCd) {
        return Result.fail('Area Code is required for AREA scope');
      }
      if (dto.newScopeLevel === 'UNIT' && (!dto.newAreaCd || !dto.newMineCd)) {
        return Result.fail('Area Code and Mine Code are required for UNIT scope');
      }
      if (!dto.transferOrderNo) {
        return Result.fail('Transfer order number is required');
      }

      // Close current scope as of the new effectiveFrom date
      const currentScope = await this.userOrgScopeRepository.getActiveScopeByUserId(dto.userId);
      if (currentScope) {
        await this.userOrgScopeRepository.closeScope(currentScope.id, dto.effectiveFrom);
      }

      // Reassignment happens immediately (or at effectiveFrom) with the transfer order attached
      const newScope = await this.userOrgScopeRepository.createScope({
        user_id: dto.userId,
        scope_level: dto.newScopeLevel,
        area_cd: dto.newScopeLevel === 'HQ' ? null : dto.newAreaCd!,
        mine_cd: dto.newScopeLevel === 'UNIT' ? dto.newMineCd! : null,
        effective_from: dto.effectiveFrom,
        effective_to: null,
        transfer_order_no: dto.transferOrderNo,
        created_by: dto.assignerId
      });

      return Result.ok(newScope);
    } catch (error: any) {
      return Result.fail(error.message || 'Failed to transfer user');
    }
  }
}
