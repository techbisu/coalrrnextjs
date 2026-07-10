import { StorageUploadResult } from '../types';

export interface StorageProvider {
  /**
   * The name of the provider (e.g., 'LOCAL', 'S3', 'AZURE')
   */
  readonly name: string;

  /**
   * Upload a file buffer to storage and return the storage path and checksum
   */
  upload(buffer: Buffer, original_name: string, mime_type: string): Promise<StorageUploadResult>;

  /**
   * Download a file from storage and return its buffer
   */
  download(storage_path: string, bucket?: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   */
  delete(storage_path: string, bucket?: string): Promise<void>;

  /**
   * Generate a secure, short-lived URL for downloading/previewing (if supported)
   */
  getSignedUrl(storage_path: string, bucket?: string, expiresInSeconds?: number): Promise<string>;
}
