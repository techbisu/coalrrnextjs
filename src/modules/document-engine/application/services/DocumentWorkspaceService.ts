import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { FileService } from '@/modules/file-management/services/FileService'
import { IDocumentInstanceRepository } from '../../domain/IDocumentInstanceRepository'
import { IDocumentTemplateRepository } from '../../domain/IDocumentTemplateRepository'
import { ResolverRegistry } from '../ResolverRegistry'

export class DocumentWorkspaceService {
  constructor(
    private readonly instanceRepository: IDocumentInstanceRepository,
    private readonly templateRepository: IDocumentTemplateRepository,
    private readonly resolverRegistry: ResolverRegistry
  ) {}

  async startWorkspace(templateCode: string, applicationId: string) {
    // 1. Validate template
    const template = await this.templateRepository.findByCode(templateCode)
    if (!template) {
      throw new Error(`Template not found: ${templateCode}`)
    }

    // 2. Fetch resolver and execute
    const resolver = this.resolverRegistry.getResolver(templateCode)
    const resolvedData = await resolver.resolve(applicationId)

    // 3. Create document instance with snapshotted resolver data
    const instance = await this.instanceRepository.create({
      template_code: templateCode,
      application_id: applicationId,
      status: 'DRAFT',
      form_data: {},
      resolver_fields_json: resolvedData.fields as any,
      resolver_tables_json: resolvedData.tables as any,
      signature_data_json: {},
      final_fields_json: {},
      generated_docx_path: null,
      generated_pdf_path: null,
      document_id: null,
      generated_docx_id: null,
      generated_pdf_id: null,
      resolver_signatures_json: null,
      resolver_version: null
    })

    // 4. Audit Log
    await this.instanceRepository.addAuditLog({
      document_instance_id: instance.id,
      action: 'WORKSPACE_CREATED',
      user_id: 'system',
      user_name: 'System',
      role: null,
      ip_address: null,
      browser: null
    })

    return instance
  }

  async generateDocument(instanceId: string) {
    const instance = await this.instanceRepository.findById(instanceId)
    if (!instance) throw new Error("Instance not found")
    
    const template = await this.templateRepository.findByCode(instance.template_code)
    if (!template) throw new Error("Template not found")

    // 1. Resolve final fields
    const resolver = this.resolverRegistry.getResolver(template.template_code)
    const resolvedData = await resolver.resolve(instance.application_id!, { form_data: instance.form_data || {} })
    
    // 2. Load template file
    // Check multiple possible paths
    let templatePath = path.join(process.cwd(), 'uploads', 'templates', template.storage_path)
    if (!fs.existsSync(templatePath)) {
        templatePath = path.join(process.cwd(), 'uploads', template.storage_path)
    }
    if (!fs.existsSync(templatePath)) {
        templatePath = path.join(process.cwd(), template.storage_path)
    }
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at ${templatePath}`)
    }
    
    const content = fs.readFileSync(templatePath, 'binary')
    const zip = new PizZip(content)
    
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    })
    
    // 3. Render
    doc.render(resolvedData.fields)
    
    const buf = doc.getZip().generate({ type: 'nodebuffer' })
    
    // 4. Save via FileService
    const fileService = new FileService()
    const originalName = `${template.template_code}_${instance.application_id}.docx`
    
    let savedFileId = instance.generated_docx_path;
    
    if (savedFileId) {
      // Update existing file version
      await fileService.updateFile(savedFileId, {
        buffer: buf,
        original_name: originalName,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size_bytes: buf.length,
        owner_id: 'system',
      });
    } else {
      // Create new file record
      const savedFile = await fileService.uploadFile({
          buffer: buf,
          original_name: originalName,
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size_bytes: buf.length,
          owner_id: 'system',
          entity_type: 'document_instance',
          entity_id: instance.id,
          module: 'document-engine'
      });
      savedFileId = savedFile.id;
      
      // 5. Update instance with generated file ID
      await this.instanceRepository.update(instance.id, {
          generated_docx_path: savedFileId
      });
    }
    
    return { fileId: savedFileId }
  }

  async saveFormData(instanceId: string, formData: Record<string, any>, userId: string) {
    const instance = await this.instanceRepository.update(instanceId, {
      form_data: formData
    })

    await this.instanceRepository.addAuditLog({
      document_instance_id: instanceId,
      action: 'FORM_SAVED',
      user_id: String(userId),
      user_name: 'System',
      role: null,
      ip_address: null,
      browser: null
    })

    return instance
  }
}
