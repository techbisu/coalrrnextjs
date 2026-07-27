import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IFileRepository } from '../../domain/repositories/IFileRepository'
import { Container } from '@/infrastructure/di/modules/core.di'

export interface DeleteFileRequest {
  fileId: string
  userId?: string
}

export class DeleteFileUseCase implements IUseCase<DeleteFileRequest, void> {
  constructor(private readonly repo: IFileRepository) {}

  async execute(request: DeleteFileRequest): Promise<Result<void>> {
    const existing = await this.repo.findById(request.fileId)
    
    if (!existing) {
      return Fail('File not found')
    }

    // Soft Delete
    await this.repo.softDelete(request.fileId)

    await Container.jobDispatcher.dispatch('auditLog', {
      type: 'CUSTOM_ACTIVITY',
      payload: {
        activity: `File soft deleted: ${existing.file.originalName}`,
        userId: request.userId || 'system'
      }
    })

    return Ok(undefined)
  }
}
