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

    const { total_poss_area, to_be_acquired_area, remarks, landTypeAdjustments } = body

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

    // If specific landTypeAdjustments provided (e.g., deducting 2.5 Ac specifically from Forest Area)
    if (Array.isArray(landTypeAdjustments) && landTypeAdjustments.length > 0) {
      const ltList = await db.plot_schedule_land_type.findMany({
        where: { schedule_id: plot.schedule_id },
        include: { landtype: true }
      })

      for (const adj of landTypeAdjustments) {
        const match = ltList.find(lt => lt.landtype?.land_type?.toLowerCase() === adj.land_type_name.toLowerCase())
        if (match) {
          await db.plot_schedule_land_type.update({
            where: { schedule_land_type_id: match.schedule_land_type_id },
            data: { area_to_acquire: Number(adj.area_to_acquire) }
          })
        }
      }
    } else if (to_be_acquired_area !== undefined && plot.total_ror_area && Number(plot.total_ror_area) > 0) {
      // Fallback: Proportional update if specific breakdown was not passed
      const netArea = Number(to_be_acquired_area)
      const totalRor = Number(plot.total_ror_area)
      const ratio = Math.min(1, Math.max(0, netArea / totalRor))

      const ltList = await db.plot_schedule_land_type.findMany({
        where: { schedule_id: plot.schedule_id }
      })

      for (const lt of ltList) {
        const originalArea = Number(lt.area || 0)
        const updatedLandTypeAreaToAcquire = Number((originalArea * ratio).toFixed(4))
        await db.plot_schedule_land_type.update({
          where: { schedule_land_type_id: lt.schedule_land_type_id },
          data: { area_to_acquire: updatedLandTypeAreaToAcquire }
        })
      }
    }

    return NextResponse.json({ success: true, updated })
  } catch (error: any) {
    console.error('Error updating plot status:', error)
    return NextResponse.json(
      { error: 'Failed to update plot status' },
      { status: 500 }
    )
  }
}
