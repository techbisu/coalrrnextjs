import { NextRequest, NextResponse } from 'next/server';
import { transferUserUseCase } from '@/infrastructure/di/Container';
import { getCurrentUser } from '@/lib/auth';
import { ScopeLevel } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const body = await req.json();
    
    const result = await transferUserUseCase.execute({
      userId: id,
      newScopeLevel: body.newScopeLevel as ScopeLevel,
      newAreaCd: body.newAreaCd,
      newMineCd: body.newMineCd,
      transferOrderNo: body.transferOrderNo,
      effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
      assignerId: user.id
    });
    
    if (result.isFailure) return NextResponse.json({ error: result.error }, { status: 400 });
    
    return NextResponse.json(result.value);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
