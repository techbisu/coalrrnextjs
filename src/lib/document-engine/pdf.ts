import libre from 'libreoffice-convert'
import { promisify } from 'util'

const convertAsync = promisify(libre.convert)

export class PdfService {
  /**
   * Converts a DOCX buffer to a PDF buffer using libreoffice-convert.
   * Requires LibreOffice to be installed and available in PATH on the host.
   * @param docxBuffer Binary buffer of the generated DOCX
   * @returns Binary buffer of the PDF
   */
  static async convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
    try {
      // Ext is the target extension
      const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined)
      return pdfBuffer
    } catch (e) {
      console.error('Error converting DOCX to PDF:', e)
      throw new Error('PDF conversion failed')
    }
  }
}
