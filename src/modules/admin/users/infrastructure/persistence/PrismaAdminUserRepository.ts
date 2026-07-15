import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { user } from '@prisma/client'
import { db } from '@/lib/db'

export class PrismaAdminUserRepository implements IAdminUserRepository {
  async findAll(): Promise<user[]> {
    return await db.user.findMany({ orderBy: { entry_ts: 'desc' } })
  }
  
  async findById(id: string): Promise<user | null> {
    return await db.user.findUnique({ where: { id } })
  }
  
  async create(data: Omit<user, 'id' | 'entry_ts' | 'updt_ts'>): Promise<user> {
    return await db.user.create({ data })
  }
  
  async update(id: string, data: Partial<user>): Promise<user> {
    return await db.user.update({ where: { id }, data })
  }
  
  async delete(id: string): Promise<void> {
    await db.user.delete({ where: { id } })
  }
}
