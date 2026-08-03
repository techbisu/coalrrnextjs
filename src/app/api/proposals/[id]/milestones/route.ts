import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi('proposal.view');
  if (auth.error) {
    return auth.error;
  }

  const { id } = await params;

  try {
    const milestones = await db.manual_milestone.findMany({
      where: {
        entity_type: 'proposal',
        entity_id: id,
      },
      orderBy: {
        sent_at: 'desc'
      }
    });

    const formattedMilestones = milestones.map(m => ({
      id: m.id,
      milestone_type: m.milestone_type,
      authority: m.authority_name,
      reference_no: m.reference_no,
      milestone_date: m.sent_at ? m.sent_at.toISOString() : (m.received_at ? m.received_at.toISOString() : new Date(Number(m.entry_ts || 0) * 1000).toISOString()),
      outcome: m.outcome,
      remarks: m.remarks,
      entry_ts: new Date(Number(m.entry_ts || 0) * 1000).toISOString(),
      entry_by: m.entry_by || 'system'
    }));

    return NextResponse.json(formattedMilestones, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi('proposal.view');
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const body = await request.json();
    const { milestone_type, authority, reference_no, outcome, remarks } = body;

    const created = await db.manual_milestone.create({
      data: {
        entity_type: 'proposal',
        entity_id: id,
        milestone_type: milestone_type || 'GENERAL_MILESTONE',
        authority_name: authority || 'District Office',
        reference_no: reference_no || null,
        sent_at: new Date(),
        outcome: outcome || 'APPROVED',
        remarks: remarks || null,
        entry_by: auth.user?.id || 'system'
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Failed to create milestone', message: error.message }, { status: 500 });
  }
}
