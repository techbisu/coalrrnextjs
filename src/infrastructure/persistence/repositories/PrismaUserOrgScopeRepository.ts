import { user_org_scope } from '@prisma/client';
import { db } from '@/lib/db';
import { IUserOrgScopeRepository } from '@/domain/interfaces/IUserOrgScopeRepository';

export class PrismaUserOrgScopeRepository implements IUserOrgScopeRepository {

  async createScope(data: Omit<user_org_scope, 'id' | 'created_at'>): Promise<user_org_scope> {
    const sanitizedData = {
      ...data,
      area_cd: data.area_cd && data.area_cd.trim() !== '' ? data.area_cd.trim() : null,
      mine_cd: data.mine_cd && data.mine_cd.trim() !== '' ? data.mine_cd.trim() : null,
      entry_ts: data.entry_ts ?? BigInt(Math.floor(Date.now() / 1000)),
      updt_ts: data.updt_ts ?? BigInt(Math.floor(Date.now() / 1000)),
    };
    try {
      return await db.user_org_scope.create({
        data: sanitizedData,
      });
    } catch (err: any) {
      if (err.message && (err.message.includes('mine_master') || err.message.includes('area_master') || err.message.includes('42P01'))) {
        try {
          // 1. Drop existing stale constraint(s) individually
          await db.$executeRawUnsafe(`ALTER TABLE public.user_org_scope DROP CONSTRAINT IF EXISTS user_org_scope_mine_cd_fkey`);
          await db.$executeRawUnsafe(`ALTER TABLE public.user_org_scope DROP CONSTRAINT IF EXISTS fk_user_org_scope_mine`);
          
          // 2. Query and drop ANY other foreign key on user_org_scope that points to mine_master
          try {
            const fkRows: any = await db.$queryRawUnsafe(`
              SELECT conname FROM pg_constraint 
              WHERE conrelid = 'public.user_org_scope'::regclass AND contype = 'f'
            `);
            if (Array.isArray(fkRows)) {
              for (const row of fkRows) {
                if (row?.conname && (String(row.conname).includes('mine') || String(row.conname).includes('master'))) {
                  await db.$executeRawUnsafe(`ALTER TABLE public.user_org_scope DROP CONSTRAINT IF EXISTS "${row.conname}"`);
                }
              }
            }
          } catch (_) {}

          // 3. Ensure master.mine compatibility view exists
          try {
            await db.$executeRawUnsafe(`CREATE OR REPLACE VIEW master.mine_master AS SELECT * FROM master.mine`);
          } catch (_) {}

          // 4. Add clean constraint pointing directly to master.mine
          try {
            await db.$executeRawUnsafe(`ALTER TABLE public.user_org_scope ADD CONSTRAINT user_org_scope_mine_cd_fkey FOREIGN KEY (mine_cd) REFERENCES master.mine(mine_cd) ON UPDATE CASCADE ON DELETE SET NULL`);
          } catch (_) {}

          return await db.user_org_scope.create({
            data: sanitizedData,
          });
        } catch (repairErr) {
          console.error('[PrismaUserOrgScopeRepository] Auto-repair constraint failed:', repairErr);
        }
      }
      throw err;
    }
  }

  async closeScope(scopeId: string, effectiveTo: Date): Promise<user_org_scope> {
    return db.user_org_scope.update({
      where: { id: scopeId },
      data: { effective_to: effectiveTo },
    });
  }

  async getActiveScopeByUserId(userId: string): Promise<user_org_scope | null> {
    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) return null;
    return db.user_org_scope.findFirst({
      where: {
        user_id: numericId,
        effective_to: null,
      },
    });
  }

  async getScopeHistory(userId: string): Promise<user_org_scope[]> {
    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) return [];
    return db.user_org_scope.findMany({
      where: { user_id: numericId },
      orderBy: { effective_from: 'desc' },
    });
  }
}
