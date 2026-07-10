import { db } from '@/lib/db'
import { StorageService } from './storage'
import { DocxGeneratorService } from './generator'
import { PdfService } from './pdf'
import { fileService } from '@/modules/file-management/services/FileService'
import { GenerationPayload } from './index'

export class DocumentWorker {
  static async processGeneration(payload: GenerationPayload & { instance_id: string }) {
    const template = await db.doc_template.findUnique({
      where: { template_code: payload.template_code }
    })
    
    if (!template) {
      throw new Error(`Template not found: ${payload.template_code}`)
    }

    // Load the DOCX template binary from storage
    const templateBuffer = await StorageService.readFile(template.storage_path)

    // Merge business data and dynamic answers
    const mergedData = {
      ...payload.businessData,
      ...payload.dynamic_answers
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

    await db.$transaction(async (tx) => {
      const instance = await tx.doc_instance.findUnique({
        where: { id: payload.instance_id }
      })

      if (!instance) {
        throw new Error(`document instance ${payload.instance_id} not found`)
      }

      // Determine the next version number
      const lastVersion = await tx.doc_version.findFirst({
        where: { instance_id: instance.id },
        orderBy: { version_number: 'desc' }
      })
      const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1

      // Save files to Global File Framework
      const docxRecord = await fileService.uploadFile({
        buffer: generatedDocxBuffer,
        original_name: `${instance.document_id}-v${nextVersionNumber}.docx`,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        owner_id: payload.generated_by,
        module: 'document-engine',
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
      } as any);
      
      let pdfRecord: any = null;
      if (generatedPdfBuffer) {
        pdfRecord = await fileService.uploadFile({
          buffer: generatedPdfBuffer,
          original_name: `${instance.document_id}-v${nextVersionNumber}.pdf`,
          mime_type: 'application/pdf',
          owner_id: payload.generated_by,
          module: 'document-engine',
          entity_type: payload.entity_type,
          entity_id: payload.entity_id,
        } as any);
      }

      // Create version record
      await tx.doc_version.create({
        data: {
          instance_id: instance.id,
          version_number: nextVersionNumber,
          docx_file_id: docxRecord.id.toString(),
          pdf_file_id: pdfRecord ? pdfRecord.id.toString() : null,
          generated_by: payload.generated_by,
          metadata: JSON.stringify(mergedData)
        }
      })

      // Update instance status
      await tx.doc_instance.update({
        where: { id: instance.id },
        data: { status: 'Generated' }
      })

      // Log Audit
      await tx.doc_audit_log.create({
        data: {
          document_id: instance.document_id,
          action: 'Generated (Async)',
          user_id: payload.generated_by,
        }
      })
    })
  }
}
