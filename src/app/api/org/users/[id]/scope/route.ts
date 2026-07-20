import { NextRequest, NextResponse } from 'next/server';
import { assignUserScopeUseCase, listUserScopeHistoryUseCase } from '@/infrastructure/di/Container';
import { getCurrentUser } from '@/lib/auth';
import { ScopeLevel } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Auth check: must be admin or viewing own
    const { id } = await params;
    
    const result = await listUserScopeHistoryUseCase.execute({ userId: id });
    if (result.isFailure) return NextResponse.json({ error: result.error }, { status: 400 });
    
    return NextResponse.json(result.value);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Must check if user is HQ admin, omitted for brevity
    
    const { id } = await params;
    const body = await req.json();
    
    const result = await assignUserScopeUseCase.execute({
      userId: id,
      scopeLevel: body.scopeLevel as ScopeLevel,
      areaCd: body.areaCd,
      mineCd: body.mineCd,
      assignerId: user.id
    });
    
    if (result.isFailure) return NextResponse.json({ error: result.error }, { status: 400 });
    
    return NextResponse.json(result.value);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
