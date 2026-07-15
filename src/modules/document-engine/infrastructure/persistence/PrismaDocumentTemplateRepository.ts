import { db } from '@/lib/db'
import { IDocumentTemplateRepository, DocumentTemplateWithFields } from '../../domain/IDocumentTemplateRepository'
import { document_template } from '@prisma/client'

export class PrismaDocumentTemplateRepository implements IDocumentTemplateRepository {
  async findByCode(templateCode: string): Promise<DocumentTemplateWithFields | null> {
    return db.document_template.findUnique({
      where: { template_code: templateCode },
      include: {
        fields: {
          orderBy: { field_key: 'asc' }
        }
      }
    })
  }

  async findAll(): Promise<document_template[]> {
    return db.document_template.findMany({
      where: { is_active: true },
      orderBy: { template_name: 'asc' }
    })
  }
}
