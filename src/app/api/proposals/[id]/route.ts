import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { getProposalDetailsUseCase, updateProposalUseCase } from '@/infrastructure/di/Container';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi('proposal.view');
  if (auth.error) {
    return auth.error;
  }

  try {
    const paramsData = await params;
    const proposalId = paramsData.id;

    const result = await getProposalDetailsUseCase.execute({ proposalId });

    if (result.isFailure) {
      if (String(result.error).includes('not found')) {
        return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.value }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching proposal details:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi('proposal.update');
  if (auth.error) {
    return auth.error;
  }

  try {
    const paramsData = await params;
    const proposalId = paramsData.id;
    const body = await request.json();

    const result = await updateProposalUseCase.execute({
      proposalId,
      ...body
    });

    if (result.isFailure) {
      if (String(result.error).includes('not found')) {
        return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.value }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
