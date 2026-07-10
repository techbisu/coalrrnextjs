import { db } from '@/lib/db'
import { IAuditRepository } from '@/core/audit/interfaces/IAuditRepository'
import { AuditEventPayload } from '@/core/audit/services/AuditQueue'

export class PrismaAuditRepository implements IAuditRepository {
  async saveBatch(events: AuditEventPayload[]): Promise<void> {
    // Prisma does not support deep createMany with relations in a single call natively
    // for SQLite/PostgreSQL easily without some mapping, but we can do a transaction
    await db.$transaction(
      events.map(event => {
        const { changes, session_id, entity_id, module_name, ...auditData } = event;
        return db.audit_log.create({
          data: {
            ...auditData,
            module_name: module_name ?? 'system',
            entity_id: entity_id != null ? String(entity_id) : null,
            session_id: session_id != null ? session_id : null,
            changes: changes ? { create: changes } : undefined,
          },
        });
      })
    );
  }
}
