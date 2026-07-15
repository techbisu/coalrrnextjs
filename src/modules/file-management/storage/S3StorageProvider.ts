import { StorageProvider } from './StorageProvider';
import { StorageUploadResult } from '../types';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

export class S3StorageProvider implements StorageProvider {
  readonly name = 'S3';
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || '';
    
    this.s3 = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT, // Optional for MinIO/Spaces
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || ''
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for MinIO
    });
  }

  private generateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async upload(buffer: Buffer, original_name: string, mime_type: string): Promise<StorageUploadResult> {
    const checksum = this.generateChecksum(buffer);
    const extension = original_name.split('.').pop();
    const datePath = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const storage_path = `${datePath}/${checksum}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storage_path,
      Body: buffer,
      ContentType: mime_type,
    });

    await this.s3.send(command);

    return {
      storage_path,
      checksum,
      size_bytes: buffer.length,
      bucket: this.bucket,
    };
  }

  async download(storage_path: string, bucket?: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket || this.bucket,
      Key: storage_path,
    });

    const response = await this.s3.send(command);
    
    if (!response.Body) {
      throw new Error('S3 response body is empty');
    }

    const arrayBuffer = await response.Body.transformToByteArray();
    return Buffer.from(arrayBuffer);
  }

  async delete(storage_path: string, bucket?: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket || this.bucket,
      Key: storage_path,
    });

    await this.s3.send(command);
  }

  async getSignedUrl(storage_path: string, bucket?: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket || this.bucket,
      Key: storage_path,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }
}
