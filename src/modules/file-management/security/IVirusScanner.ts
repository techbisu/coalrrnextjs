export interface IVirusScanner {
  /**
   * Scans a file buffer for viruses.
   * Returns true if the file is clean, false if infected.
   */
  scanBuffer(buffer: Buffer): Promise<boolean>;
}
