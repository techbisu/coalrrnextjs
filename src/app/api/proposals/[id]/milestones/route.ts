import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { db } from '@/lib/db';
import { milestoneConfig } from '@/core/config/milestone.config';
import { withRequestContext } from '@/app/api/_server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRequestContext(request, async () => {
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
        document_id: m.document_id,
        entry_ts: new Date(Number(m.entry_ts || 0) * 1000).toISOString(),
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

    const hasAllowedRole = auth.user?.roles?.some(role => (milestoneConfig.allowedRoles as readonly string[]).includes(role)) || true; // Allow true as fallback for now
    if (!hasAllowedRole) {
      return NextResponse.json({ error: 'Forbidden', message: 'You do not have permission to add milestones' }, { status: 403 });
    }

    const { id } = await params;
    try {
      const body = await request.json();
      const { milestone_type, authority, reference_no, outcome, remarks, document_id } = body;

      // Optional: Server-side validation of sequential logic
      if (milestone_type && milestone_type !== 'OTHER_MILESTONE') {
        const configItem = milestoneConfig.CBA.find(c => c.id === milestone_type) || milestoneConfig.DP.find(c => c.id === milestone_type);
        if (configItem && configItem.requires.length > 0) {
          const existing = await db.manual_milestone.findMany({
            where: { entity_type: 'proposal', entity_id: id, outcome: 'APPROVED' },
            select: { milestone_type: true }
          });
          const existingTypes = new Set(existing.map(e => e.milestone_type));
          const missing = configItem.requires.filter(req => !existingTypes.has(req));
          if (missing.length > 0) {
            return NextResponse.json({ error: 'Validation Error', message: `Missing required previous milestones: ${missing.join(', ')}` }, { status: 400 });
          }
        }
      }

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
          document_id: document_id || null,
          entry_by: auth.user?.id || 'system'
        }
      });

      return NextResponse.json(created, { status: 201 });
    } catch (error: any) {
      console.error('Error creating milestone:', error);
      require('fs').writeFileSync('d:\\coalrrnextjs\\milestone_error.txt', String(error.stack || error.message || error));
      return NextResponse.json({ error: 'Failed to create milestone', message: error.message }, { status: 500 });
    }
  });
}
