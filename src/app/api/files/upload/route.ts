import { NextResponse } from 'next/server';
import { fileService } from '@/modules/file-management/services/FileService';
import { DocumentUploadSchema } from '@/core/validation/schemas/documentUpload.schema';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Get authenticated user — no permission gate; upload access is implicit via authenticated UI flows
    const user = await getCurrentUser();
    const owner_id = user?.id || 'anonymous';

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entity_type = formData.get('entity_type') as string | null;
    const entity_id = formData.get('entity_id') as string | null;
    const module = formData.get('module') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate using the unified schema
    const validation = DocumentUploadSchema.safeParse({ file });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent path traversal / injection
    const original_name = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, '_');

    const buffer = Buffer.from(await file.arrayBuffer());

    const file_record = await fileService.uploadFile({
      buffer,
      original_name,
      mime_type: file.type,
      size_bytes: file.size,
      owner_id,
      entity_type: entity_type || undefined,
      entity_id: entity_id || undefined,
      module: module || 'documents',
    });

    return NextResponse.json({ success: true, file_id: file_record.id });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
