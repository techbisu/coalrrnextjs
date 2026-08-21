import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { getMouzaAbstractUseCase } from '@/infrastructure/di/Container';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  let auth = await authorizeApi('proposal.view');
  if (auth.error) {
    auth = await authorizeApi('acquisition.view');
  }
  if (auth.error) {
    return auth.error;
  }

  try {
    const { id } = await ctx.params;

    const result = await getMouzaAbstractUseCase.execute({ proposalId: id });

    if (result.isFailure) {
      if (String(result.error).includes('not found')) {
        return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
      }
      return NextResponse.json({ error: String(result.error) }, { status: 400 });
    }

    return NextResponse.json(result.value, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/proposals/[id]/mouza-abstract error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
