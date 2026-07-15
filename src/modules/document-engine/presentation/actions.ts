'use server'

import { documentInstanceRepositoryExport as documentInstanceRepository, documentTemplateRepositoryExport as documentTemplateRepository } from '@/infrastructure/di/Container'
import { DocumentWorkspaceService } from '../application/services/DocumentWorkspaceService'
import { ResolverRegistry } from '../application/ResolverRegistry'

const resolverRegistry = new ResolverRegistry()
const workspaceService = new DocumentWorkspaceService(
  documentInstanceRepository,
  documentTemplateRepository,
  resolverRegistry
)

export async function startDocumentWorkspaceAction(templateCode: string, applicationId: string) {
  try {
    const instance = await workspaceService.startWorkspace(templateCode, applicationId)
    return { success: true, instanceId: instance.id }
  } catch (error: any) {
    console.error('Error starting workspace:', error)
    return { success: false, error: error.message }
  }
}

export async function saveDocumentFormAction(instanceId: string, formData: Record<string, any>) {
  try {
    await workspaceService.saveFormData(instanceId, formData, 'system')
    return { success: true }
  } catch (error: any) {
    console.error('Error saving form data:', error)
    return { success: false, error: error.message }
  }
}

export async function generateDocumentAction(instanceId: string) {
  try {
    const result = await workspaceService.generateDocument(instanceId)
    return { success: true, fileId: result.fileId }
  } catch (error: any) {
    console.error('Error generating document:', error)
    return { success: false, error: error.message }
  }
}

export async function startAndFetchWorkspaceAction(templateCode: string, applicationId: string) {
  try {
    const instance = await workspaceService.startWorkspace(templateCode, applicationId)
    const template = await documentTemplateRepository.findByCode(templateCode)
    
    if (!template) {
      throw new Error(`Template not found: ${templateCode}`)
    }
    
    const parsedFields = template.fields.map(f => ({
      ...f,
      options: f.options ? (f.options as any) : undefined
    }));
    
    return { 
      success: true, 
      instance: {
        id: instance.id,
        generated_docx_path: instance.generated_docx_path
      },
      fields: parsedFields 
    }
  } catch (error: any) {
    console.error('Error starting workspace:', error)
    return { success: false, error: error.message }
  }
}
