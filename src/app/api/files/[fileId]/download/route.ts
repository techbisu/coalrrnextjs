import { PdfService } from '@/lib/document-engine/pdf';
import QRCode from 'qrcode';
import { NextResponse } from 'next/server';
import { fileService } from '@/modules/file-management/services/FileService';
import { getCurrentUser } from '@/lib/auth';
import { AuditService } from '@/audit/services/AuditService';

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const file_id = (await params).fileId;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const isPreview = url.searchParams.get('preview') === 'true';
  const forcePdf = url.searchParams.get('format') === 'pdf';

  try {
    // 1. permission Check
    // If token exists, validate token signature and expiry.
    // Otherwise, validate user session.
    let user_id = 'anonymous';
    let user_name = 'Anonymous User';
    if (token) {
      // Validate token (mocked logic for Signed URLs)
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (payload.exp < Date.now()) {
        return new NextResponse('Token Expired', { status: 403 });
      }
      user_id = 'guest-via-token';
      user_name = 'External Guest';
    } else {
      // Validate active session
      const user = await getCurrentUser();
      if (!user) return new NextResponse('Unauthorized', { status: 401 });
      user_id = user.id;
      user_name = user.name;
    }

    // 2. Fetch File
    let { buffer, mime_type, original_name } = await fileService.getFileBuffer(file_id);

    
    // 2.5 Convert DOCX to PDF if requested as preview or forced PDF
    if ((isPreview || forcePdf) && (mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime_type === 'application/msword')) {
      try {
        buffer = await PdfService.convertToPdf(buffer);
        mime_type = 'application/pdf';
        original_name = original_name.replace(/\.docx?$/i, '.pdf');
      } catch (e) {
        console.error('DOCX to PDF conversion failed during preview:', e);
      }
    }

    // 3. Audit Logging
    AuditService.log('DOWNLOAD', 'file-management', 'file_record', file_id, 'File downloaded securely', { user_id });

    // 4. Dynamic Watermarking & QR Code for PDFs (skipped only if explicitly preview)
    if (mime_type === 'application/pdf' && !isPreview) {
      try {
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Generate QR code image buffer (PNG)
        const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.company.com'}/verify/${file_id}`;
        const qrCodeBuffer = await QRCode.toBuffer(qrUrl, { margin: 1, scale: 4 });
        const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
        const qrDims = qrImage.scale(0.28); // scale down the QR code more for safe area

        // Use real user details if authenticated, fallback for tokens
        const downloaderName = user_name;
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const footerText = `Downloaded By: ${downloaderName} | Date: ${timestamp} | File ID: ${file_id} | COALRR System`;

        for (const page of pages) {
          const { width } = page.getSize();
          
          // Draw footer text at the bottom left
          page.drawText(footerText, {
            x: 40,
            y: 30, // pushed up slightly to safe area
            size: 8,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
          });

          // Draw actual QR code image at the bottom right
          page.drawImage(qrImage, {
            x: width - qrDims.width - 40,
            y: 20, // pushed up into safe area
            width: qrDims.width,
            height: qrDims.height,
          });
          
          // Draw tiny text below QR code
          page.drawText(`Scan to Verify`, {
             x: width - qrDims.width - 40,
             y: 10,
             size: 6,
             font: helvetica,
             color: rgb(0.5, 0.5, 0.5),
          });
        }

        buffer = Buffer.from(await pdfDoc.save());
      } catch (pdfError) {
        console.error('Failed to apply PDF watermark and QR code, proceeding with original:', pdfError);
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

// Trigger rebuild to clear Turbopack cache
