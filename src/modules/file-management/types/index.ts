export interface FileUploadParams {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  ownerId?: string;
  tags?: string[];
  entityType?: string;
  entityId?: string;
  module?: string;
}

export interface StorageUploadResult {
  storagePath: string;
  bucket?: string;
  checksum: string;
  sizeBytes: number;
}
