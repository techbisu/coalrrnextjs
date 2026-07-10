import { db } from '@/lib/db'
import { IPermission } from '@/core/authorization/types'
import { IPermissionRepository } from '@/core/authorization/interfaces/IPermissionRepository'

export class PrismaPermissionRepository implements IPermissionRepository {
  async findById(id: string): Promise<IPermission | null> {
    return db.permission.findUnique({ where: { id } })
  }

  async findByName(name: string, guard_name: string = 'web'): Promise<IPermission | null> {
    return db.permission.findUnique({ where: { name_guard_name: { name, guard_name } } })
  }

  async findAll(): Promise<IPermission[]> {
    return db.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    })
  }

  async create(data: Omit<IPermission, 'id' | 'entry_ts' | 'updt_ts'>): Promise<IPermission> {
    return db.permission.create({ data })
  }

  async update(id: string, data: Partial<Omit<IPermission, 'id' | 'entry_ts' | 'updt_ts'>>): Promise<IPermission> {
    return db.permission.update({ where: { id }, data })
  }

  async delete(id: string): Promise<IPermission> {
    return db.permission.delete({ where: { id } })
  }

  async findByUser(user_id: string): Promise<IPermission[]> {
    const userPerms = await db.model_has_permission.findMany({
      where: { model_id: user_id, model_type: 'user' },
      include: { permission: true }
    })
    return userPerms.map(up => up.permission)
  }

  async findPermissionsByNames(names: string[]): Promise<IPermission[]> {
    return db.permission.findMany({ where: { name: { in: names } } })
  }
}
