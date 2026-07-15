import { document_instance, document_audit_log, document_template } from '@prisma/client'

export type DocumentInstanceWithTemplate = document_instance & {
  template: document_template
}

export type DocumentInstanceWithAudit = document_instance & {
  audit_logs: document_audit_log[]
}

export interface IDocumentInstanceRepository {
  findById(id: string): Promise<DocumentInstanceWithTemplate | null>
  create(data: Omit<document_instance, 'id' | 'entry_ts' | 'updt_ts' | 'entry_by' | 'updt_by'>): Promise<document_instance>
  update(id: string, data: Partial<document_instance>): Promise<document_instance>
  addAuditLog(log: Omit<document_audit_log, 'id' | 'entry_ts' | 'updt_ts' | 'entry_by' | 'updt_by'>): Promise<document_audit_log>
}
