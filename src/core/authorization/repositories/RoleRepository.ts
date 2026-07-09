import { db } from '@/lib/db'
import { IRole } from '../types'

export class RoleRepository {
  static async findById(id: string) {
    return db.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } } } })
  }

  static async findByName(name: string, guardName: string = 'web') {
    return db.role.findUnique({ where: { name_guardName: { name, guardName } } })
  }

  static async findAll() {
    return db.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { users: true, permissions: true } } }
    })
  }

  static async create(data: Omit<IRole, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>) {
    return db.role.create({ data })
  }

  static async update(id: string, data: Partial<Omit<IRole, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>>) {
    return db.role.update({ where: { id }, data })
  }

  static async delete(id: string) {
    return db.role.delete({ where: { id } })
  }

  static async findByUser(userId: string) {
    const userRoles = await db.modelHasRole.findMany({
      where: { modelId: userId, modelType: 'User' },
      include: { role: true }
    })
    return userRoles.map(ur => ur.role)
  }
}
