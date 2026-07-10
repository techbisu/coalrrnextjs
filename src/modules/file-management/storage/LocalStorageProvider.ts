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

  async upload(buffer: Buffer, original_name: string, mime_type: string): Promise<StorageUploadResult> {
    await this.ensureDir();
    
    // Generate Checksum
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    const checksum = hash.digest('hex');

    // Prevent overwriting local files by appending a timestamp or using a UUID
    // But since FileService handles deduplication, we can just save it uniquely
    const uniqueFileName = `${Date.now()}-${original_name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storage_path = path.join(this.uploadDir, uniqueFileName);

    await fs.writeFile(storage_path, buffer);

    return {
      storage_path: uniqueFileName,
      checksum,
      size_bytes: buffer.length,
    };
  }

  async download(storage_path: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, storage_path);
    return await fs.readFile(fullPath);
  }

  async delete(storage_path: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storage_path);
    try {
      await fs.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async getSignedUrl(storage_path: string, bucket?: string, expiresInSeconds = 3600): Promise<string> {
    // Local storage doesn't natively support S3-like signed URLs directly to a bucket.
    // So we generate a secure token that our API route can decipher.
    // In a real app, you'd use a JWT or crypto signature.
    const payload = JSON.stringify({ path: storage_path, exp: Date.now() + expiresInSeconds * 1000 });
    const token = Buffer.from(payload).toString('base64');
    
    return `/api/files/download-signed?token=${token}`;
  }
}

// Singleton export
export const localStorageProvider = new LocalStorageProvider();
