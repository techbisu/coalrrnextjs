import { NextResponse } from 'next/server';
import { linkFileUseCase } from '@/infrastructure/di/Container';
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

    const result = await linkFileUseCase.execute({
      fileId: file_id,
      entityType: entity_type,
      entityId: entity_id,
      module,
      ownerId: owner_id,
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error as string }, { status: 404 });
    }

    return NextResponse.json({ success: true, file_id: result.value?.id });
  } catch (error: any) {
    console.error('Link File Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
