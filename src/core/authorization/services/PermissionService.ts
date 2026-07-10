import { IPermissionRepository } from '../interfaces/IPermissionRepository'

export class PermissionService {
  constructor(private permissionRepo: IPermissionRepository) {}

  async create(data: any) {
    return this.permissionRepo.create(data)
  }

  async update(id: string, data: any) {
    const perm = await this.permissionRepo.findById(id)
    if (!perm) throw new Error('permission not found')
    return this.permissionRepo.update(id, data)
  }

  async delete(id: string) {
    return this.permissionRepo.delete(id)
  }

  async getMatrix() {
    const all = await this.permissionRepo.findAll()
    // Group by module
    const grouped = all.reduce((acc: Record<string, any[]>, perm) => {
      const mod = perm.module || 'System'
      if (!acc[mod]) acc[mod] = []
      acc[mod].push(perm)
      return acc
    }, {})
    return grouped
  }
}
