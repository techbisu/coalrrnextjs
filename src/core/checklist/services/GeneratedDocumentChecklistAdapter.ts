import { IDocumentInstanceRepository } from '@/modules/document-engine/domain/IDocumentInstanceRepository'
import { IChecklistRepository } from '../interfaces/IChecklistRepository'
import { ChecklistItemStatus } from '@/shared/components/coalrr/SmartChecklist'
import { documentSignatureRequirementResolver, DocumentSignatureRequirement } from '@/core/document-requirement/DocumentSignatureRequirementResolver'

export interface StepDetail {
  type: 'GENERATE' | 'ADDITIONAL_INFO' | 'REVIEW' | 'SIGN'
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'LOCKED'
  permission?: string
  label: string
  /** Signature progress when type is SIGN */
  signatureProgress?: { completed: number; total: number }
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
  /** Whether the current viewer has already applied their required signature */
  isSignedByCurrentUser?: boolean
  /** Current-state signature requirement detail */
  signatureRequirement?: {
    completed: number
    total: number
    fullyCompleted: boolean
    allCurrentStageSatisfied: boolean
    /** The next pending signature permission key (e.g. 'form_vii.sign.land_clerk') */
    nextPendingPermission?: string
  }
}

export class GeneratedDocumentChecklistAdapter {
  constructor(
    private readonly documentInstanceRepository: IDocumentInstanceRepository,
    private readonly checklistRepository: IChecklistRepository
  ) {}

  /**
   * Resolves the checklist status based on the document instance state and configured completion steps.
   *
   * The signature evaluation is delegated to the generic DocumentSignatureRequirementResolver,
   * which queries document_template_signature.workflow_state to determine which signatures
   * are required for the CURRENT workflow state. No hardcoded state names are used.
   */
  async resolveStatus(
    rule: any,
    checkableType: string,
    checkableId: string,
    existingSubmission: any,
    userPermissions: string[] = [],
    currentStageCode: string = 'Drafting'
  ): Promise<{ status: ChecklistItemStatus; generatedDocInfo: GeneratedDocInfo; newlySubmitted: boolean }> {
    const templateCode =
      rule.input_schema?.template_code ||
      rule.input_schema?.templateCode ||
      rule.input_schema?.document_code ||
      rule.chk_code;
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
      // Fallback: build steps based on whether the template has signature rules
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

    // 2. Use the generic DocumentSignatureRequirementResolver for state-scoped signature evaluation
    let sigReq: DocumentSignatureRequirement | null = null
    if (instance) {
      const fallbackRules = (instance.resolver_signatures_json as any[]) || steps.filter(s => s.type === 'SIGN')
      sigReq = await documentSignatureRequirementResolver.resolve(
        templateCode,
        instance.signature_data_json,
        currentStageCode,
        fallbackRules
      )
    }

    const areSignaturesComplete = sigReq
      ? sigReq.allCurrentStageSatisfied
      : false

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
        const detail: StepDetail = {
          type: stepType,
          status: 'COMPLETED',
          permission: step.permission,
          label: stepLabel,
        }
        // Add signature progress for completed SIGN steps
        if (stepType === 'SIGN' && sigReq) {
          detail.signatureProgress = { completed: sigReq.completedCount, total: sigReq.totalRequired }
        }
        stepDetails.push(detail)
      } else {
        allStepsComplete = false
        const isLocked = !previousStepComplete

        const detail: StepDetail = {
          type: stepType,
          status: isLocked ? 'LOCKED' : 'PENDING',
          permission: step.permission,
          label: stepLabel,
        }
        // Add signature progress for pending SIGN steps too
        if (stepType === 'SIGN' && sigReq) {
          detail.signatureProgress = { completed: sigReq.completedCount, total: sigReq.totalRequired }
        }
        stepDetails.push(detail)

        if (!nextAction && !isLocked) {
          const permNeeded =
            stepType === 'SIGN' && sigReq?.nextPendingRule?.sig_permission
              ? sigReq.nextPendingRule.sig_permission
              : step.permission || `${templateCode.toLowerCase()}.${stepType.toLowerCase()}`;

          const canAct =
            userPermissions.includes('*') ||
            userPermissions.includes(permNeeded) ||
            userPermissions.some((p) => p.toLowerCase().includes('admin') || p.toLowerCase().includes('super')) ||
            (stepType !== 'SIGN' && (userPermissions.includes('document.sign') || userPermissions.includes('workflow.approve')));

          nextAction = {
            type: stepType,
            permission: permNeeded,
            label: stepLabel,
            canCurrentUserAct: canAct,
          };
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
    } else if (anyStepStarted || isDocGenerated) {
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
          documentInstanceId: instance!.id,
          signatureState: currentStageCode,
        },
        entry_by: 'system'
      })
      newlySubmitted = true
      existingSubmission = { status: 'SUBMITTED', document_id: generatedDocId }
    } else if (existingSubmission?.status === 'SUBMITTED' && docStatus !== 'COMPLETED') {
      // If previously auto-completed but current state requires more signatures,
      // revert to in_progress so checklist reflects the new state's requirements
      if (sigReq && sigReq.hasSignatureRules && !sigReq.allCurrentStageSatisfied) {
        // Don't revert — just report the current status accurately.
        // The auto-complete was for the previous state; current state evaluation is dynamic.
      }
    }

    const isSignedByCurrentUser = sigReq && Array.isArray(sigReq.appliedSignatures)
      ? sigReq.appliedSignatures.some(
          (app) => app.applied && userPermissions.some((up) => up === app.permission || up.toLowerCase().endsWith(app.permission.toLowerCase().split('.').pop() || ''))
        )
      : false;

    return {
      status: checklistStatus,
      newlySubmitted,
      generatedDocInfo: {
        instanceId: instance?.id,
        templateCode,
        status: docStatus,
        generatedDocId,
        stepDetails,
        nextAction,
        isSignedByCurrentUser,
        signatureRequirement: sigReq ? {
          completed: sigReq.completedCount,
          total: sigReq.totalRequired,
          fullyCompleted: sigReq.fullyCompleted,
          allCurrentStageSatisfied: sigReq.allCurrentStageSatisfied,
          nextPendingPermission: sigReq.nextPendingRule?.sig_permission,
        } : undefined,
      }
    }
  }
}
