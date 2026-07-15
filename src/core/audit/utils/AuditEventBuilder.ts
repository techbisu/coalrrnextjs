import { AuditLogPayload, AuditSeverity } from "../types";

export class AuditEventBuilder {
  private payload: Partial<AuditLogPayload> = {
    action: "UNKNOWN",
    status: "SUCCESS",
    severity: "INFO",
  };

  withEvent(event_code: string, event_name?: string): this {
    this.payload.event_code = event_code;
    this.payload.event_name = event_name || event_code;
    return this;
  }

  withModule(moduleName: string, feature?: string): this {
    this.payload.module = moduleName;
    this.payload.feature = feature;
    return this;
  }

  withEntity(entityType: string, entityId: string, publicId?: string): this {
    this.payload.entity_type = entityType;
    this.payload.entity_id = entityId;
    this.payload.entity_public_id = publicId;
    return this;
  }

  withDescription(description: string, remarks?: string): this {
    this.payload.description = description;
    this.payload.remarks = remarks;
    return this;
  }

  withStatus(status: "SUCCESS" | "FAILED" | "PENDING", severity: AuditSeverity = "INFO"): this {
    this.payload.status = status;
    this.payload.severity = severity;
    return this;
  }

  withClientInfo(ip?: string, userAgent?: string): this {
    this.payload.ip_address = ip;
    this.payload.user_agent = userAgent;
    return this;
  }

  withMetadata(metadata: any): this {
    this.payload.metadata = metadata;
    return this;
  }

  withAction(action: string): this {
    this.payload.action = action;
    return this;
  }

  withChanges(changes: any[]): this {
    this.payload.changes = changes;
    return this;
  }

  build(): AuditLogPayload {
    if (!this.payload.event_code || !this.payload.module) {
      throw new Error("Audit event requires at least event_code and module.");
    }
    return this.payload as AuditLogPayload;
  }
}
