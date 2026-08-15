import { db } from '@/lib/db'
import { IEntityFlagRepository } from '../../interfaces/IEntityFlagRepository'
import { EntityFlagRecord, SetEntityFlagOptions, SetEntityFlagParams } from '../../types/entity-flag.types'

export class PrismaEntityFlagRepository implements IEntityFlagRepository {
  async get(entityType: string, entityId: string, flagCode: string): Promise<EntityFlagRecord | null> {
    const record = await db.entity_flag.findUnique({
      where: {
        entity_type_entity_id_flag_code: {
          entity_type: entityType,
          entity_id: entityId,
          flag_code: flagCode,
        },
      },
    })
    return (record as EntityFlagRecord) || null
  }

  async getAll(entityType: string, entityId: string): Promise<EntityFlagRecord[]> {
    const records = await db.entity_flag.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      orderBy: {
        entry_ts: 'asc',
      },
    })
    return (records as EntityFlagRecord[]) || []
  }

  async set(
    entityType: string,
    entityId: string,
    flagCode: string,
    flagValue: any,
    options?: SetEntityFlagOptions
  ): Promise<EntityFlagRecord> {
    return this.setDirect({
      entityType,
      entityId,
      flagCode,
      flagValue,
      source: options?.source ?? 'SYSTEM',
      isOverridden: options?.isOverridden ?? false,
      overrideReason: options?.overrideReason ?? null,
      entryBy: options?.entryBy ?? 'system',
    })
  }

  async setDirect(params: SetEntityFlagParams): Promise<EntityFlagRecord> {
    const {
      entityType,
      entityId,
      flagCode,
      flagValue,
      source = 'SYSTEM',
      isOverridden = false,
      overrideReason = null,
      entryBy = 'system',
    } = params

    const record = await db.entity_flag.upsert({
      where: {
        entity_type_entity_id_flag_code: {
          entity_type: entityType,
          entity_id: entityId,
          flag_code: flagCode,
        },
      },
      update: {
        flag_value: flagValue,
        source: source,
        updt_by: entryBy,
        updt_ts: new Date(),
      },
      create: {
        entity_type: entityType,
        entity_id: entityId,
        flag_code: flagCode,
        flag_value: flagValue,
        source: source,
        entry_by: entryBy,
        updt_by: entryBy,
      },
    })

    return record as EntityFlagRecord
  }

  async delete(entityType: string, entityId: string, flagCode: string): Promise<boolean> {
    try {
      await db.entity_flag.delete({
        where: {
          entity_type_entity_id_flag_code: {
            entity_type: entityType,
            entity_id: entityId,
            flag_code: flagCode,
          },
        },
      })
      return true
    } catch {
      return false
    }
  }

  async exists(entityType: string, entityId: string, flagCode: string): Promise<boolean> {
    const count = await db.entity_flag.count({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        flag_code: flagCode,
      },
    })
    return count > 0
  }
}
