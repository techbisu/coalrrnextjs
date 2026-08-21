import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { IDocumentInstanceRepository, DocumentInstanceWithTemplate, DocumentInstanceLight } from '../../domain/IDocumentInstanceRepository'
import { document_instance, Prisma } from '@prisma/client'
import { Audit } from '@/core/audit/services/AuditService'

export class PrismaDocumentInstanceRepository implements IDocumentInstanceRepository {
  async findById(id: string): Promise<DocumentInstanceWithTemplate | null> {
    return db.document_instance.findUnique({
      where: { id },
      include: { document_template: true }
    })
  }

  async findDraft(templateCode: string, applicationId: string, contextId?: string): Promise<document_instance | null> {
    return db.document_instance.findFirst({
      where: {
        template_code: templateCode,
        application_id: applicationId,
        status: { in: ['DRAFT', 'QUEUED'] },
        context_id: contextId || null
      },
      orderBy: { updt_ts: 'desc' }
    })
  }

  async findLatestByTemplateAndApplication(templateCode: string, applicationId: string, contextId?: string): Promise<DocumentInstanceWithTemplate | null> {
    return db.document_instance.findFirst({
      where: {
        template_code: templateCode,
        application_id: applicationId,
        context_id: contextId || null
      },
      include: { document_template: true },
      orderBy: { entry_ts: 'desc' }
    })
  }

  async findManyByApplicationId(applicationId: string): Promise<DocumentInstanceLight[]> {
    return db.document_instance.findMany({
      where: { application_id: applicationId },
      select: {
        id: true,
        template_code: true,
        signature_data_json: true,
        generated_docx_path: true,
        document_template: {
          select: { template_name: true }
        }
      },
      orderBy: { updt_ts: 'desc' }
    })
  }

  async create(data: Omit<document_instance, 'id' | 'entry_ts' | 'updt_ts' | 'entry_by' | 'updt_by'>): Promise<document_instance> {
    const createData = data as any;
    if (!createData.id) createData.id = randomUUID();
    return db.document_instance.create({
      data: createData
    })
  }

  async update(id: string, data: Partial<document_instance>): Promise<document_instance> {
    const updateData = data as any;
    return db.document_instance.update({
      where: { id },
      data: updateData
    })
  }

  async addAuditLog(log: any): Promise<any> {
    await Audit.logCustomAction({
      activity: `${log.action} on document ${log.document_instance_id}`,
      userId: log.user_id || 'system',
      ipAddress: log.ip_address || undefined,
      userAgent: log.browser || undefined
    })
    return log
  }
}
