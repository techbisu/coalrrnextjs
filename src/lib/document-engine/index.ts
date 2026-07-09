import { db } from '@/lib/db'
import { StorageService } from './storage'
import { DocxGeneratorService } from './generator'
import { PdfService } from './pdf'
import { fileService } from '@/modules/file-management/services/FileService'

export interface GenerationPayload {
  templateCode: string
  entityType: string
  entityId: string
  generatedBy: string // user id or system
  businessData: Record<string, unknown>
  dynamicAnswers?: Record<string, string>
}

export class DocumentEngine {
  /**
   * Generates a new document instance (or a new version of an existing instance).
   */
  static async generate(payload: GenerationPayload) {
    const template = await db.docTemplate.findUnique({
      where: { templateCode: payload.templateCode }
    })
    
    if (!template) {
      throw new Error(`Template not found: ${payload.templateCode}`)
    }

    // Load the DOCX template binary from storage
    const templateBuffer = await StorageService.readFile(template.storagePath)

    // Merge business data and dynamic answers
    const mergedData = {
      ...payload.businessData,
      ...payload.dynamicAnswers
    }

    // Generate the new DOCX buffer
    const generatedDocxBuffer = DocxGeneratorService.generate(templateBuffer, mergedData)
    
    // Convert to PDF
    let generatedPdfBuffer: Buffer | null = null
    try {
      generatedPdfBuffer = await PdfService.convertToPdf(generatedDocxBuffer)
    } catch (e) {
      console.warn('PDF conversion failed, falling back to DOCX only.', e)
    }

    return await db.$transaction(async (tx) => {
      // Find or create the instance
      let instance = await tx.docInstance.findFirst({
        where: {
          templateId: template.id,
          entityType: payload.entityType,
          entityId: payload.entityId
        }
      })

      if (!instance) {
        const uniqueDocId = `DOC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
        instance = await tx.docInstance.create({
          data: {
            documentId: uniqueDocId,
            templateId: template.id,
            entityType: payload.entityType,
            entityId: payload.entityId,
            status: 'Draft'
          }
        })
      }

      // Determine the next version number
      const lastVersion = await tx.docVersion.findFirst({
        where: { instanceId: instance.id },
        orderBy: { versionNumber: 'desc' }
      })
      const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1

      // Save files to Global File Framework
      const docxRecord = await fileService.uploadFile({
        buffer: generatedDocxBuffer,
        originalName: `${instance.documentId}-v${nextVersionNumber}.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ownerId: payload.generatedBy,
        module: 'document-engine',
        entityType: payload.entityType,
        entityId: payload.entityId,
      });
      
      let pdfRecord = null;
      if (generatedPdfBuffer) {
        pdfRecord = await fileService.uploadFile({
          buffer: generatedPdfBuffer,
          originalName: `${instance.documentId}-v${nextVersionNumber}.pdf`,
          mimeType: 'application/pdf',
          ownerId: payload.generatedBy,
          module: 'document-engine',
          entityType: payload.entityType,
          entityId: payload.entityId,
        });
      }

      // Create version record
      const version = await tx.docVersion.create({
        data: {
          instanceId: instance.id,
          versionNumber: nextVersionNumber,
          docxFileId: docxRecord.id,
          pdfFileId: pdfRecord?.id,
          generatedBy: payload.generatedBy,
          metadata: JSON.stringify(mergedData)
        }
      })

      // Log Audit
      await tx.docAuditLog.create({
        data: {
          documentId: instance.documentId,
          action: 'Generated',
          userId: payload.generatedBy,
        }
      })

      return {
        instance,
        version
      }
    })
  }

  static async getHistory(documentId: string) {
    return await db.docInstance.findUnique({
      where: { documentId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        signatures: true,
        workflowSteps: true
      }
    })
  }
}
