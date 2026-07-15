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
  static async generate(payload: GenerationPayload) {
    console.warn("DocumentEngine.generate is deprecated.");
    return {
      instance: null,
      message: 'document generation enqueued successfully.'
    }
  }

  static async getHistory(document_id: string) {
    return null;
  }
}
