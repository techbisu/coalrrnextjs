import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { AdminUser, AdminUserProps } from '../../domain/entities/AdminUser'
import { db } from '@/lib/db'

export class PrismaAdminUserRepository implements IAdminUserRepository {
  private mapToDomain(dbUser: any): AdminUser {
    return AdminUser.reconstitute({
      id: dbUser.id,
      portal: dbUser.portal,
      role: dbUser.role,
      name: dbUser.name,
      email: dbUser.email,
      mobile: dbUser.mobile,
      designation: dbUser.designation,
      mineCd: dbUser.mine_cd,
      passwordHash: dbUser.password_hash,
      aadhaarHash: dbUser.aadhaar_hash,
      plotId: dbUser.plot_id,
      verifiedAt: dbUser.verified_at,
      isActive: dbUser.is_active,
      entryBy: dbUser.entry_by,
      updtBy: dbUser.updt_by,
      entryTs: dbUser.entry_ts,
      updtTs: dbUser.updt_ts,
    })
  }

  async findAll(): Promise<AdminUser[]> {
    const users = await db.user.findMany({ orderBy: { entry_ts: 'desc' } })
    return users.map(u => this.mapToDomain(u))
  }
  
  async findById(id: string | number): Promise<AdminUser | null> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) return null;
    const user = await db.user.findUnique({ where: { id: numericId } })
    return user ? this.mapToDomain(user) : null
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
