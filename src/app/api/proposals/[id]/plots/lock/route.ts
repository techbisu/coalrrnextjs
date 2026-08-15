import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { db } from '@/lib/db'

/**
 * POST /api/proposals/[id]/plots/lock
 *
 * Locks the plot schedule for a proposal. Once locked:
 * - No more plots can be added or removed (enforced in UI + guard).
 * - `ADD_PLOT_SCHEDULE` is considered COMPLETED in the workflow snapshot.
 *
 * Only callable from Drafting state by the unit_office role.
 * Requires at least 1 plot to be added before locking.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi('proposal.edit')
  if (auth.error) return auth.error

  const { id: proposalId } = await params

  try {
    const proposal = await (db as any).acq_proposal.findUnique({
      where: { proposal_id: proposalId },
      select: {
        proposal_id: true,
        overall_status: true,
        plots_locked: true,
        _count: { select: { plot_schedule: true } },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Validate: must be in Drafting
    const isDrafting =
      proposal.overall_status === 'Drafting' ||
      proposal.overall_status === 'DRAFT' ||
      proposal.overall_status === 'DRAFTING'

    if (!isDrafting) {
      return NextResponse.json(
        { error: 'Plot schedule can only be locked during the Drafting stage' },
        { status: 400 }
      )
    }

    // Validate: already locked
    if (proposal.plots_locked) {
      return NextResponse.json(
        { error: 'Plot schedule is already locked' },
        { status: 400 }
      )
    }

    // Validate: must have at least 1 plot
    if (proposal._count.plot_schedule === 0) {
      return NextResponse.json(
        { error: 'At least one plot must be added before locking the schedule' },
        { status: 400 }
      )
    }

    await (db as any).acq_proposal.update({
      where: { proposal_id: proposalId },
      data: { plots_locked: true },
    })

    return NextResponse.json({ ok: true, plots_locked: true })
  } catch (err: any) {
    console.error('[plots/lock] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error', message: err.message },
      { status: 500 }
    )
  }
}
