import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { user } from '@prisma/client'
import { db } from '@/lib/db'

export class PrismaAdminUserRepository implements IAdminUserRepository {
  async findAll(): Promise<user[]> {
    return await db.user.findMany({ orderBy: { entry_ts: 'desc' } })
  }
  
  async findById(id: string): Promise<user | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;
    return await db.user.findUnique({ where: { id: numericId } })
  }
  
  async create(data: Omit<user, 'id' | 'entry_ts' | 'updt_ts'>): Promise<user> {
    return await db.user.create({ data })
  }
  
  async update(id: string, data: Partial<user>): Promise<user> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new Error('Invalid user ID');
    return await db.user.update({ where: { id: numericId }, data })
  }
  
  async delete(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new Error('Invalid user ID');
    await db.user.delete({ where: { id: numericId } })
  }
}
