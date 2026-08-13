import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { workflowSnapshotQueryService } from '@/core/workflow/services/WorkflowSnapshotQueryService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleCode: string; entityType: string; entityId: string }> }
) {
  try {
    const { moduleCode, entityType, entityId } = await params;
    const authUser = await getCurrentUser();

    const userRole = req.headers.get('x-user-role') || (authUser?.roles?.[0] as string) || 'unit_office';
    const userId = authUser?.id;
    const userName = authUser?.name;

    const snapshot = await workflowSnapshotQueryService.getSnapshot(
      moduleCode,
      entityType,
      entityId,
      {
        userId,
        role: userRole,
      }
    );

    return NextResponse.json(snapshot);
  } catch (error: any) {
    console.error('[WorkflowSnapshotAPI] Error generating snapshot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate workflow snapshot' },
      { status: 500 }
    );
  }
}
