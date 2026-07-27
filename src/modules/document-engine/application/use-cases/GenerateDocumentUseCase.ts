import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IDocumentInstanceRepository } from '../../domain/IDocumentInstanceRepository'
import { IDocumentTemplateRepository } from '../../domain/IDocumentTemplateRepository'
import { ResolverRegistry } from '../ResolverRegistry'
import { DocxGeneratorEngine } from '@/lib/engines'
import { uploadFileUseCase } from '@/infrastructure/di/Container'

export interface GenerateDocumentDTO {
  instanceId: string
}

export class GenerateDocumentUseCase implements IUseCase<GenerateDocumentDTO, any> {
  constructor(
    private readonly instanceRepository: IDocumentInstanceRepository,
    private readonly templateRepository: IDocumentTemplateRepository,
    private readonly resolverRegistry: ResolverRegistry
  ) {}

  async execute(request: GenerateDocumentDTO): Promise<Result<any>> {
    try {
      const { instanceId } = request
      
      const instance = await this.instanceRepository.findById(instanceId)
      if (!instance) return Fail("Instance not found")
      
      const template = await this.templateRepository.findByCode(instance.template_code)
      if (!template) return Fail("Template not found")

      // 1. Resolve fields
      const resolver = this.resolverRegistry.getResolver(template.template_code)
      const resolvedData = await resolver.resolve(instance.application_id!, { form_data: instance.form_data || {} })
      
      // 2. Inject Signatures into resolvedData.fields
      const signatures = Array.isArray(instance.signature_data_json) ? instance.signature_data_json : []
      const pendingQueue = Array.isArray(instance.resolver_signatures_json) ? instance.resolver_signatures_json : []
      
      for (const sig of signatures as { role: string; signatureText: string }[]) {
        const rule = pendingQueue.find((q: any) => q.role === sig.role) as any
        if (rule && Array.isArray(rule.placeholders)) {
          for (const placeholder of rule.placeholders) {
            (resolvedData.fields as any)[placeholder] = sig.signatureText
          }
        }
      }

      // 3. Save Final Snapshot (final_fields_json, resolver_tables_json)
      await this.instanceRepository.update(instanceId, {
        final_fields_json: resolvedData.fields as any,
        resolver_tables_json: resolvedData.tables as any
      })

      // 4. Generate the document buffer using the Core Engine
      const buf = DocxGeneratorEngine.generate(template.storage_path, resolvedData.fields)
      
      // 5. Save via uploadFileUseCase
      const originalName = `${template.template_code}_${instance.application_id}.docx`
      
      const uploadResult = await uploadFileUseCase.execute({
          buffer: buf,
          originalName: originalName,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          sizeBytes: buf.length,
          ownerId: 'system',
          entityType: 'document_instance',
          entityId: instance.id,
          module: 'document-engine'
      })
      
      if (uploadResult.isFailure) {
          return Fail(uploadResult.error as string)
      }
      
      const savedFileId = uploadResult.value?.id
      
      await this.instanceRepository.update(instance.id, {
          generated_docx_path: savedFileId
      })
      
      return Ok({ fileId: savedFileId })
    } catch (error: any) {
      console.error('Document Generation Failed:', error)
      return Fail(error.message)
    }
  }
}
