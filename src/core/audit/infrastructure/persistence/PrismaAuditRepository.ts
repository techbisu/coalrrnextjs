import { IAuditRepository } from '../../domain/repositories/IAuditRepository'
import { ActivityLog } from '../../domain/entities/ActivityLog'
import { ApplicationLog } from '../../domain/entities/ApplicationLog'
import { PrismaClient } from '@prisma/client'

// We use a raw PrismaClient here so we don't trigger the AuditExtension interceptor loop.
const globalForRawPrisma = globalThis as unknown as {
  rawPrisma: PrismaClient | undefined
}

const prisma = globalForRawPrisma.rawPrisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForRawPrisma.rawPrisma = prisma
}

export class PrismaAuditRepository implements IAuditRepository {
  
  async saveActivityLog(log: ActivityLog): Promise<void> {
    const data = log.toPersistence()
    await prisma.activity_log.create({
      data: {
        id: data.id,
        activity: data.activity,
        table_name: data.table_name,
        action_by: data.action_by,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        application_log_id: data.application_log_id,
        entry_ts: data.entry_ts,
        updt_ts: data.updt_ts,
      }
    })
  }

  async saveApplicationLog(log: ApplicationLog): Promise<void> {
    const data = log.toPersistence()
    await prisma.application_log.create({
      data: {
        id: data.id,
        table_name: data.table_name,
        conditions: data.conditions ? JSON.parse(data.conditions) : null,
        old_data: data.old_data ? JSON.parse(data.old_data) : null,
        new_data: data.new_data ? JSON.parse(data.new_data) : null,
        entry_ts: data.entry_ts,
        updt_ts: data.updt_ts,
      }
    })
  }

  async searchActivityLogs(conditions: any, start: number, limit: number, search?: string): Promise<{ logs: any[], totalCount: number, filteredCount: number }> {
    const where: any = {}
    
    if (conditions) {
      Object.entries(conditions).forEach(([key, value]) => {
        where[key] = value
      })
    }

    if (search) {
      where.OR = [
        { activity: { contains: search, mode: 'insensitive' } },
        { action_by: { contains: search, mode: 'insensitive' } },
        { ip_address: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [totalCount, filteredCount, logs] = await prisma.$transaction([
      prisma.activity_log.count(),
      prisma.activity_log.count({ where }),
      prisma.activity_log.findMany({
        where,
        skip: start,
        take: limit,
        orderBy: { entry_ts: 'desc' },
        include: {
          application_log: true
        }
      })
    ])

    return { logs, totalCount, filteredCount }
  }
}
