import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IFileRepository } from '../../domain/repositories/IFileRepository'
import { FileRecord, FileVersion } from '../../domain/entities/FileRecord'
import { StorageProvider } from '../../storage/StorageProvider'
import { IVirusScanner } from '../../security/IVirusScanner'
import { uploadConfig } from '@/core/config/upload.config'
import crypto from 'crypto'
import { randomUUID } from 'crypto'
import { Container } from '@/infrastructure/di/modules/core.di'

export interface UploadFileRequest {
  buffer: Buffer
  originalName: string
  mimeType: string
  sizeBytes: number
  ownerId?: string
  tags?: string[]
  entityType?: string
  entityId?: string
  module?: string
  isActive?: boolean
}

export class UploadFileUseCase implements IUseCase<UploadFileRequest, FileRecord> {
  constructor(
    private readonly repo: IFileRepository,
    private readonly storage: StorageProvider,
    private readonly scanner: IVirusScanner
  ) {}

  async execute(request: UploadFileRequest): Promise<Result<FileRecord>> {
    const ownerId = request.ownerId || 'system'

    // Security: File Size Check
    const maxSize = uploadConfig.maxFileSizeMb * 1024 * 1024
    if (request.sizeBytes > maxSize) {
      return Fail(`File size exceeds the limit of ${uploadConfig.maxFileSizeMb}MB`)
    }

    // Security: Allowed Types Check
    if (!(uploadConfig.allowedTypes as readonly string[]).includes(request.mimeType)) {
      return Fail(`File type ${request.mimeType} is not allowed`)
    }

    // Security: Virus Scan
    if (uploadConfig.enableVirusScan) {
      const isClean = await this.scanner.scanBuffer(request.buffer)
      if (!isClean) {
        return Fail('Upload rejected: Virus detected')
      }
    }

    const checksum = crypto.createHash('sha256').update(request.buffer).digest('hex')

    // Duplicate Detection
    let existingData = await this.repo.findByChecksum(checksum)
    let fileRecord: FileRecord

    if (existingData) {
      // Reuse existing file
      fileRecord = existingData.file
    } else {
      // Upload to Storage
      const uploadResult = await this.storage.upload(request.buffer, request.originalName, request.mimeType)

      const fileId = randomUUID()
      const versionId = randomUUID()

      fileRecord = FileRecord.create({
        id: fileId,
        originalName: request.originalName,
        ownerId,
        checksum: uploadResult.checksum,
        tags: request.tags,
        isActive: request.isActive
      })

      const fileVersion = FileVersion.create({
        id: versionId,
        fileId: fileId,
        versionNumber: 1,
        storageProvider: this.storage.name,
        storagePath: uploadResult.storage_path,
        bucket: uploadResult.bucket,
        mimeType: request.mimeType,
        extension: request.originalName.split('.').pop() || '',
        sizeBytes: uploadResult.size_bytes,
        entryBy: ownerId
      })

      await this.repo.create(fileRecord, fileVersion)

      await Container.jobDispatcher.dispatch('auditLog', {
        type: 'CUSTOM_ACTIVITY',
        payload: {
          activity: `New file uploaded: ${request.originalName}`,
          userId: ownerId
        }
      })

      const { EventBus } = await import('@/core/notifications/EventBus')
      await EventBus.publish({
        event_name: 'FILE_UPLOADED',
        module: request.module || 'file-management',
        user_id: ownerId,
        entity_id: fileId,
        data: {
          fileId: fileRecord.id,
          fileName: request.originalName,
        }
      })
    }

    // Attach to Entity
    if (request.entityType && request.entityId) {
      const existingAttachment = await this.repo.findAttachment(fileRecord.id!, request.entityType, request.entityId)

      if (!existingAttachment) {
        await this.repo.createAttachment({
          fileId: fileRecord.id!,
          entityType: request.entityType,
          entityId: request.entityId,
          module: request.module,
          attachedBy: ownerId
        })
      } else if (request.module) {
        await this.repo.appendAttachmentModule(existingAttachment.id, existingAttachment.module || '', request.module)
      }

      const { EventBus } = await import('@/core/notifications/EventBus')
      await EventBus.publish({
        event_name: 'FILE_ASSIGNED',
        module: request.module || 'file-management',
        user_id: ownerId,
        entity_id: request.entityId,
        data: {
          fileId: fileRecord.id,
          fileName: request.originalName,
          entityType: request.entityType,
        }
      })
    }

    return Ok(fileRecord)
  }
}
