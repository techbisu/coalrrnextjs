import { NextResponse } from 'next/server';
import { authorizeApi } from '@/authorization/middleware/authorize';
import { db } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.view');
    if (auth.error) return auth.error;

    const { id } = await ctx.params;

    // Fetch files attached to this project
    const attachments = await db.file_attachment.findMany({
      where: {
        entity_type: 'project-master',
        entity_id: id,
      },
      include: {
        file_record: {
          include: {
            file_version: {
              orderBy: { version_number: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { entry_ts: 'desc' }
    });

    const mappedFiles = attachments.map(a => {
      const f = a.file_record;
      const latestVersion = f.file_version[0];
      return {
        id: f.id,
        file_name: f.original_name,
        file_size_kb: latestVersion ? Math.round(Number(latestVersion.size_bytes) / 1024) : 0,
        mime_type: latestVersion ? latestVersion.mime_type : 'application/octet-stream',
        virus_scan_status: 'clean',
        uploaded_by: f.owner_id,
        entry_ts: f.entry_ts.toISOString(),
        checklist_item_key: a.module // store the key in module field
      };
    });

    return NextResponse.json({ success: true, data: mappedFiles });
  } catch (error: any) {
    console.error('Fetch Project Files Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
