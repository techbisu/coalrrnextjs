import { NextResponse } from 'next/server';
import { JobQueue } from '@/core/jobs/JobQueue';
import { DocumentWorker } from '@/lib/document-engine/DocumentWorker';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Ideally, add Vercel Cron authentication here
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const processedCount = await JobQueue.processNext(10, async (jobType, payload) => {
      switch (jobType) {
        case 'GENERATE_DOCUMENT':
          await DocumentWorker.processGeneration(payload);
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
    });

    return NextResponse.json({ success: true, processedCount });
  } catch (error: any) {
    console.error('[Cron] Job processing failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
