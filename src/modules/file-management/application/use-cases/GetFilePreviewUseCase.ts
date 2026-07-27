import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IFileRepository } from '../../domain/repositories/IFileRepository'
import { StorageProvider } from '../../storage/StorageProvider'

export interface GetFilePreviewRequest {
  fileId: string
}

export class GetFilePreviewUseCase implements IUseCase<GetFilePreviewRequest, string> {
  constructor(
    private readonly repo: IFileRepository,
    private readonly storage: StorageProvider
  ) {}

  async execute(request: GetFilePreviewRequest): Promise<Result<string>> {
    const existing = await this.repo.findById(request.fileId)
    
    if (!existing) {
      return Fail('File not found')
    }

    try {
      const url = await this.storage.getSignedUrl(
        existing.activeVersion.storagePath, 
        existing.activeVersion.bucket || undefined
      )
      return Ok(url)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
