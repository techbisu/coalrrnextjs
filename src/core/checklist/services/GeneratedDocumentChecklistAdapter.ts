import { IDocumentInstanceRepository } from '@/modules/document-engine/domain/IDocumentInstanceRepository'
import { IChecklistRepository } from '../interfaces/IChecklistRepository'
import { ChecklistItemStatus } from '@/shared/components/coalrr/SmartChecklist'

export interface StepDetail {
  type: 'GENERATE' | 'ADDITIONAL_INFO' | 'REVIEW' | 'SIGN'
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'LOCKED'
  permission?: string
  label: string
}

export interface NextActionInfo {
  type: 'GENERATE' | 'ADDITIONAL_INFO' | 'REVIEW' | 'SIGN'
  permission?: string
  label: string
  canCurrentUserAct?: boolean
}

export interface GeneratedDocInfo {
  instanceId?: string
  templateCode: string
  status: 'PENDING' | 'DRAFT' | 'INCOMPLETE' | 'COMPLETED'
  generatedDocId?: string
  stepDetails?: StepDetail[]
  nextAction?: NextActionInfo
}

export class GeneratedDocumentChecklistAdapter {
  constructor(
    private readonly documentInstanceRepository: IDocumentInstanceRepository,
    private readonly checklistRepository: IChecklistRepository
  ) {}

  /**
   * Resolves the checklist status based on the document instance state and configured completion steps.
   */
  async resolveStatus(
    rule: any,
    checkableType: string,
    checkableId: string,
    existingSubmission: any,
    userPermissions: string[] = []
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

    // 1. Resolve configured steps from rule.input_schema.completion_steps or fallback
    let configuredSteps: any[] = Array.isArray(rule.input_schema?.completion_steps)
      ? rule.input_schema.completion_steps
      : []

    if (configuredSteps.length === 0) {
      // Fallback: Check if document instance has required signature rules
      const sigRules = instance?.resolver_signatures_json ? (instance.resolver_signatures_json as any[]) : []
      if (sigRules.length > 0) {
        configuredSteps = [
          { type: 'GENERATE', permission: `${templateCode.toLowerCase()}.generate` },
          { type: 'SIGN' }
        ]
      } else {
        configuredSteps = [
          { type: 'GENERATE', permission: `${templateCode.toLowerCase()}.generate` }
        ]
      }
    }

    // Normalized step shapes
    const steps = configuredSteps.map(s => typeof s === 'string' ? { type: s } : s)

    let generatedDocId: string | undefined = instance?.generated_pdf_id || instance?.generated_docx_path || undefined
    const stepDetails: StepDetail[] = []
    let allStepsComplete = true
    let anyStepStarted = false
    let nextAction: NextActionInfo | undefined = undefined

    // Evaluated evidence
    const isDocGenerated = Boolean(instance && instance.generated_docx_path)
    const hasFormData = Boolean(instance && instance.form_data && Object.keys(instance.form_data as object).length > 0)

    const reviews = Array.isArray((instance as any)?.review_data_json) ? ((instance as any).review_data_json as any[]) : []
    const isApproved = reviews.some(r => r.decision === 'APPROVED')

    const sigRules = Array.isArray(instance?.resolver_signatures_json) ? (instance.resolver_signatures_json as any[]) : []
    const appliedSigs = Array.isArray(instance?.signature_data_json) ? (instance.signature_data_json as any[]) : []
    const requiredSigRules = sigRules.filter(r => r.is_required !== false)
    const areSignaturesComplete = requiredSigRules.length > 0
      ? requiredSigRules.every(r => appliedSigs.some(s => (s.sig_permission || s.role) === (r.sig_permission || r.role)))
      : appliedSigs.length > 0 || instance?.status === 'COMPLETED'

    let previousStepComplete = true

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepType = step.type as 'GENERATE' | 'ADDITIONAL_INFO' | 'REVIEW' | 'SIGN'
      let isStepComplete = false
      let stepLabel = ''

      switch (stepType) {
        case 'GENERATE':
          stepLabel = 'Generate Document'
          isStepComplete = isDocGenerated
          break
        case 'ADDITIONAL_INFO':
          stepLabel = 'Fill Additional Info'
          isStepComplete = hasFormData
          break
        case 'REVIEW':
          stepLabel = 'Review & Approve'
          isStepComplete = isApproved
          break
        case 'SIGN':
          stepLabel = 'Apply Signatures'
          isStepComplete = areSignaturesComplete
          break
      }

      if (isStepComplete) {
        anyStepStarted = true
        stepDetails.push({
          type: stepType,
          status: 'COMPLETED',
          permission: step.permission,
          label: stepLabel
        })
      } else {
        allStepsComplete = false
        const isLocked = !previousStepComplete

        stepDetails.push({
          type: stepType,
          status: isLocked ? 'LOCKED' : 'PENDING',
          permission: step.permission,
          label: stepLabel
        })

        if (!nextAction && !isLocked) {
          const permNeeded = step.permission || `${templateCode.toLowerCase()}.${stepType.toLowerCase()}`
          const canAct = userPermissions.length === 0 ||
            userPermissions.includes('*') ||
            userPermissions.includes(permNeeded) ||
            userPermissions.includes('document.sign') ||
            userPermissions.includes('workflow.approve')

          nextAction = {
            type: stepType,
            permission: step.permission,
            label: stepLabel,
            canCurrentUserAct: canAct
          }
        }
      }

      previousStepComplete = isStepComplete
    }

    // Determine final status based on step completion
    let docStatus: 'PENDING' | 'DRAFT' | 'INCOMPLETE' | 'COMPLETED' = 'PENDING'
    if (!instance) {
      docStatus = 'PENDING'
    } else if (allStepsComplete) {
      docStatus = 'COMPLETED'
    } else if (anyStepStarted) {
      docStatus = 'DRAFT'
    } else {
      docStatus = 'PENDING'
    }

    let checklistStatus: ChecklistItemStatus = 'pending'
    if (docStatus === 'DRAFT') checklistStatus = 'in_progress'
    if (docStatus === 'COMPLETED') checklistStatus = 'complete'

    let newlySubmitted = false

    // Auto-complete checklist submission if COMPLETED
    if (
      docStatus === 'COMPLETED' &&
      rule.input_schema?.auto_complete_on_final !== false &&
      (!existingSubmission || existingSubmission.status !== 'SUBMITTED')
    ) {
      await this.checklistRepository.upsertSubmission({
        requirement_id: (rule as any).chk_id || rule.id,
        checkable_type: checkableType,
        checkable_id: checkableId,
        status: 'SUBMITTED',
        document_id: generatedDocId,
        user_input: {
          autoCompleted: true,
          templateCode,
          documentInstanceId: instance!.id
        },
        entry_by: 'system'
      })
      newlySubmitted = true
      existingSubmission = { status: 'SUBMITTED', document_id: generatedDocId }
    } else if (existingSubmission?.status === 'SUBMITTED' && docStatus === 'COMPLETED') {
      checklistStatus = 'complete'
    }

    return {
      status: checklistStatus,
      newlySubmitted,
      generatedDocInfo: {
        instanceId: instance?.id,
        templateCode,
        status: docStatus,
        generatedDocId,
        stepDetails,
        nextAction
      }
    }
  }
}
