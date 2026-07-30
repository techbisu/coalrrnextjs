import { NextRequest, NextResponse } from 'next/server';
import { acqProposalRepository } from '@/infrastructure/di/Container';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plotNo = searchParams.get('plot_no');
    const mouzaLgd = searchParams.get('mouza_lgd');
    const excludeProposalId = searchParams.get('exclude_proposal_id') || undefined;

    if (!plotNo || !mouzaLgd) {
      return NextResponse.json(
        { exists: false, error: 'Missing plot_no or mouza_lgd' },
        { status: 400 }
      );
    }

    const mouzaLgdNumber = parseInt(mouzaLgd, 10);
    if (isNaN(mouzaLgdNumber)) {
      return NextResponse.json(
        { exists: false, error: 'Invalid mouza_lgd' },
        { status: 400 }
      );
    }

    // Use authorizeApi to ensure only authenticated users can check
    const { authorizeApi } = await import('@/core/authorization/middleware/authorize');
    const authResult = await authorizeApi('acquisition.edit');
    if (authResult.error) {
      return authResult.error;
    }

    const exists = await acqProposalRepository.checkDuplicatePlots(
      [plotNo],
      mouzaLgdNumber,
      excludeProposalId
    );

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking duplicate plot:', error);
    return NextResponse.json(
      { exists: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
