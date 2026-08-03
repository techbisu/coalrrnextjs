import { IDocumentInstanceRepository } from '@/modules/document-engine/domain/IDocumentInstanceRepository'
import { IChecklistRepository } from '../interfaces/IChecklistRepository'
import { ChecklistItemStatus } from '@/shared/components/coalrr/SmartChecklist'

export interface GeneratedDocInfo {
  instanceId?: string
  templateCode: string
  status: 'PENDING' | 'DRAFT' | 'INCOMPLETE' | 'COMPLETED'
  generatedDocId?: string
}

export class GeneratedDocumentChecklistAdapter {
  constructor(
    private readonly documentInstanceRepository: IDocumentInstanceRepository,
    private readonly checklistRepository: IChecklistRepository
  ) {}

  /**
   * Resolves the checklist status based on the document instance state.
   */
  async resolveStatus(
    rule: any,
    checkableType: string,
    checkableId: string,
    existingSubmission: any
  ): Promise<{ status: ChecklistItemStatus; generatedDocInfo: GeneratedDocInfo; newlySubmitted: boolean }> {
    const templateCode = rule.input_schema?.template_code || rule.input_schema?.templateCode
    if (!templateCode) {
      return {
        status: 'pending',
        generatedDocInfo: { templateCode: '', status: 'PENDING' },
        newlySubmitted: false
      }
    }

    const instance = await this.documentInstanceRepository.findLatestByTemplateAndApplication(templateCode, checkableId)

    let docStatus: 'PENDING' | 'DRAFT' | 'INCOMPLETE' | 'COMPLETED' = 'PENDING'
    let generatedDocId: string | undefined

    if (!instance) {
      docStatus = 'PENDING'
    } else if (instance.status === 'DRAFT') {
      docStatus = 'DRAFT'
    } else if (instance.status === 'FINAL') {
      if (instance.generated_pdf_id || instance.generated_docx_path) {
        docStatus = 'COMPLETED'
        generatedDocId = instance.generated_pdf_id || instance.generated_docx_path || undefined
      } else {
        docStatus = 'INCOMPLETE'
      }
    }

    // Map docStatus to ChecklistItemStatus
    let checklistStatus: ChecklistItemStatus = 'pending'
    if (docStatus === 'DRAFT') checklistStatus = 'in_progress'
    if (docStatus === 'COMPLETED') checklistStatus = 'complete'
    if (docStatus === 'INCOMPLETE') checklistStatus = 'in_progress'

    let newlySubmitted = false

    // Auto-complete if final
    if (
      docStatus === 'COMPLETED' &&
      rule.input_schema.auto_complete_on_final &&
      (!existingSubmission || existingSubmission.status !== 'SUBMITTED')
    ) {
      await this.checklistRepository.upsertSubmission({
        requirement_id: rule.id,
        checkable_type: checkableType,
        checkable_id: checkableId,
        status: 'SUBMITTED',
        document_id: generatedDocId,
        user_input: {
          autoCompleted: true,
          templateCode,
          documentInstanceId: instance!.id
        },
        entry_by: 'system' // System auto-completes it
      })
      newlySubmitted = true
      existingSubmission = { status: 'SUBMITTED', document_id: generatedDocId }
    } else if (existingSubmission?.status === 'SUBMITTED' && docStatus === 'COMPLETED') {
      // It's already complete
      checklistStatus = 'complete'
    }

    return {
      status: checklistStatus,
      newlySubmitted,
      generatedDocInfo: {
        instanceId: instance?.id,
        templateCode,
        status: docStatus,
        generatedDocId
      }
    }
  }
}
