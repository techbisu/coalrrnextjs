import { PrismaClient } from "@prisma/client";
import { AuditLogPayload } from "../types";

export class AuditRepository {
  // Use a raw PrismaClient to prevent circular dependencies with the extended db.ts
  private prisma = new PrismaClient();

  async saveLog(payload: AuditLogPayload) {
    const { changes, ...logData } = payload;
    
    return this.prisma.audit_log.create({
      data: {
        event_type: logData.event_code || logData.action || "ACTIVITY",
        module_name: logData.module,
        entity_name: logData.entity_type,
        entity_id: logData.entity_id,
        user_id: logData.entry_by || (logData.metadata as any)?.user_id || undefined,
        entry_by: logData.entry_by || (logData.metadata as any)?.user_id || undefined,
        updt_by: logData.entry_by || (logData.metadata as any)?.user_id || undefined,
        ip_address: logData.ip_address,
        user_agent: logData.user_agent,
        request_url: logData.url || logData.route,
        request_method: logData.http_method,
        remarks: logData.remarks || logData.description,
        changes: changes && changes.length > 0 ? {
          create: changes.map(change => ({
            field_name: change.field_name,
            old_value: change.old_value ? (typeof change.old_value === 'string' ? change.old_value : JSON.stringify(change.old_value)) : null,
            new_value: change.new_value ? (typeof change.new_value === 'string' ? change.new_value : JSON.stringify(change.new_value)) : null,
          }))
        } : undefined
      }
    });
  }

  async saveSession(data: any) {
    return this.prisma.audit_session.create({ data });
  }

  async saveSecurityLog(data: any) {
    return this.prisma.audit_security.create({ data });
  }

  async saveDownloadLog(data: any) {
    return this.prisma.audit_download.create({ data });
  }

  async saveLoginAttempt(data: any) {
    // For now we map this to audit_session or similar
    return this.prisma.audit_session.create({ data });
  }
}

export const auditRepository = new AuditRepository();
