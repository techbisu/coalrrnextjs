import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import ImageModule from 'docxtemplater-image-module-free'

function findFileById(dir: string, fileId: string): string | null {
  if (!fs.existsSync(dir)) return null
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    try {
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        const res = findFileById(fullPath, fileId)
        if (res) return res
      } else if (item.includes(fileId)) {
        return fullPath
      }
    } catch (_) {}
  }
  return null
}

function resolveImageBuffer(tagValue: any): Buffer | null {
  if (!tagValue) return null
  if (Buffer.isBuffer(tagValue)) return tagValue

  if (typeof tagValue === 'string') {
    if (fs.existsSync(tagValue)) {
      return fs.readFileSync(tagValue)
    }

    const uploadsDir = path.join(process.cwd(), 'uploads')

    // 1. Try file ID match in uploads dir
    const fileIdMatch = tagValue.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i) || tagValue.match(/[a-f0-9]{32}/i)
    if (fileIdMatch) {
      const fileId = fileIdMatch[0]
      const foundPath = findFileById(uploadsDir, fileId)
      if (foundPath && fs.existsSync(foundPath)) {
        return fs.readFileSync(foundPath)
      }
    }

    // 2. Try cleaned filename or path segment
    const cleanTag = tagValue.replace(/^\/api\/files\/(download\/)?/, '').replace(/\/download$/, '')
    const baseTag = path.basename(cleanTag)
    if (baseTag && baseTag.length > 3) {
      const foundPath = findFileById(uploadsDir, baseTag)
      if (foundPath && fs.existsSync(foundPath)) {
        return fs.readFileSync(foundPath)
      }
    }
  }

  return null
}

export class DocxGeneratorEngine {
  /**
   * Generates a .docx file buffer by merging the template with the provided data.
   * Supports dynamic image embedding via ImageModule.
   * @param storagePath The relative path to the template file in the uploads directory
   * @param data The resolved data/fields to inject into the template
   * @returns A Buffer containing the generated .docx file
   */
  static generate(storagePath: string, data: any): Buffer {
    // 1. Try internal core engine templates directory first
    const baseName = path.basename(storagePath)
    let templatePath = path.join(process.cwd(), 'src', 'lib', 'engines', 'docx', 'templates', baseName)
    
    // 2. Fallback to uploads/templates for legacy compatibility
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'uploads', 'templates', storagePath)
    }
    // 3. Fallback to raw uploads directory
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'uploads', storagePath)
    }
    // 4. Absolute fallback
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), storagePath)
    }
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}`)
    }
    
    const content = fs.readFileSync(templatePath, 'binary')
    const zip = new PizZip(content)

    // Configure ImageModule for embedding photos in Word templates with zero top-offset & compact passport size
    const imageOptions = {
      centered: true,
      fileType: 'docx',
      getImage(tagValue: any) {
        const buf = resolveImageBuffer(tagValue)
        if (buf) return buf
        // Fallback transparent 1x1 PNG if image file not found on disk
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
      },
      getSize() {
        // Photo dimensions (119px x 159px) for refined, sleek, thin 2pt (~3.5px) micro-gap on all 4 sides
        return [119, 159]
      }
    }

    const imageModule = new ImageModule(imageOptions)
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule],
      nullGetter() { return '' },
    })
    
    // Sanitize: convert undefined / null / NaN to empty string
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value === null || value === undefined) {
        sanitized[key] = ''
      } else if (typeof value === 'number' && isNaN(value)) {
        sanitized[key] = ''
      } else {
        sanitized[key] = value
      }
    }

    doc.render(sanitized)
    
    return doc.getZip().generate({ type: 'nodebuffer' })
  }
}
