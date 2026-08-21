import { document_instance, document_template } from '@prisma/client'

export type DocumentInstanceWithTemplate = document_instance & {
  document_template: document_template
}

/** Lightweight row for snapshot queries — avoids pulling full document_template when only name is needed */
export type DocumentInstanceLight = Pick<document_instance, 'id' | 'template_code' | 'signature_data_json' | 'generated_docx_path'> & {
  document_template?: { template_name: string } | null
}

export interface IDocumentInstanceRepository {
  findById(id: string): Promise<DocumentInstanceWithTemplate | null>
  findDraft(templateCode: string, applicationId: string, contextId?: string): Promise<document_instance | null>
  findLatestByTemplateAndApplication(templateCode: string, applicationId: string, contextId?: string): Promise<DocumentInstanceWithTemplate | null>
  /** Find all instances for an application, ordered by updt_ts desc */
  findManyByApplicationId(applicationId: string): Promise<DocumentInstanceLight[]>
  create(data: Omit<document_instance, 'id' | 'entry_ts' | 'updt_ts' | 'entry_by' | 'updt_by'>): Promise<document_instance>
  update(id: string, data: Partial<document_instance>): Promise<document_instance>
  addAuditLog(log: any): Promise<any>
}
