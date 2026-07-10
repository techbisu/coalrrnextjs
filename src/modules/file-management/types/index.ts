export interface FileUploadParams {
  buffer: Buffer;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  owner_id?: string;
  tags?: string[];
  entity_type?: string;
  entity_id?: string;
  module?: string;
}

export interface StorageUploadResult {
  storage_path: string;
  bucket?: string;
  checksum: string;
  size_bytes: number;
}
