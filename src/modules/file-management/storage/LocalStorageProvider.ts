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

    const datePath = new Date().toISOString().split('T')[0].replace(/-/g, path.sep);
    const targetDir = path.join(this.uploadDir, datePath);
    
    try {
      await fs.access(targetDir);
    } catch {
      await fs.mkdir(targetDir, { recursive: true });
    }
    
    const uniqueFileName = `${Date.now()}-${original_name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storage_path = path.posix.join(new Date().toISOString().split('T')[0].replace(/-/g, '/'), uniqueFileName);
    const full_path = path.join(targetDir, uniqueFileName);

    await fs.writeFile(full_path, buffer);

    return {
      storage_path: storage_path,
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
