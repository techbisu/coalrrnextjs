import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { db } from '@/lib/db';
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository';
import { UpdatePlotUseCase, DeletePlotUseCase } from '@/application/use-cases/proposal';
import { PlotScheduleSchema } from '@/core/validation/schemas/plot-schedule.schema';
import { generatePlotNo } from '@/shared/utils/plot.utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, plot_no: string }> }
) {
  const paramsData = await params;
  
  const auth = await authorizeApi('PROPOSAL_VIEW');
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
      land_types: plot.plot_schedule_land_type.map((lt: any) => ({
        landt_id: lt.landt_id.toString(),
        area: Number(lt.area),
        area_to_acquire: Number(lt.area_to_acquire)
      }))
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
  const paramsData = await params;
  const proposalId = paramsData.id;
  const plotId = paramsData.plot_no;

  const auth = await authorizeApi('PROPOSAL_UPDATE');
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const validatedData = PlotScheduleSchema.parse(body);

    const mouzaData = await db.mouza_master.findUnique({ 
      where: { mouza_lgd: BigInt(validatedData.mouza_lgd) },
      select: { state_lgd: true }
    });
    const stateLgd = mouzaData?.state_lgd?.toString() || '';
    
    validatedData.plot_no = generatePlotNo({
      stateLgd,
      mouzaLgd: validatedData.mouza_lgd,
      plotTy: validatedData.plot_ty || '',
      plotNumber: validatedData.plot_number || '',
      bataNo: validatedData.bata_no
    });

    const repo = new PrismaAcqProposalRepository();
    const useCase = new UpdatePlotUseCase(repo);

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
      total_ror_area: validatedData.total_ror_area || 0,
      to_be_acquired_area: validatedData.to_be_acquired_area || 0,
      acq_status: validatedData.acq_status,
      entry_by: auth.user?.id || 'system'
    };

    const landTypesDTO = validatedData.land_types.map(lt => ({
      schedule_id: paramsData.plot_no,
      landt_id: Number(lt.landt_id),
      area: lt.area,
      area_to_acquire: lt.area_to_acquire
    }));

    const plotInfo = await db.plot_schedule.findUnique({ where: { schedule_id: BigInt(paramsData.plot_no) }});
    if (!plotInfo) return NextResponse.json({ error: 'Plot not found' }, { status: 404 });

    const result = await useCase.execute({
      proposalId,
      plotNo: plotInfo.plot_no,
      plotData: plotDTO,
      landTypesData: landTypesDTO,
      userId: validatedData.entry_by
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, plot_no: string }> }
) {
  const paramsData = await params;
  const proposalId = paramsData.id;
  
  const auth = await authorizeApi('acquisition.edit');
  if (auth.error) return auth.error;

  try {
    const repo = new PrismaAcqProposalRepository();
    const useCase = new DeletePlotUseCase(repo);

    const plotInfo = await db.plot_schedule.findUnique({ where: { schedule_id: BigInt(paramsData.plot_no) }});
    if (!plotInfo) return NextResponse.json({ error: 'Plot not found' }, { status: 404 });

    const result = await useCase.execute({
      proposalId,
      plotNo: plotInfo.plot_no,
      userId: 'system'
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Plot deleted successfully' }, { status: 200 }); 
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete plot' }, { status: 500 });
  }
}
