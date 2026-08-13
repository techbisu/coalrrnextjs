import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

  const encoder = new TextEncoder();
  let lastCheckedTime = new Date();

  const customStream = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`event: connected\ndata: {"time":"${new Date().toISOString()}"}\n\n`));

      const interval = setInterval(async () => {
        try {
          // Check for recent events in outbox_events table
          const recentEvents = await db.outbox_events.findMany({
            where: {
              created_at: { gt: lastCheckedTime },
              ...(entityType && entityId
                ? {
                    payload: {
                      path: ['entityId'],
                      equals: entityId,
                    },
                  }
                : {}),
            },
            take: 5,
            orderBy: { created_at: 'asc' },
          });

          if (recentEvents.length > 0) {
            lastCheckedTime = recentEvents[recentEvents.length - 1].created_at;

            const eventData = JSON.stringify({
              events: recentEvents.map((e) => ({
                id: e.id,
                eventName: e.event_name,
                module: e.module,
                payload: e.payload,
              })),
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(encoder.encode(`event: WORKFLOW_UPDATED\ndata: ${eventData}\n\n`));
          } else {
            // Keepalive ping
            controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        } catch (error) {
          console.error('[WorkflowRealtimeSSE] Polling error:', error);
        }
      }, 2000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
