import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { createProposalUseCase, getProposalsUseCase } from '@/infrastructure/di/Container';
import { InitiateProposalSchema } from '@/core/validation/schemas/proposal.schema';


export async function POST(request: NextRequest) {
  // 1. Authorization: Verify the user has proposal.create permission
  const auth = await authorizeApi('proposal.create');
  if (auth.error) {
    return auth.error;
  }

  try {
    // 2. Input Validation (Zod)
    const body = await request.json();
    const validatedData = InitiateProposalSchema.parse(body);

    const user_id = auth.user?.id || 'system';
    const user_name = auth.user?.name || auth.user?.email || 'system';
    const user_role = auth.user?.roles?.[0] || 'user';

    // Map acquisition mode ID to string
    let acq_mode = 'cba_act';
    if (validatedData.proposal.acq_mode_id === 2) acq_mode = 'rfctlarr';
    if (validatedData.proposal.acq_mode_id === 3) acq_mode = 'direct_purchase';

    // 3. Execute UseCase
    const result = await createProposalUseCase.execute({
      project_id: validatedData.proposal.proj_cd,
      acquisition_mode: acq_mode,
      proposal_title: validatedData.proposal.purpose_justification,
      description: validatedData.proposal.purpose_justification,
      area_office: validatedData.proposal.area_cd,
      notification_date: validatedData.proposal.proposal_dt,
      user_id: user_id,
      user_name: user_name,
      user_role: user_role
    });

    if (result.isFailure) {
      const errMsg = String(result.error);
      if (errMsg.includes('Unique constraint failed') && errMsg.includes('proposal_no')) {
        return NextResponse.json({ error: 'A proposal with this Proposal No already exists. Please enter a unique Proposal No.' }, { status: 409 });
      }
      return NextResponse.json({ error: errMsg }, { status: 409 });
    }

    return NextResponse.json({ proposalId: (result as any).value.id }, { status: 201 });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('proposal_no')) {
      return NextResponse.json({ error: 'A proposal with this Proposal No already exists. Please enter a unique Proposal No.' }, { status: 409 });
    }
    console.error('Error initiating proposal:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi('proposal.view');
  if (auth.error) {
    return auth.error;
  }

  try {
    const result = await getProposalsUseCase.execute({ filter: auth.user.scope });
    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.value }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
