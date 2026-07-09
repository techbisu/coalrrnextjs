import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

export class DocxGeneratorService {
  /**
   * Merges data into a DOCX template buffer
   * @param templateBuffer The binary buffer of the DOCX template
   * @param data The JSON object containing data (and dynamic answers) to merge
   * @returns The generated DOCX as a Buffer
   */
  static generate(templateBuffer: Buffer, data: Record<string, unknown>): Buffer {
    // Load the docx file as a zip
    const zip = new PizZip(templateBuffer)

    // Initialize docxtemplater
    // paragraphLoop: true allows looping over paragraphs
    // linebreaks: true keeps line breaks
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter() {
        return '' // Replace undefined/null with empty string
      }
    })

    // Set the template variables
    doc.render(data)

    // Get the zip document and generate it as a nodebuffer
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      // compression: DEFLATE adds compression
      compression: 'DEFLATE',
    })

    return buf
  }
}
