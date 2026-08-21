import { NextRequest, NextResponse } from 'next/server';
import { ConfigCacheService } from '@/core/config/cache/ConfigCacheService';

export async function GET(req: NextRequest) {
  try {
    // Clear all L1 process memory and invalidate checklist rule caches in L2 Redis
    ConfigCacheService.clearAll();
    await ConfigCacheService.invalidatePattern('checklist');
    await ConfigCacheService.invalidatePattern('workflow');

    return NextResponse.json({
      success: true,
      message: 'Checklist master cache and workflow config cache successfully cleared.',
      clearedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[ChecklistCacheAPI] Error clearing checklist cache:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear checklist cache' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
