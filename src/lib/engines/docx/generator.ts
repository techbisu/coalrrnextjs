import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

export class DocxGeneratorEngine {
  /**
   * Generates a .docx file buffer by merging the template with the provided data.
   * @param storagePath The relative path to the template file in the uploads directory
   * @param data The resolved data/fields to inject into the template
   * @returns A Buffer containing the generated .docx file
   */
  static generate(storagePath: string, data: any): Buffer {
    // 1. Try internal core engine templates directory first (e.g. for Form-XXII)
    let templatePath = path.join(process.cwd(), 'src', 'lib', 'engines', 'docx', 'templates', storagePath)
    
    // 2. Fallback to uploads/templates for legacy compatibility (for custom user-uploaded templates)
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
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })
    
    doc.render(data)
    
    return doc.getZip().generate({ type: 'nodebuffer' })
  }
}
