import { db } from '@/lib/db'
import { StorageService } from './storage'
import { DocxGeneratorService } from './generator'
import { PdfService } from './pdf'
import { fileService } from '@/modules/file-management/services/FileService'

export interface GenerationPayload {
  template_code: string
  entity_type: string
  entity_id: string
  generated_by: string // user id or system
  businessData: Record<string, unknown>
  dynamic_answers?: Record<string, string>
}

import { JobQueue } from '@/core/jobs/JobQueue'

export class DocumentEngine {
  /**
   * Generates a new document instance asynchronously by enqueuing a job.
   */
  static async generate(payload: GenerationPayload) {
    const template = await db.doc_template.findUnique({
      where: { template_code: payload.template_code }
    })
    
    if (!template) {
      throw new Error(`Template not found: ${payload.template_code}`)
    }

    return await db.$transaction(async (tx) => {
      // Find or create the instance
      let instance = await tx.doc_instance.findFirst({
        where: {
          template_id: template.id,
          entity_type: payload.entity_type,
          entity_id: payload.entity_id
        }
      })

      if (!instance) {
        const uniqueDocId = `DOC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
        instance = await tx.doc_instance.create({
          data: {
            document_id: uniqueDocId,
            template_id: template.id,
            entity_type: payload.entity_type,
            entity_id: payload.entity_id,
            status: 'Processing' // Mark as processing
          }
        })
      } else {
        instance = await tx.doc_instance.update({
          where: { id: instance.id },
          data: { status: 'Processing' }
        })
      }

      // Enqueue the generation job
      await JobQueue.enqueue('GENERATE_DOCUMENT', {
        ...payload,
        instance_id: instance.id
      })

      return {
        instance,
        message: 'document generation enqueued successfully.'
      }
    })
  }

  static async getHistory(document_id: string) {
    return await db.doc_instance.findUnique({
      where: { document_id },
      include: {
        versions: { orderBy: { version_number: 'desc' } },
        signatures: true,
        workflow_steps: true
      }
    })
  }
}
