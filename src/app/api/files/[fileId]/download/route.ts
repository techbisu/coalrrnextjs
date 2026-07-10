import { NextResponse } from 'next/server';
import { fileService } from '@/modules/file-management/services/FileService';
import { AuditService } from '@/audit/services/AuditService';

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const file_id = (await params).fileId;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  try {
    // 1. permission Check
    // If token exists, validate token signature and expiry.
    // Otherwise, validate user session.
    let user_id = 'anonymous';
    if (token) {
      // Validate token (mocked logic for Signed URLs)
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (payload.exp < Date.now()) {
        return new NextResponse('Token Expired', { status: 403 });
      }
      user_id = 'guest-via-token';
    } else {
      // Validate active session
      // const session = await getSession();
      // if (!session) return new NextResponse('Unauthorized', { status: 401 });
      user_id = 'active-user'; 
    }

    // 2. Fetch File
    let { buffer, mime_type, original_name } = await fileService.getFileBuffer(file_id);

    // 3. Audit Logging
    AuditService.log('DOWNLOAD', 'file-management', 'file_record', file_id, 'File downloaded securely', { user_id });

    // 4. Dynamic Watermarking for PDFs
    if (mime_type === 'application/pdf') {
      try {
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Use real user details if authenticated, fallback for tokens
        const downloaderName = user_id === 'guest-via-token' ? 'External Guest' : 'Active user';
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const footerText = `Downloaded By: ${downloaderName} | Date: ${timestamp} | File ID: ${file_id} | COALRR System`;

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
          page.drawText(`Verify: https://portal.company.com/verify/${file_id}`, {
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
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mime_type,
        'Content-Disposition': `inline; filename="${original_name}"`, 
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Download Error:', error);
    return new NextResponse(error.message || 'Not Found', { status: 404 });
  }
}
