import { AuditQueueManager, AuditEventPayload } from './AuditQueue';

export interface AuditContext {
  user_id?: string;
  user_role?: string;
  ip_address?: string;
  user_agent?: string;
  request_url?: string;
  request_method?: string;
}

export class AuditService {
  private static queue: AuditQueueManager | null = null;

  static setQueue(queue: AuditQueueManager) {
    this.queue = queue;
  }

  /**
   * General purpose log for custom business events (e.g. Export, Download)
   */
  static log(
    event_type: string,
    module_name: string,
    entity_name?: string,
    entity_id?: string,
    remarks?: string,
    context?: AuditContext
  ) {
    this.queue?.push({
      event_type,
      module_name,
      entity_name,
      entity_id,
      remarks,
      ...context,
    });
  }

  /**
   * Log an explicit database change (called by Prisma Interceptor)
   */
  static logChange(
    event_type: 'CREATE' | 'UPDATE' | 'DELETE',
    module_name: string,
    entity_name: string,
    entity_id: string,
    oldData: Record<string, any> | null,
    newData: Record<string, any> | null,
    json_diff: Record<string, { old: any; new: any }> | null,
    context?: AuditContext,
    remarks?: string
  ) {
    const replacer = (k: string, v: any) => typeof v === 'bigint' ? v.toString() : v;

    const changes: any[] = [];
    if (json_diff && Object.keys(json_diff).length > 0) {
      changes.push({
        field_name: 'JSON_DIFF',
        old_value: oldData ? JSON.stringify(oldData, replacer) : null,
        new_value: newData ? JSON.stringify(newData, replacer) : null,
        json_diff: JSON.stringify(json_diff, replacer),
      });
    } else if (event_type === 'DELETE' || event_type === 'CREATE') {
      // For create/delete where we just store the whole snapshot
      changes.push({
        field_name: 'SNAPSHOT',
        old_value: oldData ? JSON.stringify(oldData, replacer) : null,
        new_value: newData ? JSON.stringify(newData, replacer) : null,
      });
    }

    this.queue?.push({
      event_type,
      module_name,
      entity_name,
      entity_id,
      remarks,
      changes,
      ...context,
    });
  }
}
