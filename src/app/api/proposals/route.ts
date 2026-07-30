import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { InitiateProposalUseCase } from '@/core/proposal/usecases/InitiateProposalUseCase';
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository';
import { InitiateProposalSchema } from '@/core/validation/schemas/proposal.schema';

const proposalRepo = new PrismaAcqProposalRepository();
const initiateProposalUseCase = new InitiateProposalUseCase(proposalRepo);

export async function POST(request: NextRequest) {
  // 1. Authorization: Verify the user has PROPOSAL_CREATE permission
  const auth = await authorizeApi('PROPOSAL_CREATE');
  if (auth.error) {
    return auth.error;
  }

  try {
    // 2. Input Validation (Zod)
    const body = await request.json();
    const validatedData = InitiateProposalSchema.parse(body);

    // Override entry_by with authenticated user ID
    validatedData.proposal.entry_by = auth.user?.id || 'system';
    
    // Also override entry_by on any plots included
    if (validatedData.plots) {
      validatedData.plots.forEach((p: any) => p.entry_by = auth.user?.id || 'system');
    }

    // 3. Execute UseCase
    const result = await initiateProposalUseCase.execute(validatedData);

    if (result.isFailure) {
      // Return 409 Conflict if math engine blocks it for duplication
      const errMsg = String(result.error);
      if (errMsg.includes('Unique constraint failed') && errMsg.includes('proposal_no')) {
        return NextResponse.json({ error: 'A proposal with this Proposal No already exists. Please enter a unique Proposal No.' }, { status: 409 });
      }
      return NextResponse.json({ error: errMsg }, { status: 409 });
    }

    return NextResponse.json({ proposalId: (result as any).value }, { status: 201 });
    
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
