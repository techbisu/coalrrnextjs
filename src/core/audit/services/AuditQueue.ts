import { IAuditRepository } from '../interfaces/IAuditRepository';

export interface AuditChangePayload {
  field_name?: string;
  old_value?: string;
  new_value?: string;
  json_diff?: string;
}

export interface AuditEventPayload {
  event_type: string;
  module_name?: string | null;
  entity_name?: string | null;
  entity_id?: string | number | null;
  user_id?: string | null;
  user_role?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_url?: string | null;
  request_method?: string | null;
  remarks?: string | null;
  session_id?: string | null;
  changes?: AuditChangePayload[];
}

import { after } from 'next/server';

export class AuditQueueManager {
  constructor(private auditRepo: IAuditRepository) {}

  public push(event: AuditEventPayload) {
    if (typeof window !== 'undefined') return;

    // Use Next.js after() to run this without blocking the HTTP response
    // If we're not in a request context, it might throw, so we catch and fallback
    try {
      after(async () => {
        try {
          await this.auditRepo.saveBatch([event]);
        } catch (error) {
          console.error('[AuditQueue] Failed to save audit log in background:', error);
        }
      });
    } catch (e) {
      // Fallback if not inside a Next.js request context (e.g. CLI or cron)
      Promise.resolve().then(async () => {
        try {
          await this.auditRepo.saveBatch([event]);
        } catch (error) {
          console.error('[AuditQueue] Failed to save audit log fallback:', error);
        }
      });
    }
  }
}



