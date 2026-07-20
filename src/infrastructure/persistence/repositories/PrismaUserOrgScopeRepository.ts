import { user_org_scope } from '@prisma/client';
import { db } from '@/lib/db';
import { IUserOrgScopeRepository } from '../../domain/interfaces/IUserOrgScopeRepository';

export class PrismaUserOrgScopeRepository implements IUserOrgScopeRepository {

  async createScope(data: Omit<user_org_scope, 'id' | 'created_at'>): Promise<user_org_scope> {
    return db.user_org_scope.create({
      data,
    });
  }

  async closeScope(scopeId: string, effectiveTo: Date): Promise<user_org_scope> {
    return db.user_org_scope.update({
      where: { id: scopeId },
      data: { effective_to: effectiveTo },
    });
  }

  async getActiveScopeByUserId(userId: string): Promise<user_org_scope | null> {
    return db.user_org_scope.findFirst({
      where: {
        user_id: userId,
        effective_to: null,
      },
    });
  }

  async getScopeHistory(userId: string): Promise<user_org_scope[]> {
    return db.user_org_scope.findMany({
      where: { user_id: userId },
      orderBy: { effective_from: 'desc' },
    });
  }
}
