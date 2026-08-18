import libre from 'libreoffice-convert'
import { promisify } from 'util'
import mammoth from 'mammoth'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { randomUUID } from 'crypto'

const convertAsync = promisify(libre.convert)
const execFileAsync = promisify(execFile)

export class PdfService {
  /**
   * Converts a DOCX buffer to a PDF buffer with 100% exact 1:1 fidelity.
   * 1. On Windows with Microsoft Word installed: Uses Microsoft Word's native PDF export engine (ExportAsFixedFormat) for authentic pixel-perfect rendering.
   * 2. On Linux/Unix with LibreOffice: Uses libreoffice-convert.
   * 3. Fallback: Uses Headless Chromium (Edge/Chrome).
   * @param docxBuffer Binary buffer of the generated DOCX
   * @returns Binary buffer of the PDF
   */
  static async convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
    if (process.platform === 'win32') {
      const librePaths = [
        'C:\\Program Files\\LibreOffice\\program',
        'C:\\Program Files (x86)\\LibreOffice\\program',
      ]
      for (const lp of librePaths) {
        if (fs.existsSync(lp) && !process.env.PATH?.includes(lp)) {
          process.env.PATH = `${lp};${process.env.PATH}`
        }
      }
    }

    // 1. Try LibreOffice first (works on Windows if installed in standard path, and on Linux servers)
    try {
      const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined)
      return pdfBuffer as Buffer
    } catch (libreErr: any) {
      // 2. If LibreOffice is not installed, auto-fallback to Microsoft Word on Windows
      if (process.platform === 'win32') {
        try {
          return await this.convertDocxToPdfViaWord(docxBuffer)
        } catch (wordErr: any) {
          console.warn('[PdfService] Word COM conversion failed, trying Chromium fallback:', wordErr.message)
        }
      }

      // 3. Fallback to Chromium Headless if neither LibreOffice nor Word is available
      return await this.convertDocxToPdfViaChromium(docxBuffer)
    }
  }

  private static async convertDocxToPdfViaWord(docxBuffer: Buffer): Promise<Buffer> {
    const tmpId = randomUUID()
    const tmpDir = os.tmpdir()
    const tmpDocxPath = path.join(tmpDir, `form_doc_${tmpId}.docx`)
    const tmpPdfPath = path.join(tmpDir, `form_doc_${tmpId}.pdf`)
    const tmpPsPath = path.join(tmpDir, `convert_${tmpId}.ps1`)

    const psScript = `
$docxPath = "${tmpDocxPath.replace(/\\/g, '\\\\')}"
$pdfPath = "${tmpPdfPath.replace(/\\/g, '\\\\')}"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    $doc = $word.Documents.Open($docxPath, $false, $true)
    $doc.ExportAsFixedFormat($pdfPath, 17)
    $doc.Close(0)
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
} finally {
    try {
        $word.Quit(0)
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    } catch {}
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
`

    try {
      await fs.promises.writeFile(tmpDocxPath, docxBuffer)
      await fs.promises.writeFile(tmpPsPath, psScript, 'utf8')

      await execFileAsync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpPsPath])

      const pdfBytes = await fs.promises.readFile(tmpPdfPath)
      return Buffer.from(pdfBytes)
    } finally {
      try {
        if (fs.existsSync(tmpDocxPath)) await fs.promises.unlink(tmpDocxPath)
        if (fs.existsSync(tmpPdfPath)) await fs.promises.unlink(tmpPdfPath)
        if (fs.existsSync(tmpPsPath)) await fs.promises.unlink(tmpPsPath)
      } catch (_) {}
    }
  }

  private static async findChromiumPath(): Promise<string | null> {
    const candidates = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ]

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p
      }
    }
    return null
  }

  private static async convertDocxToPdfViaChromium(docxBuffer: Buffer): Promise<Buffer> {
    const browserPath = await this.findChromiumPath()
    if (!browserPath) {
      throw new Error('No Chromium or Edge browser found for PDF conversion')
    }

    const { value: rawHtml } = await mammoth.convertToHtml({ buffer: docxBuffer })

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 15mm;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12px;
      line-height: 1.45;
      color: #000;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, p {
      margin: 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      page-break-inside: avoid;
    }
    table, th, td {
      border: 1.5px solid #000;
    }
    th, td {
      padding: 5px 6px;
      font-size: 10.5px;
      text-align: left;
      vertical-align: middle;
    }
    th {
      font-weight: bold;
      background-color: #f8fafc;
    }
    strong, b {
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${rawHtml}
</body>
</html>`

    const tmpId = randomUUID()
    const tmpDir = os.tmpdir()
    const tmpHtmlPath = path.join(tmpDir, `form_doc_${tmpId}.html`)
    const tmpPdfPath = path.join(tmpDir, `form_doc_${tmpId}.pdf`)

    try {
      await fs.promises.writeFile(tmpHtmlPath, fullHtml, 'utf8')

      await execFileAsync(browserPath, [
        '--headless',
        '--disable-gpu',
        '--allow-file-access-from-files',
        '--run-all-compositor-stages-before-draw',
        `--print-to-pdf=${tmpPdfPath}`,
        tmpHtmlPath,
      ])

      const pdfBytes = await fs.promises.readFile(tmpPdfPath)
      return Buffer.from(pdfBytes)
    } catch (err: any) {
      console.error('[PdfService] Chromium PDF conversion failed:', err)
      throw new Error(`PDF conversion failed: ${err.message}`)
    } finally {
      try {
        if (fs.existsSync(tmpHtmlPath)) await fs.promises.unlink(tmpHtmlPath)
        if (fs.existsSync(tmpPdfPath)) await fs.promises.unlink(tmpPdfPath)
      } catch (_) {}
    }
  }
}
