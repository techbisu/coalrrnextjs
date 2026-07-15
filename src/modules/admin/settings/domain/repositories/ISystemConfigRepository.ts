import { SystemConfig } from '../entities/SystemConfig'

export interface ISystemConfigRepository {
  findByKey(key: string): Promise<SystemConfig | null>
  findByCategory(category: string): Promise<SystemConfig[]>
  findAll(): Promise<SystemConfig[]>
  save(config: SystemConfig): Promise<void>
}
