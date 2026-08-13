import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { db } from '@/lib/db';
import { updatePlotUseCase, deletePlotUseCase } from '@/infrastructure/di/Container';
import { PlotScheduleSchema } from '@/core/validation/schemas/plot-schedule.schema';
import { generatePlotNo } from '@/shared/utils/plot.utils';
import { withRequestContext } from '@/app/api/_server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, plot_no: string }> }
) {
  const paramsData = await params;
  
  const auth = await authorizeApi('proposal.view');
  if (auth.error) return auth.error;

  try {
    const plot = await db.plot_schedule.findUnique({
      where: { schedule_id: BigInt(paramsData.plot_no) },
      include: {
        plot_schedule_land_type: true
      }
    });

    if (!plot || plot.proposal_id.toString() !== paramsData.id) {
      return NextResponse.json({ error: 'Plot not found' }, { status: 404 });
    }

    const responseData = {
      mouza_lgd: plot.mouza_lgd.toString(),
      plot_no: plot.plot_no,
      plot_ty: plot.plot_ty,
      plot_number: plot.plot_number,
      bata_no: plot.bata_no,
      opt_plot_ty: plot.opt_plot_ty,
      opt_plot: plot.opt_plot,
      opt_bata: plot.opt_bata,
      total_ror_area: Number(plot.total_ror_area),
      to_be_acquired_area: Number(plot.to_be_acquired_area),
      acq_status: plot.acq_status,
      entry_by: plot.entry_by,
      land_types: Object.values(
        plot.plot_schedule_land_type.reduce((acc: any, lt: any) => {
          const id = Number(lt.landt_id);
          const key = `${id}_${lt.area}_${lt.use_purpose || 'EXCAVATION'}`;
          if (!acc[key]) {
            acc[key] = {
              landt_id: id,
              area: Number(lt.area),
              use_purpose: lt.use_purpose || 'EXCAVATION',
              sub_types: []
            };
          }
          if (lt.sub_landt_id) {
            acc[key].sub_types.push({
              sub_landt_id: Number(lt.sub_landt_id),
              area_to_acquire: Number(lt.area_to_acquire)
            });
          }
          return acc;
        }, {})
      )
    };

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, plot_no: string }> }
) {
  return withRequestContext(request, async () => {
    const paramsData = await params;
    const proposalId = paramsData.id;
    const plotId = paramsData.plot_no;

    const auth = await authorizeApi('proposal.addplot');
    if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const validatedData = PlotScheduleSchema.parse(body);

    const mouzaData = await db.mouza.findUnique({ 
      where: { mouza_lgd: BigInt(validatedData.mouza_lgd) },
      select: {
        jl_no: true,
        state_lgd: true,
        district_lgd: true,
        block_lgd: true
      }
    });
    const stateLgd = mouzaData?.state_lgd?.toString() || '';
    
    validatedData.plot_no = generatePlotNo({
      stateLgd,
      mouzaLgd: validatedData.mouza_lgd,
      plotTy: validatedData.plot_ty || '',
      plotNumber: validatedData.plot_number || '',
      bataNo: validatedData.bata_no
    });


    const userId = auth.user?.id || auth.user?.email || auth.user?.name || 'system';

    const plotDTO = {
      proposal_id: proposalId,
      plot_no: validatedData.plot_no,
      plot_ty: validatedData.plot_ty,
      plot_number: validatedData.plot_number,
      bata_no: validatedData.bata_no,
      opt_plot_ty: validatedData.opt_plot_ty,
      opt_plot: validatedData.opt_plot,
      opt_bata: validatedData.opt_bata,
      mouza_lgd: Number(validatedData.mouza_lgd),
      jl_no: mouzaData?.jl_no || undefined,
      state_lgd: mouzaData?.state_lgd ? Number(mouzaData.state_lgd) : (validatedData.state_lgd ? Number(validatedData.state_lgd) : undefined),
      district_lgd: mouzaData?.district_lgd ? Number(mouzaData.district_lgd) : undefined,
      block_lgd: mouzaData?.block_lgd ? Number(mouzaData.block_lgd) : undefined,
      ps_lgd: (mouzaData as any)?.ps_lgd ? Number((mouzaData as any).ps_lgd) : undefined,
      total_ror_area: validatedData.total_ror_area || 0,
      to_be_acquired_area: validatedData.to_be_acquired_area || 0,
      acq_status: validatedData.acq_status,
      entry_by: userId
    };

    const landTypesDTO = validatedData.land_types.flatMap(lt => 
      lt.sub_types.map(sub => ({
        schedule_id: paramsData.plot_no,
        landt_id: Number(lt.landt_id),
        sub_landt_id: Number(sub.sub_landt_id),
        area: lt.area,
        area_to_acquire: sub.area_to_acquire,
        use_purpose: lt.use_purpose || 'EXCAVATION'
      }))
    );

    const plotInfo = await db.plot_schedule.findUnique({ where: { schedule_id: BigInt(paramsData.plot_no) }});
    if (!plotInfo) return NextResponse.json({ error: 'Plot not found' }, { status: 404 });

    const result = await updatePlotUseCase.execute({
      proposalId,
      plotNo: plotInfo.plot_no,
      plotData: plotDTO,
      landTypesData: landTypesDTO,
      userId: userId
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ message: 'Plot updated successfully' }, { status: 200 }); 
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, plot_no: string }> }
) {
  return withRequestContext(request, async () => {
    const paramsData = await params;
    const proposalId = paramsData.id;
    
    const auth = await authorizeApi('proposal.addplot');
    if (auth.error) return auth.error;

  try {

    const plotInfo = await db.plot_schedule.findUnique({ where: { schedule_id: BigInt(paramsData.plot_no) }});
    if (!plotInfo) return NextResponse.json({ error: 'Plot not found' }, { status: 404 });

    const result = await deletePlotUseCase.execute({
      proposalId,
      plotNo: plotInfo.plot_no,
      userId: auth.user?.id || 'system'
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Plot deleted successfully' }, { status: 200 }); 
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete plot' }, { status: 500 });
  }
  });
}
