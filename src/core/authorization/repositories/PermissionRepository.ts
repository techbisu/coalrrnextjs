import { db } from '@/lib/db'
import { IPermission } from '../types'

export class PermissionRepository {
  static async findById(id: string) {
    return db.permission.findUnique({ where: { id } })
  }

  static async findByName(name: string, guardName: string = 'web') {
    return db.permission.findUnique({ where: { name_guardName: { name, guardName } } })
  }

  static async findAll() {
    return db.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    })
  }

  static async create(data: Omit<IPermission, 'id' | 'createdAt' | 'updatedAt'>) {
    return db.permission.create({ data })
  }

  static async update(id: string, data: Partial<Omit<IPermission, 'id' | 'createdAt' | 'updatedAt'>>) {
    return db.permission.update({ where: { id }, data })
  }

  static async delete(id: string) {
    return db.permission.delete({ where: { id } })
  }

  static async findByUser(userId: string) {
    const userPerms = await db.modelHasPermission.findMany({
      where: { modelId: userId, modelType: 'User' },
      include: { permission: true }
    })
    return userPerms.map(up => up.permission)
  }

  static async findByRole(roleId: string) {
    const rolePerms = await db.roleHasPermission.findMany({
      where: { roleId },
      include: { permission: true }
    })
    return rolePerms.map(rp => rp.permission)
  }
}
