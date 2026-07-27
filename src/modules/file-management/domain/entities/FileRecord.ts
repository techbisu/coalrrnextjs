export interface FileRecordProps {
  id?: string;
  originalName: string;
  checksum: string;
  ownerId: string;
  tags?: string[] | null;
}

export class FileRecord {
  private constructor(public props: FileRecordProps) {}

  public static create(props: FileRecordProps) {
    return new FileRecord(props);
  }

  get id() { return this.props.id; }
  get originalName() { return this.props.originalName; }
  get checksum() { return this.props.checksum; }
  get ownerId() { return this.props.ownerId; }
  get tags() { return this.props.tags; }
}

export interface FileVersionProps {
  id?: string;
  fileId: string;
  versionNumber: number;
  storageProvider: string;
  storagePath: string;
  bucket?: string | null;
  mimeType: string;
  extension: string;
  sizeBytes: bigint | number;
  entryBy: string;
}

export class FileVersion {
  private constructor(public props: FileVersionProps) {}

  public static create(props: FileVersionProps) {
    return new FileVersion(props);
  }

  get id() { return this.props.id; }
  get fileId() { return this.props.fileId; }
  get versionNumber() { return this.props.versionNumber; }
  get storageProvider() { return this.props.storageProvider; }
  get storagePath() { return this.props.storagePath; }
  get bucket() { return this.props.bucket; }
  get mimeType() { return this.props.mimeType; }
  get extension() { return this.props.extension; }
  get sizeBytes() { return this.props.sizeBytes; }
  get entryBy() { return this.props.entryBy; }
}
