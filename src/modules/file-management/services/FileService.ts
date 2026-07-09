import { db } from '@/lib/db';
import { localStorageProvider } from '../storage/LocalStorageProvider';
import { StorageProvider } from '../storage/StorageProvider';
import { FileUploadParams } from '../types';
import crypto from 'crypto';
import { AuditService } from '@/audit/services/AuditService';

export class FileService {
  // We can inject different providers based on config, but default to local for now
  private storage: StorageProvider = localStorageProvider;

  private generateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Main entrypoint for uploading files. Handles deduplication.
   */
  async uploadFile(params: FileUploadParams) {
    const checksum = this.generateChecksum(params.buffer);

    // 1. Duplicate Detection Check
    let existingFile = await db.fileRecord.findUnique({
      where: { checksum },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    let activeVersionNumber = 1;

    if (existingFile) {
      // Reuse existing file! Do not upload to physical storage again to save space.
      activeVersionNumber = existingFile.versions[0]?.versionNumber || 1;
    } else {
      // 2. Upload to Storage
      const uploadResult = await this.storage.upload(params.buffer, params.originalName, params.mimeType);

      // 3. Create FileRecord & FileVersion
      existingFile = await db.fileRecord.create({
        data: {
          originalName: params.originalName,
          ownerId: params.ownerId,
          checksum: uploadResult.checksum,
          tags: params.tags ? JSON.stringify(params.tags) : null,
          versions: {
            create: {
              versionNumber: 1,
              storageProvider: this.storage.name,
              storagePath: uploadResult.storagePath,
              bucket: uploadResult.bucket,
              mimeType: params.mimeType,
              extension: params.originalName.split('.').pop() || '',
              sizeBytes: uploadResult.sizeBytes,
              createdBy: params.ownerId,
            }
          }
        },
        include: { versions: true }
      });

      AuditService.log('UPLOAD', 'file-management', 'FileRecord', existingFile.id, 'New file uploaded', { userId: params.ownerId });
    }

    // 4. Attach to Entity (Polymorphic)
    if (params.entityType && params.entityId) {
      // Avoid duplicate attachment
      const existingAttachment = await db.fileAttachment.findUnique({
        where: {
          fileId_entityType_entityId: {
            fileId: existingFile.id,
            entityType: params.entityType,
            entityId: params.entityId
          }
        }
      });

      if (!existingAttachment) {
        await db.fileAttachment.create({
          data: {
            fileId: existingFile.id,
            entityType: params.entityType,
            entityId: params.entityId,
            module: params.module,
            attachedBy: params.ownerId,
          }
        });
      }
    }

    return existingFile;
  }

  async getFileBuffer(fileId: string, versionNumber?: number): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    const fileRecord = await db.fileRecord.findUnique({
      where: { id: fileId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: versionNumber ? undefined : 1,
          where: versionNumber ? { versionNumber } : undefined
        }
      }
    });

    if (!fileRecord || fileRecord.versions.length === 0) {
      throw new Error('File not found');
    }

    const version = fileRecord.versions[0];
    const buffer = await this.storage.download(version.storagePath, version.bucket || undefined);

    return {
      buffer,
      mimeType: version.mimeType,
      originalName: fileRecord.originalName,
    };
  }

  async deleteFile(fileId: string, userId?: string) {
    const fileRecord = await db.fileRecord.findUnique({
      where: { id: fileId },
      include: { versions: true }
    });

    if (!fileRecord) return;

    // For safety, we usually do Soft Delete in Enterprise Apps, but we'll flag it
    await db.fileRecord.update({
      where: { id: fileId },
      data: { status: 'SOFT_DELETED' }
    });

    AuditService.log('DELETE', 'file-management', 'FileRecord', fileId, 'File soft deleted', { userId });
  }

  async getSignedPreviewUrl(fileId: string) {
    const fileRecord = await db.fileRecord.findUnique({
      where: { id: fileId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });
    if (!fileRecord || fileRecord.versions.length === 0) throw new Error('File not found');

    const version = fileRecord.versions[0];
    return await this.storage.getSignedUrl(version.storagePath, version.bucket || undefined);
  }
}

export const fileService = new FileService();
