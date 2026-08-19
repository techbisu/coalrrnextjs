import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { IFileRepository } from '../../domain/repositories/IFileRepository'
import { FileRecord, FileVersion } from '../../domain/entities/FileRecord'

/** PrismaFileRepository — Persistent storage implementation for file_record */
export class PrismaFileRepository implements IFileRepository {
  async findByChecksum(checksum: string): Promise<{ file: FileRecord, activeVersionNumber: number } | null> {
    const existing = await db.file_record.findUnique({
      where: { checksum },
      include: { file_version: { orderBy: { version_number: 'desc' }, take: 1 } },
    })

    if (!existing) return null

    return {
      file: FileRecord.create({
        id: existing.id,
        originalName: existing.original_name || '',
        checksum: existing.checksum || '',
        ownerId: existing.owner_id || 'system',
        tags: existing.tags ? JSON.parse(existing.tags) : null,
        // @ts-ignore: mapping pending prisma generate
        isActive: existing.is_active ?? true,
      }),
      activeVersionNumber: existing.file_version[0]?.version_number || 1
    }
  }

  async findById(id: string): Promise<{ file: FileRecord, activeVersion: FileVersion } | null> {
    const existing = await db.file_record.findFirst({
      where: {
        OR: [
          { id },
          { original_name: id },
        ],
      },
      include: { file_version: { orderBy: { version_number: 'desc' }, take: 1 } },
    })

    if (!existing || existing.file_version.length === 0) return null

    return {
      file: FileRecord.create({
        id: existing.id,
        originalName: existing.original_name || '',
        checksum: existing.checksum || '',
        ownerId: existing.owner_id || 'system',
        tags: existing.tags ? JSON.parse(existing.tags) : null,
        // @ts-ignore: mapping pending prisma generate
        isActive: existing.is_active ?? true,
      }),
      activeVersion: FileVersion.create({
        id: existing.file_version[0].id,
        fileId: existing.file_version[0].file_id,
        versionNumber: existing.file_version[0].version_number,
        storageProvider: existing.file_version[0].storage_provider || '',
        storagePath: existing.file_version[0].storage_path || '',
        bucket: existing.file_version[0].bucket,
        mimeType: existing.file_version[0].mime_type || '',
        extension: existing.file_version[0].extension || '',
        sizeBytes: existing.file_version[0].size_bytes || BigInt(0),
        entryBy: existing.file_version[0].entry_by || 'system'
      })
    }
  }

  async create(file: FileRecord, version: FileVersion): Promise<void> {
    const fileId = file.id || randomUUID()
    await db.file_record.create({
      data: {
        id: fileId,
        original_name: file.originalName,
        owner_id: file.ownerId,
        checksum: file.checksum,
        is_active: file.isActive ?? true,
        tags: file.tags ? JSON.stringify(file.tags) : null,
        updt_ts: new Date(),
        file_version: {
          create: {
            id: version.id || randomUUID(),
            version_number: version.versionNumber,
            storage_provider: version.storageProvider,
            storage_path: version.storagePath,
            bucket: version.bucket,
            mime_type: version.mimeType,
            extension: version.extension,
            size_bytes: version.sizeBytes,
            entry_by: version.entryBy,
            updt_ts: new Date(),
          }
        }
      }
    })
  }

  async updateChecksum(id: string, checksum: string): Promise<void> {
    await db.file_record.update({
      where: { id },
      data: { checksum, updt_ts: new Date() }
    })
  }

  async addVersion(version: FileVersion): Promise<void> {
    await db.file_version.create({
      data: {
        id: version.id || randomUUID(),
        file_id: version.fileId,
        version_number: version.versionNumber,
        storage_provider: version.storageProvider,
        storage_path: version.storagePath,
        bucket: version.bucket,
        mime_type: version.mimeType,
        extension: version.extension,
        size_bytes: version.sizeBytes,
        entry_by: version.entryBy,
        updt_ts: new Date(),
      }
    })
  }

  async softDelete(id: string): Promise<void> {
    await db.file_record.update({
      where: { id },
      data: { is_active: false, updt_ts: new Date() }
    })
  }

  async findAttachment(fileId: string, entityType: string, entityId: string): Promise<{ id: string, module: string | null } | null> {
    const attachment = await db.file_attachment.findUnique({
      where: {
        file_id_entity_type_entity_id: {
          file_id: fileId,
          entity_type: entityType,
          entity_id: entityId
        }
      },
      select: { id: true, module: true }
    })
    return attachment
  }

  async createAttachment(params: { fileId: string, entityType: string, entityId: string, module?: string, attachedBy: string }): Promise<void> {
    await db.file_attachment.create({
      data: {
        id: randomUUID(),
        file_id: params.fileId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        module: params.module,
        attached_by: params.attachedBy,
        updt_ts: new Date(),
      }
    })
  }

  async appendAttachmentModule(attachmentId: string, currentModules: string, newModule: string): Promise<void> {
    const existingModules = currentModules ? currentModules.split(',') : [];
    if (!existingModules.includes(newModule)) {
      existingModules.push(newModule);
      await db.file_attachment.update({
        where: { id: attachmentId },
        data: { 
          module: existingModules.join(','),
          updt_ts: new Date()
        }
      });
    }
  }
}
