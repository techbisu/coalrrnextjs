import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { db } from '@/lib/db';
import { manualMilestoneService } from '@/core/workflow/services/ManualMilestoneService';
import { withRequestContext } from '@/app/api/_server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRequestContext(request, async () => {
    const auth = await authorizeApi('proposal.view');
    if (auth.error) return auth.error;

    const { id } = await params;

    try {
      const milestones = await db.manual_milestone.findMany({
        where: { entity_type: 'proposal', entity_id: id },
        orderBy: { sent_at: 'desc' }
      });

      const formattedMilestones = milestones.map(m => ({
        id: m.id,
        milestone_type: m.milestone_type,
        authority: m.authority_name,
        reference_no: m.reference_no,
        milestone_date: m.sent_at
          ? m.sent_at.toISOString()
          : (m.received_at
            ? m.received_at.toISOString()
            : new Date(Number(m.entry_ts || 0) * 1000).toISOString()),
        outcome: m.outcome,
        remarks: m.remarks,
        document_id: m.document_id,
        entry_ts: m.entry_ts.toISOString(),
        entry_by: m.entry_by || 'system'
      }));

      return NextResponse.json(formattedMilestones, { status: 200 });
    } catch (error: any) {
      console.error('Error fetching milestones:', error);
      return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRequestContext(request, async () => {
    const auth = await authorizeApi('proposal.view');
    if (auth.error) return auth.error;

    const { id } = await params;
    try {
      const body = await request.json();
      const { milestone_type, authority, reference_no, outcome, remarks, document_id } = body;

      // ── DB-driven dependency validation via ManualMilestoneService ────────
      const result = await manualMilestoneService.recordMilestone({
        entity_type: 'proposal',
        entity_id: id,
        milestone_type: milestone_type || 'GENERAL_MILESTONE',
        authority,
        reference_no,
        milestone_date: new Date(),
        outcome: outcome || 'APPROVED',
        remarks,
        proof_document_id: document_id,
        user_id: String(auth.user?.id || 'system'),
      });

      if (!result.isSuccess) {
        return NextResponse.json({ error: 'Validation Error', message: result.error }, { status: 400 });
      }

      return NextResponse.json(result.value, { status: 201 });
    } catch (error: any) {
      console.error('Error creating milestone:', error);
      return NextResponse.json({ error: 'Failed to create milestone', message: error.message }, { status: 500 });
    }
  });
}
