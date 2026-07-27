import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IFileRepository } from '../../domain/repositories/IFileRepository'
import { StorageProvider } from '../../storage/StorageProvider'
import { Container } from '@/infrastructure/di/modules/core.di'

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
    
    // Note: If versionNumber is provided, we would need a findVersion query on repo
    // For simplicity, we just use the active version right now
    if (request.versionNumber && request.versionNumber !== version.versionNumber) {
      return Fail('Specific version downloading is not fully supported in this implementation yet')
    }

    try {
      const buffer = await this.storage.download(version.storagePath, version.bucket || undefined)
      
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
}
