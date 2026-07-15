import { ISystemConfigRepository } from '../../domain/repositories/ISystemConfigRepository'
import { SystemConfig } from '../../domain/entities/SystemConfig'
import { db } from '@/lib/db'

export class PrismaSystemConfigRepository implements ISystemConfigRepository {
  async findByKey(key: string): Promise<SystemConfig | null> {
    const raw = await db.sys_config.findUnique({ where: { key } })
    if (!raw) return null
    return this.mapToDomain(raw)
  }

  async findByCategory(category: string): Promise<SystemConfig[]> {
    const rawList = await db.sys_config.findMany({ where: { category }, orderBy: { key: 'asc' } })
    return rawList.map(raw => this.mapToDomain(raw))
  }

  async findAll(): Promise<SystemConfig[]> {
    const rawList = await db.sys_config.findMany({ orderBy: [ { category: 'asc' }, { key: 'asc' } ] })
    return rawList.map(raw => this.mapToDomain(raw))
  }

  async save(config: SystemConfig): Promise<void> {
    await db.sys_config.upsert({
      where: { key: config.key },
      create: {
        id: config.id,
        key: config.key,
        category: config.category,
        value: config.value,
        type: config.type,
        description: config.description,
        is_secret: config.is_secret,
        entry_ts: config.props.entry_ts,
        updt_ts: config.props.updt_ts
      },
      update: {
        value: config.value,
        updt_ts: config.props.updt_ts
      }
    })
  }

  private mapToDomain(raw: any): SystemConfig {
    return SystemConfig.create({
      id: raw.id,
      category: raw.category,
      key: raw.key,
      value: raw.value,
      type: raw.type,
      description: raw.description,
      is_secret: raw.is_secret,
      entry_ts: raw.entry_ts,
      updt_ts: raw.updt_ts
    }).value!
  }
}
