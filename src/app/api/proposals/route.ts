import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { createProposalUseCase, getProposalsUseCase } from '@/infrastructure/di/Container';
import { CreateProposalSchema } from '@/shared/schemas/proposal.schema';

export async function POST(request: NextRequest) {
  // 1. Authorization: Verify the user has proposal.create permission
  const auth = await authorizeApi('proposal.create');
  if (auth.error) {
    return auth.error;
  }

  try {
    // 2. Input Validation (Zod safeParse per validation.md)
    const body = await request.json();
    const parseResult = CreateProposalSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const validatedData: any = parseResult.data;
    const pData = validatedData.proposal || validatedData;

    const user_id = auth.user?.id || 'system';
    const user_name = auth.user?.name || auth.user?.email || 'system';
    const user_role = auth.user?.roles?.[0] || 'user';

    // 3. Execute UseCase
    const result = await createProposalUseCase.execute({
      project_id: pData.proj_cd,
      acq_mode_id: Number(pData.acq_mode_id),
      proposal_title: pData.purpose_justification || pData.proposal_no || 'Acquisition Proposal',
      description: pData.purpose_justification || '',
      area_office: pData.area_cd,
      colliery_code: pData.mine_cd,
      notification_date: pData.proposal_dt ? new Date(pData.proposal_dt) : new Date(),
      proposal_no: pData.proposal_no,
      proposal_type: pData.proposal_type,
      rate_tenancy_land_with_emp: pData.rate_tenancy_land_with_emp,
      rate_tenancy_land_no_emp: pData.rate_tenancy_land_no_emp,
      rate_govt_land: pData.rate_govt_land,
      rate_forest_land: pData.rate_forest_land,
      employment_proposed_count: pData.employment_proposed_count,
      employment_system: pData.employment_system,
      has_debottar_land: pData.has_debottar_land,
      has_tribal_land: pData.has_tribal_land,
      has_formal_negotiation: pData.has_formal_negotiation,
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
    const result = await getProposalsUseCase.execute({ 
      filter: auth.user.scope,
      userId: auth.user.id,
      userName: (auth.user.name || auth.user.email) ?? undefined
    });
    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.value }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
