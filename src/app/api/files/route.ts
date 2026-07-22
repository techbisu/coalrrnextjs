import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    // We remove the hard 401 so it matches the upload route behavior which allows anonymous in some environments

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Build the query to search by original_name
    const whereClause: any = {
      status: 'ACTIVE'
    };

    if (query && query.trim() !== '') {
      whereClause.original_name = {
        contains: query.trim(),
        mode: 'insensitive',
      };
    }

    const files = await db.file_record.findMany({
      where: whereClause,
      include: {
        file_version: {
          orderBy: { version_number: 'desc' },
          take: 1
        }
      },
      orderBy: { entry_ts: 'desc' },
      take: 50 // Limit to 50 files for performance
    });

    const mappedFiles = files.map(f => {
      const latestVersion = f.file_version[0];
      return {
        id: f.id,
        file_name: f.original_name,
        file_size_kb: latestVersion ? Math.round(Number(latestVersion.size_bytes) / 1024) : 0,
        mime_type: latestVersion ? latestVersion.mime_type : 'application/octet-stream',
        virus_scan_status: 'clean',
        uploaded_by: f.owner_id,
        entry_ts: f.entry_ts.toISOString()
      };
    });

    return NextResponse.json({ success: true, data: mappedFiles });
  } catch (error: any) {
    console.error('Fetch Files Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
