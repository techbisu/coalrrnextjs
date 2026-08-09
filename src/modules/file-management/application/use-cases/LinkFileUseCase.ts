import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IFileRepository } from '../../domain/repositories/IFileRepository'
import { FileRecord } from '../../domain/entities/FileRecord'

export interface LinkFileRequest {
  fileId: string
  entityType: string
  entityId: string
  module?: string
  ownerId: string
}

export class LinkFileUseCase implements IUseCase<LinkFileRequest, FileRecord> {
  constructor(private readonly repo: IFileRepository) {}

  async execute(request: LinkFileRequest): Promise<Result<FileRecord>> {
    const existing = await this.repo.findById(request.fileId)
    
    if (!existing) {
      return Fail('File not found')
    }

    const existingAttachment = await this.repo.findAttachment(request.fileId, request.entityType, request.entityId)

    if (!existingAttachment) {
      await this.repo.createAttachment({
        fileId: request.fileId,
        entityType: request.entityType,
        entityId: request.entityId,
        module: request.module,
        attachedBy: request.ownerId
      })
    } else if (request.module) {
      await this.repo.appendAttachmentModule(existingAttachment.id, existingAttachment.module || '', request.module)
    }

    const { EventBus } = await import('@/core/notifications/EventBus')
    await EventBus.publish({
      event_name: 'FILE_ASSIGNED',
      module: request.module || 'file-management',
      user_id: request.ownerId,
      entity_id: request.entityId,
      data: {
        fileId: request.fileId,
        fileName: existing.file.originalName,
        entityType: request.entityType,
      }
    })

    return Ok(existing.file)
  }
}
