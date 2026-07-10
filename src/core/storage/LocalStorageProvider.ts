import fs from 'fs/promises'
import path from 'path'
import { IStorageProvider } from './IStorageProvider'

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string

  constructor(baseDir: string = path.join(process.cwd(), 'upload')) {
    this.baseDir = baseDir
  }

  private getFullPath(relativePath: string): string {
    // Prevent directory traversal attacks
    const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '')
    return path.join(this.baseDir, safePath)
  }

  async upload(relativePath: string, file: Buffer, contentType?: string): Promise<string> {
    const fullPath = this.getFullPath(relativePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, file)
    
    // In Phase 5, if switching to S3, this would return an S3 URL.
    // For local storage, we just return the relative path.
    return relativePath
  }

  async download(relativePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(relativePath)
    return await fs.readFile(fullPath)
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = this.getFullPath(relativePath)
    try {
      await fs.unlink(fullPath)
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  }
}
