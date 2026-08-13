import { NextRequest, NextResponse } from 'next/server';
import { AddPlotsSchema } from '@/core/validation/schemas/plot-schedule.schema';
import { addPlotsToProposalUseCase } from '@/infrastructure/di/Container';
import { generatePlotNo } from '@/shared/utils/plot.utils';
import { db } from '@/lib/db';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { withRequestContext } from '@/app/api/_server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRequestContext(request, async () => {
    const auth = await authorizeApi('proposal.addplot');
    if (auth.error) return auth.error;
    const userId = auth.user?.id || auth.user?.email || auth.user?.name || 'system';

  try {
    const paramsData = await params;
    const body = await request.json();
    
    const parseResult = AddPlotsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() }, 
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;
    const proposalId = paramsData.id;
    const mouzaLgd = Number(validatedData.plots[0].mouza_lgd);

    const mouzaData = await db.mouza.findUnique({
      where: { mouza_lgd: BigInt(mouzaLgd) },
      select: {
        jl_no: true,
        state_lgd: true,
        district_lgd: true,
        block_lgd: true
      }
    });

    let stateLgd = mouzaData?.state_lgd?.toString();

    // Fallback to proposal's area state_lgd if mouza is missing it
    if (!stateLgd) {
      const proposal = await db.acq_proposal.findUnique({
        where: { proposal_id: proposalId },
        include: { area: { select: { state_lgd: true } } }
      });
      stateLgd = proposal?.area?.state_lgd?.toString();
    }
    
    // If still missing, check if UI passed it
    if (!stateLgd && validatedData.plots[0].state_lgd) {
      stateLgd = validatedData.plots[0].state_lgd.toString();
    }
    
    stateLgd = stateLgd || '';

    // Map to DTOs
    const plotDTOs = validatedData.plots.map(p => {
      const actualPlotNo = generatePlotNo({
        stateLgd,
        mouzaLgd: p.mouza_lgd,
        plotTy: p.plot_ty || '',
        plotNumber: p.plot_number || '',
        bataNo: p.bata_no
      });
      // Override the frontend plot_no with the backend generated one just in case
      p.plot_no = actualPlotNo;

      return {
        proposal_id: proposalId,
        plot_no: actualPlotNo,
        plot_ty: p.plot_ty,
        plot_number: p.plot_number,
        bata_no: p.bata_no,
        opt_plot_ty: p.opt_plot_ty,
        opt_plot: p.opt_plot,
        opt_bata: p.opt_bata,
        mouza_lgd: Number(p.mouza_lgd),
        jl_no: mouzaData?.jl_no || undefined,
        state_lgd: mouzaData?.state_lgd ? Number(mouzaData.state_lgd) : (p.state_lgd ? Number(p.state_lgd) : undefined),
        district_lgd: mouzaData?.district_lgd ? Number(mouzaData.district_lgd) : undefined,
        block_lgd: mouzaData?.block_lgd ? Number(mouzaData.block_lgd) : undefined,
        ps_lgd: (mouzaData as any)?.ps_lgd ? Number((mouzaData as any).ps_lgd) : undefined,
        total_ror_area: p.total_ror_area || 0,
        to_be_acquired_area: p.to_be_acquired_area || 0,
        acq_status: p.acq_status,
        entry_by: userId
      };
    });

    const landTypeDTOs = validatedData.plots.flatMap(p => 
      (p.land_types || []).flatMap(lt => 
        (lt.sub_types || []).map(sub => ({
          schedule_id: p.plot_no,
          landt_id: Number(lt.landt_id),
          sub_landt_id: Number(sub.sub_landt_id),
          area: lt.area || p.to_be_acquired_area || p.total_ror_area || 0,
          area_to_acquire: sub.area_to_acquire || lt.area || p.to_be_acquired_area || p.total_ror_area || 0,
          use_purpose: lt.use_purpose || 'EXCAVATION'
        }))
      )
    );

    const result = await addPlotsToProposalUseCase.execute({
      proposalId,
      plots: plotDTOs,
      landTypes: landTypeDTOs,
      mouzaLgd,
      userId: userId
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding plots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  });
}
