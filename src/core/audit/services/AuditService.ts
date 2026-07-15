import { AuditActivityOptions, AuditUpdateOptions } from "../types";
import { auditRepository } from "../repositories/AuditRepository";
import { generateDiff } from "../utils/diff";
import { AuditEventBuilder } from "../utils/AuditEventBuilder";

export class AuditService {
  static async log(event: string, module: string, entityType: string, entityId: string, description: string, metadata?: any) {
    await Audit.activity({
      event,
      module,
      entityType,
      entityId,
      description,
      metadata
    });
  }

  async activity(options: AuditActivityOptions) {
    const builder = new AuditEventBuilder()
      .withEvent(options.event)
      .withModule(options.module)
      .withAction("ACTIVITY")
      .withDescription(options.description || "");

    if (options.entityType && options.entityId) {
      builder.withEntity(options.entityType, options.entityId);
    }

    if (options.metadata) {
      builder.withMetadata(options.metadata);
    }
    
    if (options.severity) {
      builder.withStatus("SUCCESS", options.severity);
    }

    const payload = builder.build();
    await auditRepository.saveLog(payload);
  }

  async create(options: Omit<AuditUpdateOptions, "oldData">) {
    const diff = generateDiff({}, options.newData, options.ignoredFields);
    
    const changes = diff.map(d => ({
      table_name: options.entity,
      record_id: options.entityId,
      field_name: d.field_name,
      old_value: d.old_value,
      new_value: d.new_value,
      change_type: d.change_type as any
    }));

    const builder = new AuditEventBuilder()
      .withEvent("CREATE")
      .withModule(options.module)
      .withAction(options.action || "CREATE")
      .withEntity(options.entity, options.entityId)
      .withDescription(options.description || `Created ${options.entity}`)
      .withChanges(changes);

    await auditRepository.saveLog(builder.build());
  }

  async update(options: AuditUpdateOptions) {
    const diff = generateDiff(options.oldData, options.newData, options.ignoredFields);
    
    if (diff.length === 0) {
      return; // No changes to audit
    }

    const changes = diff.map(d => ({
      table_name: options.entity,
      record_id: options.entityId,
      field_name: d.field_name,
      old_value: d.old_value,
      new_value: d.new_value,
      change_type: d.change_type as any
    }));

    const builder = new AuditEventBuilder()
      .withEvent("UPDATE")
      .withModule(options.module)
      .withAction(options.action || "UPDATE")
      .withEntity(options.entity, options.entityId)
      .withDescription(options.description || `Updated ${options.entity}`)
      .withChanges(changes);

    await auditRepository.saveLog(builder.build());
  }

  async delete(options: Omit<AuditUpdateOptions, "newData">) {
    const diff = generateDiff(options.oldData, {}, options.ignoredFields);
    
    const changes = diff.map(d => ({
      table_name: options.entity,
      record_id: options.entityId,
      field_name: d.field_name,
      old_value: d.old_value,
      new_value: d.new_value,
      change_type: d.change_type as any
    }));

    const builder = new AuditEventBuilder()
      .withEvent("DELETE")
      .withModule(options.module)
      .withAction(options.action || "DELETE")
      .withEntity(options.entity, options.entityId)
      .withDescription(options.description || `Deleted ${options.entity}`)
      .withChanges(changes);

    await auditRepository.saveLog(builder.build());
  }

  async login(userId: string, status: "SUCCESS" | "FAILED", ipAddress?: string, userAgent?: string) {
    await auditRepository.saveLoginAttempt({
      user_id: userId,
      status,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }
}

export const Audit = new AuditService();
