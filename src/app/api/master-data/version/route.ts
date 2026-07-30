import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/master-data/version
 *
 * Returns a version string derived from the latest `updt_ts` across all
 * tracked master tables. Clients compare this against their locally stored
 * version and invalidate their cache when it changes.
 *
 * Response is cached by the browser / CDN for 60 seconds to avoid hammering
 * the DB on every app load.
 */
export async function GET() {
  try {
    // Get max updt_ts from key master tables that change most often.
    // All updt_ts are BigInt epoch seconds — max gives us the latest change time.
    const results = await Promise.allSettled([
      db.$queryRaw<[{ max: bigint | null }]>`SELECT MAX(updt_ts) as max FROM master.state_master`,
      db.$queryRaw<[{ max: bigint | null }]>`SELECT MAX(updt_ts) as max FROM master.district_master`,
      db.$queryRaw<[{ max: bigint | null }]>`SELECT MAX(updt_ts) as max FROM master.block_master`,
      db.$queryRaw<[{ max: bigint | null }]>`SELECT MAX(updt_ts) as max FROM master.mouza_master`,
      db.$queryRaw<[{ max: bigint | null }]>`SELECT MAX(updt_ts) as max FROM master.vill_master`,
      db.$queryRaw<[{ max: bigint | null }]>`SELECT MAX(updt_ts) as max FROM master.ps_master`,
      db.$queryRaw<[{ max: bigint | null }]>`SELECT MAX(updt_ts) as max FROM master.mine_master`,
      db.$queryRaw<[{ max: bigint | null }]>`SELECT MAX(updt_ts) as max FROM master.area_master`,
    ])

    const maxTs = results
      .filter((r): r is PromiseFulfilledResult<[{ max: bigint | null }]> => r.status === 'fulfilled')
      .map(r => r.value[0]?.max ?? BigInt(0))
      .reduce((a, b) => (a > b ? a : b), BigInt(0))

    const version = String(maxTs)

    return NextResponse.json(
      { version },
      {
        headers: {
          // Cache for 60s — frequent enough to detect changes, rare enough to not hammer DB
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error: any) {
    console.error('Master version check error:', error.message)
    // Return a random fallback so the client doesn't cache a broken version
    return NextResponse.json({ version: `error_${Date.now()}` }, { status: 200 })
  }
}
