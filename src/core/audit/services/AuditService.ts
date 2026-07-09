import { AuditQueue, AuditEventPayload } from './AuditQueue';

export interface AuditContext {
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestUrl?: string;
  requestMethod?: string;
}

export class AuditService {
  /**
   * General purpose log for custom business events (e.g. Export, Download)
   */
  static log(
    eventType: string,
    moduleName: string,
    entityName?: string,
    entityId?: string,
    remarks?: string,
    context?: AuditContext
  ) {
    AuditQueue.push({
      eventType,
      moduleName,
      entityName,
      entityId,
      remarks,
      ...context,
    });
  }

  /**
   * Log an explicit database change (called by Prisma Interceptor)
   */
  static logChange(
    eventType: 'CREATE' | 'UPDATE' | 'DELETE',
    moduleName: string,
    entityName: string,
    entityId: string,
    oldData: Record<string, any> | null,
    newData: Record<string, any> | null,
    jsonDiff: Record<string, { old: any; new: any }> | null,
    context?: AuditContext,
    remarks?: string
  ) {
    const changes = [];
    if (jsonDiff && Object.keys(jsonDiff).length > 0) {
      changes.push({
        fieldName: 'JSON_DIFF',
        oldValue: oldData ? JSON.stringify(oldData) : null,
        newValue: newData ? JSON.stringify(newData) : null,
        jsonDiff: JSON.stringify(jsonDiff),
      });
    } else if (eventType === 'DELETE' || eventType === 'CREATE') {
      // For create/delete where we just store the whole snapshot
      changes.push({
        fieldName: 'SNAPSHOT',
        oldValue: oldData ? JSON.stringify(oldData) : null,
        newValue: newData ? JSON.stringify(newData) : null,
      });
    }

    AuditQueue.push({
      eventType,
      moduleName,
      entityName,
      entityId,
      remarks,
      changes,
      ...context,
    });
  }
}
