import { FileRecord, FileVersion } from '../entities/FileRecord'

export interface IFileRepository {
  findByChecksum(checksum: string): Promise<{ file: FileRecord, activeVersionNumber: number } | null>
  findById(id: string): Promise<{ file: FileRecord, activeVersion: FileVersion } | null>
  create(file: FileRecord, version: FileVersion): Promise<void>
  updateChecksum(id: string, checksum: string): Promise<void>
  addVersion(version: FileVersion): Promise<void>
  softDelete(id: string): Promise<void>
  findAttachment(fileId: string, entityType: string, entityId: string): Promise<{ id: string, module: string | null } | null>
  createAttachment(params: { fileId: string, entityType: string, entityId: string, module?: string, attachedBy: string }): Promise<void>
  appendAttachmentModule(attachmentId: string, currentModules: string, newModule: string): Promise<void>
}
