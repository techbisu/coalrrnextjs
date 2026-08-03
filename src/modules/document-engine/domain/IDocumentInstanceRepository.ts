import { document_instance, document_template } from '@prisma/client'

export type DocumentInstanceWithTemplate = document_instance & {
  document_template: document_template
}

export interface IDocumentInstanceRepository {
  findById(id: string): Promise<DocumentInstanceWithTemplate | null>
  findDraft(templateCode: string, applicationId: string): Promise<document_instance | null>
  findLatestByTemplateAndApplication(templateCode: string, applicationId: string): Promise<DocumentInstanceWithTemplate | null>
  create(data: Omit<document_instance, 'id' | 'entry_ts' | 'updt_ts' | 'entry_by' | 'updt_by'>): Promise<document_instance>
  update(id: string, data: Partial<document_instance>): Promise<document_instance>
  addAuditLog(log: any): Promise<any>
}
