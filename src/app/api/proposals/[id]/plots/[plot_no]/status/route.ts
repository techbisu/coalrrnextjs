import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; plot_no: string }> }
) {
  try {
    const { id, plot_no } = await params
    const body = await request.json()
    const { acq_status } = body

    if (!acq_status || !['PROPOSED', 'PURCHASED', 'PARTIALLY_PURCHASED'].includes(acq_status)) {
      return NextResponse.json({ error: 'Invalid acq_status' }, { status: 400 })
    }

    const rawPlotNo = decodeURIComponent(plot_no).trim()
    const cleanPlotNo = rawPlotNo.replace(/^(LR|RS|CS)\s+/i, '')

    let plot = await db.plot_schedule.findFirst({
      where: {
        proposal_id: id,
        OR: [
          ...(isNaN(Number(rawPlotNo)) ? [] : [{ schedule_id: BigInt(rawPlotNo) }]),
          { plot_no: rawPlotNo },
          { plot_number: rawPlotNo },
          { plot_no: cleanPlotNo },
          { plot_number: cleanPlotNo }
        ]
      }
    })

    if (!plot) {
      return NextResponse.json({ error: `Plot '${rawPlotNo}' not found` }, { status: 404 })
    }

    const { acq_status, total_poss_area, to_be_acquired_area, remarks } = body

    const dataToUpdate: any = { acq_status }
    if (total_poss_area !== undefined) dataToUpdate.total_poss_area = Number(total_poss_area)
    if (to_be_acquired_area !== undefined) dataToUpdate.to_be_acquired_area = Number(to_be_acquired_area)
    if (remarks !== undefined) dataToUpdate.remarks = remarks

    const updated = await db.plot_schedule.update({
      where: {
        schedule_id: plot.schedule_id
      },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, updated })
  } catch (error: any) {
    console.error('Error updating plot status:', error)
    return NextResponse.json(
      { error: 'Failed to update plot status' },
      { status: 500 }
    )
  }
}
