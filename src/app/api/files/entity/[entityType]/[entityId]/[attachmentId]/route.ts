import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ entityType: string; entityId: string; attachmentId: string }> }

/**
 * Maps entityType → module-scoped file workspace permission pair.
 * Pattern: <module>.file.workspace.unlink
 */
function resolveUnlinkPermission(entityType: string): string {
  if (entityType.includes('project')) {
    return 'project.file.workspace.unlink'
  }
  if (entityType.includes('acq') || entityType.includes('land_schedule') || entityType.includes('land-schedule')) {
    return 'acquisition.file.workspace.unlink'
  }
  if (entityType.includes('proposal')) {
    return 'proposal.file.workspace.unlink'
  }
  if (entityType.includes('payroll') || entityType.includes('compensation')) {
    return 'payroll.file.workspace.unlink'
  }
  // Fallback: require global file workspace access
  return 'file.workspace.unlink'
}

/**
 * DELETE /api/files/entity/[entityType]/[entityId]/[attachmentId]
 * Unlinks a file from an entity. Does not delete the file record.
 */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { entityType, entityId, attachmentId } = await ctx.params
    const unlinkPerm = resolveUnlinkPermission(entityType)
    const auth = await authorizeApi(unlinkPerm)
    if (auth.error) return auth.error

    const attachment = await db.file_attachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    if (attachment.entity_type !== entityType || attachment.entity_id !== entityId) {
      return NextResponse.json({ error: 'Attachment does not belong to this entity' }, { status: 400 })
    }

    await db.file_attachment.delete({
      where: { id: attachmentId },
    })

    return NextResponse.json({ success: true, message: 'File unlinked successfully' })
  } catch (error: any) {
    console.error('DELETE /api/files/entity/... error:', error)
    return NextResponse.json({ error: error.message || 'Failed to unlink file' }, { status: 500 })
  }
}
