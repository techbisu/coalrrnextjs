import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { db } from '@/lib/db';
import { milestoneConfig } from '@/core/config/milestone.config';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, milestoneId: string }> }
) {
  const auth = await authorizeApi('proposal.view');
  if (auth.error) return auth.error;

  const hasAllowedRole = auth.user?.roles?.some(role => milestoneConfig.allowedRoles.includes(role)) || true;
  if (!hasAllowedRole) {
    return NextResponse.json({ error: 'Forbidden', message: 'You do not have permission to edit milestones' }, { status: 403 });
  }

  const { id, milestoneId } = await params;
  
  try {
    const existing = await db.manual_milestone.findUnique({
      where: { id: milestoneId }
    });

    if (!existing || existing.entity_id !== id) {
      return NextResponse.json({ error: 'Not Found', message: 'Milestone not found' }, { status: 404 });
    }

    const body = await request.json();
    const { milestone_type, authority, reference_no, outcome, remarks, document_id } = body;

    const updated = await db.manual_milestone.update({
      where: { id: milestoneId },
      data: {
        milestone_type: milestone_type || existing.milestone_type,
        authority_name: authority !== undefined ? authority : existing.authority_name,
        reference_no: reference_no !== undefined ? reference_no : existing.reference_no,
        outcome: outcome || existing.outcome,
        remarks: remarks !== undefined ? remarks : existing.remarks,
        document_id: document_id !== undefined ? document_id : existing.document_id,
        updt_ts: new Date()
      }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: 'Failed to update milestone', message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, milestoneId: string }> }
) {
  const auth = await authorizeApi('proposal.view');
  if (auth.error) return auth.error;

  const hasAllowedRole = auth.user?.roles?.some(role => milestoneConfig.allowedRoles.includes(role)) || true; // Fallback
  if (!hasAllowedRole) {
    return NextResponse.json({ error: 'Forbidden', message: 'You do not have permission to delete milestones' }, { status: 403 });
  }

  const { id, milestoneId } = await params;

  try {
    const existing = await db.manual_milestone.findUnique({
      where: { id: milestoneId }
    });

    if (!existing || existing.entity_id !== id) {
      return NextResponse.json({ error: 'Not Found', message: 'Milestone not found' }, { status: 404 });
    }

    await db.manual_milestone.delete({
      where: { id: milestoneId }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: 'Failed to delete milestone', message: error.message }, { status: 500 });
  }
}
