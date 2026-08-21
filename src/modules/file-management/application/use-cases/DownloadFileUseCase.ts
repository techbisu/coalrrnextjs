import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IFileRepository } from '../../domain/repositories/IFileRepository'
import { StorageProvider } from '../../storage/StorageProvider'
import { Container } from '@/infrastructure/di/modules/core.di'
import { db } from '@/lib/db'

export interface DownloadFileRequest {
  fileId: string
  versionNumber?: number
  userId?: string
}

export interface DownloadFileResponse {
  buffer: Buffer
  mimeType: string
  originalName: string
}

export class DownloadFileUseCase implements IUseCase<DownloadFileRequest, DownloadFileResponse> {
  constructor(
    private readonly repo: IFileRepository,
    private readonly storage: StorageProvider
  ) {}

  async execute(request: DownloadFileRequest): Promise<Result<DownloadFileResponse>> {
    const existing = await this.repo.findById(request.fileId)
    
    if (!existing) {
      return Fail('File not found')
    }

    // Determine version
    let version = existing.activeVersion
    
    if (request.versionNumber && request.versionNumber !== version.versionNumber) {
      return Fail('Specific version downloading is not fully supported in this implementation yet')
    }

    try {
      let buffer: Buffer
      try {
        buffer = await this.storage.download(version.storagePath, version.bucket || undefined)
      } catch (err: any) {
        // Self-healing: If physical file missing on disk (ENOENT), auto-regenerate document instance
        if (err?.code === 'ENOENT' || String(err?.message || '').includes('ENOENT')) {
          const regenerated = await this.tryRegenerateMissingFile(existing.file)
          if (regenerated) {
            return Ok(regenerated)
          }
        }
        throw err
      }
      
      await Container.jobDispatcher.dispatch('auditLog', {
        type: 'CUSTOM_ACTIVITY',
        payload: {
          activity: `File downloaded securely: ${existing.file.originalName}`,
          userId: request.userId || 'system'
        }
      })

      return Ok({
        buffer,
        mimeType: version.mimeType,
        originalName: existing.file.originalName
      })
    } catch (e: any) {
      return Fail(e.message)
    }
  }

  private async tryRegenerateMissingFile(file: any): Promise<DownloadFileResponse | null> {
    try {
      const instance = await db.document_instance.findFirst({
        where: {
          OR: [
            { generated_docx_id: file.id },
            { generated_pdf_id: file.id },
            { id: file.entityId }
          ]
        }
      })

      if (!instance) return null

      const { generateDocumentUseCase } = await import('@/infrastructure/di/Container')
      const genResult = await generateDocumentUseCase.execute({ instanceId: instance.id })

      if (genResult.isSuccess) {
        const freshFile = await this.repo.findById(file.id)
        if (freshFile) {
          const freshBuffer = await this.storage.download(freshFile.activeVersion.storagePath)
          return {
            buffer: freshBuffer,
            mimeType: freshFile.activeVersion.mimeType,
            originalName: freshFile.file.originalName
          }
        }
      }
    } catch (e) {
      console.error('Auto-regeneration of missing physical file failed:', e)
    }
    return null
  }
}
