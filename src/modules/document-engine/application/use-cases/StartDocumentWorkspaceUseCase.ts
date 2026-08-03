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
}

export class StartDocumentWorkspaceUseCase implements IUseCase<StartDocumentWorkspaceDTO, any> {
  constructor(
    private readonly instanceRepository: IDocumentInstanceRepository,
    private readonly templateRepository: IDocumentTemplateRepository,
    private readonly resolverRegistry: ResolverRegistry
  ) {}

  async execute(request: StartDocumentWorkspaceDTO): Promise<Result<any>> {
    try {
      const { templateCode, applicationId, extraData = {}, userId = 'system' } = request
      
      // 1. Check for existing draft
      const existingDraft = await this.instanceRepository.findDraft(templateCode, applicationId)
      if (existingDraft) {
        return Ok(existingDraft)
      }

      // 2. Validate template
      const template = await this.templateRepository.findByCode(templateCode)
      if (!template) {
        return Fail(`Template not found: ${templateCode}`)
      }

      // 3. Fetch resolver and execute
      const resolver = this.resolverRegistry.getResolver(templateCode)
      const resolvedData = await resolver.resolve(applicationId, { form_data: extraData })

      // 4. Fetch Signature Routing Rules
      const { db } = await import('@/lib/db')
      const workflowState = resolvedData.fields?.status || resolvedData.fields?.workflow_state || null
      
      const signatureRules = await db.document_template_signature.findMany({
        where: {
          template_code: templateCode,
          OR: [
            { workflow_state: null },
            { workflow_state: workflowState }
          ]
        }
      })

      const pendingSignatures = signatureRules.map(rule => ({
        role: rule.role,
        placeholders: rule.placeholders,
        is_required: rule.is_required
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
        final_fields_json: {},
        generated_docx_path: null,
        generated_pdf_path: null,
        document_id: null,
        generated_docx_id: null,
        generated_pdf_id: null,
        resolver_signatures_json: pendingSignatures as any,
        resolver_version: null
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

      return Ok(instance)
    } catch (error: any) {
      return Fail(error.message)
    }
  }
}

