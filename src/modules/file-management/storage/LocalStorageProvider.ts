import { StorageProvider } from './StorageProvider';
import { StorageUploadResult } from '../types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class LocalStorageProvider implements StorageProvider {
  readonly name = 'LOCAL';
  private uploadDir: string;

  constructor() {
    // Save to an uploads folder outside the src directory
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<StorageUploadResult> {
    await this.ensureDir();
    
    // Generate Checksum
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    const checksum = hash.digest('hex');

    // Prevent overwriting local files by appending a timestamp or using a UUID
    // But since FileService handles deduplication, we can just save it uniquely
    const uniqueFileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = path.join(this.uploadDir, uniqueFileName);

    await fs.writeFile(storagePath, buffer);

    return {
      storagePath: uniqueFileName,
      checksum,
      sizeBytes: buffer.length,
    };
  }

  async download(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, storagePath);
    return await fs.readFile(fullPath);
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);
    try {
      await fs.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async getSignedUrl(storagePath: string, bucket?: string, expiresInSeconds = 3600): Promise<string> {
    // Local storage doesn't natively support S3-like signed URLs directly to a bucket.
    // So we generate a secure token that our API route can decipher.
    // In a real app, you'd use a JWT or crypto signature.
    const payload = JSON.stringify({ path: storagePath, exp: Date.now() + expiresInSeconds * 1000 });
    const token = Buffer.from(payload).toString('base64');
    
    return `/api/files/download-signed?token=${token}`;
  }
}

// Singleton export
export const localStorageProvider = new LocalStorageProvider();
