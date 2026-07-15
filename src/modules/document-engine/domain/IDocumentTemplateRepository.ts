import { document_template, document_template_field } from '@prisma/client'

export type DocumentTemplateWithFields = document_template & {
  fields: document_template_field[]
}

export interface IDocumentTemplateRepository {
  findByCode(templateCode: string): Promise<DocumentTemplateWithFields | null>
  findAll(): Promise<document_template[]>
}
