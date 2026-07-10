import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

// Configuration
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local' // 'local' or 's3'
const STORAGE_ROOT = path.join(process.cwd(), 'private_storage')

// S3 Configuration
const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  }
})
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'coalrr-documents'

export class StorageService {
  /**
   * Ensure the local root storage directory exists
   */
  static async init() {
    if (STORAGE_PROVIDER === 'local') {
      try {
        await fs.mkdir(STORAGE_ROOT, { recursive: true })
      } catch (e) {
        console.error('Failed to init local storage', e)
      }
    }
  }

  /**
   * Save a file to the private storage (Local or S3)
   * @param buffer The file buffer
   * @param extension The file extension (e.g., '.docx')
   * @param subDir Optional subdirectory (e.g., 'templates' or 'instances')
   * @returns The relative storage path
   */
  static async saveFile(buffer: Buffer, extension: string, subDir = ''): Promise<string> {
    await this.init()
    const file_name = `${crypto.randomUUID()}${extension}`
    const relativePath = path.join(subDir, file_name).replace(/\\/g, '/')

    if (STORAGE_PROVIDER === 's3') {
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: relativePath,
        Body: buffer,
        // Determine content type
        ContentType: extension === '.pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }))
    } else {
      const targetDir = path.join(STORAGE_ROOT, subDir)
      await fs.mkdir(targetDir, { recursive: true })
      const fullPath = path.join(targetDir, file_name)
      await fs.writeFile(fullPath, buffer)
    }
    
    return relativePath
  }

  /**
   * Read a file from private storage (Local or S3)
   * @param relativePath The path stored in the database
   */
  static async readFile(relativePath: string): Promise<Buffer> {
    if (STORAGE_PROVIDER === 's3') {
      const response = await s3.send(new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: relativePath
      }))
      if (!response.Body) throw new Error('File not found in S3')
      const arrayBuffer = await response.Body.transformToByteArray()
      return Buffer.from(arrayBuffer)
    } else {
      const fullPath = path.join(STORAGE_ROOT, relativePath)
      return await fs.readFile(fullPath)
    }
  }

  /**
   * Check if a file exists
   */
  static async fileExists(relativePath: string): Promise<boolean> {
    if (STORAGE_PROVIDER === 's3') {
      try {
        await s3.send(new HeadObjectCommand({
          Bucket: S3_BUCKET,
          Key: relativePath
        }))
        return true
      } catch {
        return false
      }
    } else {
      try {
        const fullPath = path.join(STORAGE_ROOT, relativePath)
        await fs.access(fullPath)
        return true
      } catch {
        return false
      }
    }
  }
}

