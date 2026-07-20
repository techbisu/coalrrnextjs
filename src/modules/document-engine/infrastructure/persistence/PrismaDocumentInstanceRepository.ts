import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { IDocumentInstanceRepository, DocumentInstanceWithTemplate } from '../../domain/IDocumentInstanceRepository'
import { document_instance, document_audit_log, Prisma } from '@prisma/client'

export class PrismaDocumentInstanceRepository implements IDocumentInstanceRepository {
  async findById(id: string): Promise<DocumentInstanceWithTemplate | null> {
    return db.document_instance.findUnique({
      where: { id },
      include: { document_template: true }
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

  async addAuditLog(log: Omit<document_audit_log, 'id' | 'entry_ts' | 'updt_ts' | 'entry_by' | 'updt_by'>): Promise<document_audit_log> {
    const logData = log as any;
    if (!logData.id) logData.id = randomUUID();
    return db.document_audit_log.create({
      data: logData
    })
  }
}
