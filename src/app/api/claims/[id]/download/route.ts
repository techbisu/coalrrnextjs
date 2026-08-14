import { NextRequest, NextResponse } from 'next/server'
import { FormIResolver } from '@/modules/document-engine/application/resolvers/FormIResolver'
import { DocxGeneratorEngine, PdfService } from '@/lib/engines'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const url = new URL(req.url)
    const format = url.searchParams.get('format') || 'docx' // 'docx' or 'pdf'

    const resolver = new FormIResolver()
    const resolved = await resolver.resolve(id)

    if (!resolved.fields || !resolved.fields.ClaimCode) {
      return new NextResponse('Claim not found', { status: 404 })
    }

    const payload = {
      ...(resolved.fields as any),
      ...(resolved.tables as any),
    }

    // Generate exact docx buffer from Form-I-Template.docx
    const docxBuffer = DocxGeneratorEngine.generate('Form-I-Template.docx', payload)
    const claimCode = String(resolved.fields.ClaimCode || id).replace(/[^a-zA-Z0-9_-]/g, '_')

    if (format === 'pdf') {
      try {
        const pdfBuffer = await PdfService.convertToPdf(docxBuffer)
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Form-I_${claimCode}.pdf"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
      } catch (pdfErr) {
        console.warn('PDF conversion failed, falling back to DOCX download:', pdfErr)
      }
    }

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Form-I_${claimCode}.docx"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('[Download Form-I] Error:', error)
    return new NextResponse(error.message || 'Server Error', { status: 500 })
  }
}
