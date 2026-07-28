import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { AdminUser, AdminUserProps } from '../../domain/entities/AdminUser'
import { db } from '@/lib/db'

export class PrismaAdminUserRepository implements IAdminUserRepository {
  private mapToDomain(record: any): AdminUser {
    let roleStr: string | undefined
    if (record.userRoles && Array.isArray(record.userRoles) && record.userRoles.length > 0) {
      roleStr = record.userRoles.map((ur: any) => ur.role?.display_name || ur.role?.name).join(', ')
    }

    return AdminUser.reconstitute({
      id: record.id,
      tenantId: record.tenant_id,
      tenantName: record.tenant?.tenantName || null,
      name: record.name,
      email: record.email,
      mobile: record.mobile,
      designation: record.designation,
      passwordHash: record.password_hash,
      aadhaarHash: record.aadhaar_hash,
      verifiedAt: record.verified_at,
      isActive: record.is_active,
      isOnline: record.auth_session ? record.auth_session.length > 0 : false,
      entryBy: record.entry_by,
      updtBy: record.updt_by,
      entryTs: record.entry_ts,
      updtTs: record.updt_ts,
      role: roleStr,
      scope: record.user_org_scopes?.[0] ? {
        scopeLevel: record.user_org_scopes[0].scope_level,
        areaCd: record.user_org_scopes[0].area_cd,
        mineCd: record.user_org_scopes[0].mine_cd,
      } : undefined
    })
  }

  async findAll(): Promise<AdminUser[]> {
    const users = await db.user.findMany({ 
      orderBy: { entry_ts: 'desc' },
      include: {
        auth_session: {
          where: { expires_at: { gt: new Date() } },
          select: { id: true }
        },
        tenant: true,
        user_org_scopes: {
          where: { effective_to: null },
          take: 1
        }
      }
    })

    const roles = await db.model_has_role.findMany({
      where: { model_id: { in: users.map(u => u.id.toString()) }, model_type: 'user' },
      include: { role: true }
    })

    return users.map(u => {
      const userRoles = roles.filter(r => r.model_id === u.id.toString())
      return this.mapToDomain({ ...u, userRoles })
    })
  }

  async findPaginated(params: { page: number, limit: number, search?: string, status?: 'verified' | 'unverified' }): Promise<{ data: AdminUser[], total: number, unverifiedCount: number }> {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'verified') {
      where.verified_at = { not: null };
    } else if (status === 'unverified') {
      where.verified_at = null;
    }

    const [users, total, unverifiedCount] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { entry_ts: 'desc' },
        include: {
          auth_session: {
            where: { expires_at: { gt: new Date() } },
            select: { id: true }
          },
          tenant: true,
          user_org_scopes: {
            where: { effective_to: null },
            take: 1
          }
        }
      }),
      db.user.count({ where }),
      db.user.count({ where: { verified_at: null } })
    ]);

    const roles = await db.model_has_role.findMany({
      where: { model_id: { in: users.map(u => u.id.toString()) }, model_type: 'user' },
      include: { role: true }
    })

    return {
      data: users.map(u => {
        const userRoles = roles.filter(r => r.model_id === u.id.toString())
        return this.mapToDomain({ ...u, userRoles })
      }),
      total,
      unverifiedCount
    };
  }
  
  async findById(id: string | number): Promise<AdminUser | null> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) return null;
    const userRecord = await db.user.findUnique({ 
      where: { id: numericId },
      include: {
        auth_session: {
          where: { expires_at: { gt: new Date() } },
          select: { id: true }
        },
        tenant: true,
        user_org_scopes: {
          where: { effective_to: null },
          take: 1
        }
      }
    })

    if (!userRecord) return null

    const roles = await db.model_has_role.findMany({
      where: { model_id: userRecord.id.toString(), model_type: 'user' },
      include: { role: true }
    })

    return this.mapToDomain({ ...userRecord, userRoles: roles })
  }
  
  async create(user: AdminUser): Promise<AdminUser> {
    const persistenceData = user.toPersistence()
    const dbUser = await db.user.create({ data: persistenceData as any })
    return this.mapToDomain(dbUser)
  }
  
  async update(user: AdminUser): Promise<AdminUser> {
    const persistenceData = user.toPersistence()
    const dbUser = await db.user.update({ 
      where: { id: persistenceData.id }, 
      data: persistenceData as any 
    })
    return this.mapToDomain(dbUser)
  }
  
  async delete(id: string | number): Promise<void> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) throw new Error('Invalid user ID');
    await db.user.delete({ where: { id: numericId } })
  }
}
