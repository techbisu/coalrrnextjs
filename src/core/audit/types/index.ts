export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL" | "ERROR";

export interface AuditLogPayload {
  event_code: string;
  event_name: string;
  module: string;
  feature?: string;
  entity_type?: string;
  entity_id?: string;
  entity_public_id?: string;
  reference_no?: string;
  workflow_id?: string;
  document_id?: string;
  file_id?: string;
  description?: string;
  remarks?: string;
  action: string;
  status: string;
  severity: string;
  entry_by?: string;
  ip_address?: string;
  browser?: string;
  device?: string;
  operating_system?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  correlation_id?: string;
  route?: string;
  http_method?: string;
  url?: string;
  payload?: any;
  metadata?: any;
  changes?: AuditChangePayload[];
}

export interface AuditChangePayload {
  table_name: string;
  record_id: string;
  record_public_id?: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  change_type: "ADDED" | "UPDATED" | "DELETED" | "NO_CHANGE";
}

export interface AuditUpdateOptions {
  module: string;
  entity: string;
  entityId: string;
  oldData: Record<string, any>;
  newData: Record<string, any>;
  description?: string;
  ignoredFields?: string[];
  action?: string;
}

export interface AuditActivityOptions {
  event: string;
  module: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  severity?: AuditSeverity;
}
