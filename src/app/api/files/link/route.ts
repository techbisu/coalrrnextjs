import { NextResponse } from 'next/server';
import { fileService } from '@/modules/file-management/services/FileService';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const owner_id = user?.id || 'anonymous';

    const body = await request.json();
    const { file_id, entity_type, entity_id, module } = body;

    if (!file_id || !entity_type || !entity_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const file_record = await fileService.linkExistingFile({
      file_id,
      entity_type,
      entity_id,
      module,
      owner_id,
    });

    return NextResponse.json({ success: true, file_id: file_record.id });
  } catch (error: any) {
    console.error('Link File Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
