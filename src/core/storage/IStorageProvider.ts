export interface IStorageProvider {
  /**
   * Uploads a file buffer to the given path in the storage.
   * Returns the final URL or identifier for the file.
   */
  upload(path: string, file: Buffer, contentType?: string): Promise<string>
  
  /**
   * Downloads a file from the given path as a Buffer.
   */
  download(path: string): Promise<Buffer>
  
  /**
   * Deletes a file at the given path.
   */
  delete(path: string): Promise<void>
}
