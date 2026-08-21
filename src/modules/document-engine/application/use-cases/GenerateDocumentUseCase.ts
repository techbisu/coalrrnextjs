import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IDocumentInstanceRepository } from '../../domain/IDocumentInstanceRepository'
import { IDocumentTemplateRepository } from '../../domain/IDocumentTemplateRepository'
import { ResolverRegistry } from '../ResolverRegistry'
import { DocxGeneratorEngine } from '@/lib/engines'
import { uploadFileUseCase, deleteFileUseCase } from '@/infrastructure/di/Container'

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
      const resolvedData = await resolver.resolve(instance.application_id!, { 
        form_data: instance.form_data || {},
        context_id: instance.context_id
      })
      
      // 2. Inject Signatures into resolvedData.fields via Template Repository Rules (100% Generic)
      const signatures = Array.isArray(instance.signature_data_json) ? instance.signature_data_json : []
      const sigRules = await this.templateRepository.findSignatureRules(template.template_code)

      for (const sig of signatures as { role?: string; sig_permission?: string; signatureText: string; signedAt?: string }[]) {
        const sigPerm = (sig.sig_permission || sig.role || '').toLowerCase()
        const rule = sigRules.find((r: any) =>
          r.sig_permission?.toLowerCase() === sigPerm ||
          r.sig_permission?.toLowerCase().endsWith(sigPerm) ||
          sigPerm.endsWith(r.sig_permission?.toLowerCase())
        )

        if (rule && rule.placeholders) {
          let matchedKeys: string[] = []
          if (Array.isArray(rule.placeholders)) {
            matchedKeys = rule.placeholders.map((p: any) => String(p).replace(/[\{\}]/g, '').trim())
          } else if (typeof rule.placeholders === 'object') {
            matchedKeys = Object.values(rule.placeholders).map((p: any) => String(p).replace(/[\{\}]/g, '').trim())
          }

          for (const cleanKey of matchedKeys) {
            (resolvedData.fields as any)[cleanKey] = sig.signatureText
          }
        }
      }

      // 3. Save Final Snapshot (final_fields_json, resolver_tables_json)
      await this.instanceRepository.update(instanceId, {
        final_fields_json: resolvedData.fields as any,
        resolver_tables_json: resolvedData.tables as any
      })

      // 4. Capture existing file reference for safe post-upload cleanup
      const oldFileId = instance.generated_docx_path

      // 5. Generate the document buffer using the Core Engine
      const mergedPayload = {
        ...(resolvedData.fields as any),
        ...(resolvedData.tables as any),
      }
      const buf = DocxGeneratorEngine.generate(template.storage_path, mergedPayload)

      // 6. Save new generated file via uploadFileUseCase FIRST
      const originalName = `${template.template_code}_${instance.application_id}.docx`
      
      const uploadResult = await uploadFileUseCase.execute({
          buffer: buf,
          originalName: originalName,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          sizeBytes: buf.length,
          ownerId: 'docx_engine',
          entityType: 'document_instance',
          entityId: instance.id,
          module: 'docxengine',
          isActive: false
      })
      
      if (uploadResult.isFailure) {
          return Fail(uploadResult.error as string)
      }
      
      const savedFileId = uploadResult.value?.id
      
      // 7. Update document_instance with new authoritative file ID
      await this.instanceRepository.update(instance.id, {
          generated_docx_path: savedFileId
      })
      
      // 8. Safely cleanup old file ONLY AFTER new file is successfully stored & updated in DB
      if (oldFileId && oldFileId !== savedFileId) {
        try {
          await deleteFileUseCase.execute({ fileId: oldFileId })
        } catch (delErr: any) {
          console.warn('[GenerateDocumentUseCase] Cleanup warning: Failed to delete previous docx file:', delErr.message)
        }
      }

      return Ok({ fileId: savedFileId })
    } catch (error: any) {
      console.error('Document Generation Failed:', error)
      return Fail(error.message)
    }
  }
}
