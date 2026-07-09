import { NextResponse } from 'next/server';
import { fileService } from '@/modules/file-management/services/FileService';
import { AuditService } from '@/audit/services/AuditService';

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const fileId = (await params).fileId;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  try {
    // 1. Permission Check
    // If token exists, validate token signature and expiry.
    // Otherwise, validate user session.
    let userId = 'anonymous';
    if (token) {
      // Validate token (mocked logic for Signed URLs)
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (payload.exp < Date.now()) {
        return new NextResponse('Token Expired', { status: 403 });
      }
      userId = 'guest-via-token';
    } else {
      // Validate active session
      // const session = await getSession();
      // if (!session) return new NextResponse('Unauthorized', { status: 401 });
      userId = 'active-user'; 
    }

    // 2. Fetch File
    let { buffer, mimeType, originalName } = await fileService.getFileBuffer(fileId);

    // 3. Audit Logging
    AuditService.log('DOWNLOAD', 'file-management', 'FileRecord', fileId, 'File downloaded securely', { userId });

    // 4. Dynamic Watermarking for PDFs
    if (mimeType === 'application/pdf') {
      try {
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Use real user details if authenticated, fallback for tokens
        const downloaderName = userId === 'guest-via-token' ? 'External Guest' : 'Active User';
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const footerText = `Downloaded By: ${downloaderName} | Date: ${timestamp} | File ID: ${fileId} | COALRR System`;

        for (const page of pages) {
          const { width } = page.getSize();
          
          // Draw footer text at the bottom left
          page.drawText(footerText, {
            x: 40,
            y: 20,
            size: 8,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
          });

          // Draw QR code placeholder at the bottom right
          page.drawText(`Verify: https://portal.company.com/verify/${fileId}`, {
             x: width - 200,
             y: 20,
             size: 8,
             font: helvetica,
             color: rgb(0.1, 0.1, 0.8),
          });
        }

        buffer = Buffer.from(await pdfDoc.save());
      } catch (pdfError) {
        console.error('Failed to apply PDF watermark, proceeding with original:', pdfError);
      }
    }

    // 5. Stream response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${originalName}"`, 
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Download Error:', error);
    return new NextResponse(error.message || 'Not Found', { status: 404 });
  }
}
