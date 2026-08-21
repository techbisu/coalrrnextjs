import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IDocumentInstanceRepository } from '../../domain/IDocumentInstanceRepository'
import { IDocumentTemplateRepository } from '../../domain/IDocumentTemplateRepository'
import { ResolverRegistry } from '../ResolverRegistry'

export interface StartDocumentWorkspaceDTO {
  templateCode: string
  applicationId: string
  extraData?: Record<string, any>
  userId?: string
  contextId?: string
}

export class StartDocumentWorkspaceUseCase implements IUseCase<StartDocumentWorkspaceDTO, any> {
  constructor(
    private readonly instanceRepository: IDocumentInstanceRepository,
    private readonly templateRepository: IDocumentTemplateRepository,
    private readonly resolverRegistry: ResolverRegistry
  ) {}

  async execute(request: StartDocumentWorkspaceDTO): Promise<Result<any>> {
    try {
      const { templateCode, applicationId, extraData = {}, userId = 'system', contextId } = request
      
      // 1. Check for existing draft and refresh its resolver fields
      const existingDraft = await this.instanceRepository.findDraft(templateCode, applicationId, contextId)
      if (existingDraft) {
        const resolver = this.resolverRegistry.getResolver(templateCode)
        const resolvedData = await resolver.resolve(applicationId, { form_data: existingDraft.form_data || extraData })
        
        await this.instanceRepository.update(existingDraft.id, {
          resolver_fields_json: resolvedData.fields as any,
          resolver_tables_json: resolvedData.tables as any,
          form_data: { ...(existingDraft.form_data as any), ...extraData }
        })

        // Dispatch background docx generation via JobDispatcherService
        const { jobDispatcher } = await import('@/infrastructure/di/Container')
        await this.instanceRepository.update(existingDraft.id, { status: 'QUEUED' })
        await jobDispatcher.dispatch('generateDocument', { instanceId: existingDraft.id })
        
        const refreshedDraft = await this.instanceRepository.findById(existingDraft.id)
        return Ok(refreshedDraft || existingDraft)
      }

      // 2. Validate template
      const template = await this.templateRepository.findByCode(templateCode)
      if (!template) {
        return Fail(`Template not found: ${templateCode}`)
      }

      // 3. Fetch resolver and execute
      const resolver = this.resolverRegistry.getResolver(templateCode)
      const resolvedData = await resolver.resolve(applicationId, { form_data: extraData })

      // 4. Fetch Signature Routing Rules via Repository
      const signatureRules = await this.templateRepository.findSignatureRules(templateCode)

      const pendingSignatures = signatureRules.map((rule: any) => ({
        id: rule.id,
        sig_permission: rule.sig_permission || rule.role,
        role: rule.sig_permission || rule.role,
        placeholders: rule.placeholders,
        is_required: rule.is_required,
        display_order: rule.display_order
      }))

      // 5. Create document instance
      const instance = await this.instanceRepository.create({
        template_code: templateCode,
        application_id: applicationId,
        status: 'DRAFT',
        form_data: extraData,
        resolver_fields_json: resolvedData.fields as any,
        resolver_tables_json: resolvedData.tables as any,
        signature_data_json: [],
        review_data_json: [],
        final_fields_json: {},
        generated_docx_path: null,
        generated_pdf_path: null,
        document_id: null,
        generated_docx_id: null,
        generated_pdf_id: null,
        resolver_signatures_json: pendingSignatures as any,
        resolver_version: null,
        context_id: contextId || null,
        context_type: contextId ? 'proposal' : null
      })

      // 6. Audit Log
      await this.instanceRepository.addAuditLog({
        document_instance_id: instance.id,
        action: 'WORKSPACE_CREATED',
        user_id: userId,
        user_name: 'System',
        role: null,
        ip_address: null,
        browser: null
      })

      // 7. Dispatch Job to Create Review Tasks for Pending Signatures
      if (pendingSignatures.length > 0) {
        const { Container } = await import('@/infrastructure/di/Container')
        const rolesToSign = pendingSignatures.map(sig => sig.role)
        
        await Container.jobDispatcher.dispatch('createReviewTasks', {
          reviewableType: 'document_signature',
          reviewableId: instance.id,
          roles: rolesToSign
        })
      }

      // Auto-generate docx on new instance creation so preview is immediately ready
      const { generateDocumentUseCase } = await import('@/infrastructure/di/Container')
      await generateDocumentUseCase.execute({ instanceId: instance.id })
      
      const refreshedInstance = await this.instanceRepository.findById(instance.id)

      return Ok(refreshedInstance || instance)
    } catch (error: any) {
      return Fail(error.message)
    }
  }
}

