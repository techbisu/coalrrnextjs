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
    let existingFile = await db.file_record.findUnique({
      where: { checksum },
      include: { versions: { orderBy: { version_number: 'desc' }, take: 1 } },
    });

    let activeVersionNumber = 1;

    if (existingFile) {
      // Reuse existing file! Do not upload to physical storage again to save space.
      activeVersionNumber = existingFile.versions[0]?.version_number || 1;
    } else {
      // 2. Upload to Storage
      const uploadResult = await this.storage.upload(params.buffer, params.original_name, params.mime_type);

      // 3. Create file_record & file_version
      existingFile = await db.file_record.create({
        data: {
          original_name: params.original_name,
          owner_id: params.owner_id,
          checksum: uploadResult.checksum,
          tags: params.tags ? JSON.stringify(params.tags) : null,
          versions: {
            create: {
              version_number: 1,
              storage_provider: this.storage.name,
              storage_path: uploadResult.storage_path,
              bucket: uploadResult.bucket,
              mime_type: params.mime_type,
              extension: params.original_name.split('.').pop() || '',
              size_bytes: uploadResult.size_bytes,
              entry_by: params.owner_id,
            }
          }
        },
        include: { versions: true }
      });

      AuditService.log('UPLOAD', 'file-management', 'file_record', existingFile.id, 'New file uploaded', { user_id: params.owner_id });
    }

    // 4. Attach to Entity (Polymorphic)
    if (params.entity_type && params.entity_id) {
      // Avoid duplicate attachment
      const existingAttachment = await db.file_attachment.findUnique({
        where: {
          file_id_entity_type_entity_id: {
            file_id: existingFile.id,
            entity_type: params.entity_type,
            entity_id: params.entity_id
          }
        }
      });

      if (!existingAttachment) {
        await db.file_attachment.create({
          data: {
            file_id: existingFile.id,
            entity_type: params.entity_type,
            entity_id: params.entity_id,
            module: params.module,
            attached_by: params.owner_id,
          }
        });
      }
    }

    return existingFile;
  }

  async getFileBuffer(file_id: string, version_number?: number): Promise<{ buffer: Buffer; mime_type: string; original_name: string }> {
    const file_record = await db.file_record.findUnique({
      where: { id: file_id },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: version_number ? undefined : 1,
          where: version_number ? { version_number } : undefined
        }
      }
    });

    if (!file_record || file_record.versions.length === 0) {
      throw new Error('File not found');
    }

    const version = file_record.versions[0];
    const buffer = await this.storage.download(version.storage_path, version.bucket || undefined);

    return {
      buffer,
      mime_type: version.mime_type,
      original_name: file_record.original_name,
    };
  }

  async deleteFile(file_id: string, user_id?: string) {
    const file_record = await db.file_record.findUnique({
      where: { id: file_id },
      include: { versions: true }
    });

    if (!file_record) return;

    // For safety, we usually do Soft Delete in Enterprise Apps, but we'll flag it
    await db.file_record.update({
      where: { id: file_id },
      data: { status: 'SOFT_DELETED' }
    });

    AuditService.log('DELETE', 'file-management', 'file_record', file_id, 'File soft deleted', { user_id });
  }

  async getSignedPreviewUrl(file_id: string) {
    const file_record = await db.file_record.findUnique({
      where: { id: file_id },
      include: { versions: { orderBy: { version_number: 'desc' }, take: 1 } }
    });
    if (!file_record || file_record.versions.length === 0) throw new Error('File not found');

    const version = file_record.versions[0];
    return await this.storage.getSignedUrl(version.storage_path, version.bucket || undefined);
  }
}

export const fileService = new FileService();
