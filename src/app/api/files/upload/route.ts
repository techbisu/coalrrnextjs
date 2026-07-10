import { NextResponse } from 'next/server';
import { fileService } from '@/modules/file-management/services/FileService';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entity_type = formData.get('entity_type') as string;
    const entity_id = formData.get('entity_id') as string;
    const module = formData.get('module') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // In a real app, you would get the owner_id from the session/context
    const owner_id = 'user-123'; // Mocked for now

    const file_record = await fileService.uploadFile({
      buffer,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      owner_id,
      entity_type,
      entity_id,
      module,
    });

    return NextResponse.json({ success: true, file_id: file_record.id });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
