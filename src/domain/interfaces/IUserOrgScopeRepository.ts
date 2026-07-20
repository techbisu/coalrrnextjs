import { user_org_scope } from '@prisma/client';

export interface IUserOrgScopeRepository {
  createScope(data: Omit<user_org_scope, 'id' | 'created_at'>): Promise<user_org_scope>;
  closeScope(scopeId: string, effectiveTo: Date): Promise<user_org_scope>;
  getActiveScopeByUserId(userId: string): Promise<user_org_scope | null>;
  getScopeHistory(userId: string): Promise<user_org_scope[]>;
}
