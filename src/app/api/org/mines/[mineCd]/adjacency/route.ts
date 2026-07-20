import { NextRequest, NextResponse } from 'next/server';
import { getAdjacentMinesUseCase, updateMineAdjacencyUseCase } from '@/infrastructure/di/Container';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ mineCd: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { mineCd } = await params;
    
    const result = await getAdjacentMinesUseCase.execute(mineCd);
    if (result.isFailure) return NextResponse.json({ error: result.error }, { status: 400 });
    
    return NextResponse.json(result.value);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ mineCd: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { mineCd } = await params;
    const body = await req.json();
    
    const result = await updateMineAdjacencyUseCase.execute({
      mineCd,
      adjacentMineIds: body.adjacentMineIds
    });
    
    if (result.isFailure) return NextResponse.json({ error: result.error }, { status: 400 });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
