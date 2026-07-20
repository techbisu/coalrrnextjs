import { db } from '@/lib/db'
import { IDocumentTemplateRepository, DocumentTemplateWithFields } from '../../domain/IDocumentTemplateRepository'
import { document_template } from '@prisma/client'

export class PrismaDocumentTemplateRepository implements IDocumentTemplateRepository {
  async findByCode(templateCode: string): Promise<DocumentTemplateWithFields | null> {
    const result = await db.document_template.findUnique({
      where: { template_code: templateCode },
      include: {
        document_template_field: {
          orderBy: { field_key: 'asc' }
        }
      }
    })

    if (!result) return null;

    return {
      ...result,
      fields: result.document_template_field
    } as DocumentTemplateWithFields;
  }

  async findAll(): Promise<document_template[]> {
    return db.document_template.findMany({
      where: { is_active: true },
      orderBy: { template_name: 'asc' }
    })
  }
}
