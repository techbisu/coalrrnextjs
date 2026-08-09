import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ fileId: string }> }

/**
 * Maps entityType → module-scoped file workspace upload permission.
 * Accepts entityType via ?entityType= query param so the caller
 * (EntityFileManagerModal) can pass context without changing the URL structure.
 * Defaults to global file.workspace.upload if not supplied or recognized.
 */
function resolveUploadPermission(entityType: string | null): string {
  if (!entityType) return 'file.workspace.upload'
  if (entityType.includes('project'))
    return 'project.file.workspace.upload'
  if (entityType.includes('acq') || entityType.includes('land_schedule') || entityType.includes('land-schedule'))
    return 'acquisition.file.workspace.upload'
  if (entityType.includes('proposal'))
    return 'proposal.file.workspace.upload'
  if (entityType.includes('payroll') || entityType.includes('compensation'))
    return 'payroll.file.workspace.upload'
  return 'file.workspace.upload'
}

/**
 * PATCH /api/files/[fileId]/tags?entityType=<entityType>
 * Updates tags for an existing file_record.
 * Pass ?entityType= so the correct module-scoped permission is enforced.
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entityType')
    const permission = resolveUploadPermission(entityType)

    const auth = await authorizeApi(permission)
    if (auth.error) return auth.error

    const { fileId } = await ctx.params
    const body = await req.json()
    const { tags } = body

    let tagsString: string | null = null
    if (Array.isArray(tags)) {
      tagsString = tags.join(',')
    } else if (typeof tags === 'string') {
      tagsString = tags
    }

    const updated = await db.file_record.update({
      where: { id: fileId },
      data: {
        tags: tagsString,
        updt_ts: new Date(),
        updt_by: String(auth.user.id),
      },
    })

    return NextResponse.json({
      success: true,
      file_id: updated.id,
      tags: updated.tags ? updated.tags.split(',') : [],
    })
  } catch (error: any) {
    console.error('PATCH /api/files/[fileId]/tags error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update file tags' }, { status: 500 })
  }
}
