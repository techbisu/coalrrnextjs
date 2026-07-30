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

    const updated = await db.plot_schedule.update({
      where: {
        proposal_id_plot_no: {
          proposal_id: id,
          plot_no: plot_no
        }
      },
      data: {
        acq_status
      }
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
