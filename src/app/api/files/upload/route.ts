import { NextResponse } from 'next/server';
import { fileService } from '@/modules/file-management/services/FileService';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;
    const module = formData.get('module') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // In a real app, you would get the ownerId from the session/context
    const ownerId = 'user-123'; // Mocked for now

    const fileRecord = await fileService.uploadFile({
      buffer,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      ownerId,
      entityType,
      entityId,
      module,
    });

    return NextResponse.json({ success: true, fileId: fileRecord.id });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
