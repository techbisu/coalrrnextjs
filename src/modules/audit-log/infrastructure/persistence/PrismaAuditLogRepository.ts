import { IAuditLogRepository, AuditLogQueryFilters, PaginatedAuditLogs } from '../../domain/repositories/IAuditLogRepository';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export class PrismaAuditLogRepository implements IAuditLogRepository {
  async findLogs(filters: AuditLogQueryFilters): Promise<PaginatedAuditLogs> {
    const {
      page = 1,
      limit = 20,
      action_by,
      table_name,
      activity_type,
      startDate,
      endDate
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.activity_logWhereInput = {};

    if (action_by) {
      where.action_by = { contains: action_by, mode: 'insensitive' };
    }
    
    if (table_name) {
      where.table_name = { contains: table_name, mode: 'insensitive' };
    }

    if (activity_type) {
      where.activity = { contains: activity_type, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.entry_ts = {};
      if (startDate) where.entry_ts.gte = startDate;
      if (endDate) where.entry_ts.lte = endDate;
    }

    const [total, data] = await Promise.all([
      db.activity_log.count({ where }),
      db.activity_log.findMany({
        where,
        skip,
        take: limit,
        orderBy: { entry_ts: 'desc' },
        include: {
          application_log: true
        }
      })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
