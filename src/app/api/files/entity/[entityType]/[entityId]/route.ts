import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'

type Ctx = { params: Promise<{ entityType: string; entityId: string }> }

/**
 * Maps entityType → module-scoped file workspace permission pair.
 * Pattern: <module>.file.workspace.view / <module>.file.workspace.upload
 */
function resolveFilePermissions(entityType: string): { view: string; upload: string } {
  if (entityType.includes('project')) {
    return { view: 'project.file.workspace.view', upload: 'project.file.workspace.upload' }
  }
  const LAND_SCHEDULE_ALIASES = [CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, 'land-schedule']
  if (entityType.includes('acq') || LAND_SCHEDULE_ALIASES.some(alias => entityType.includes(alias))) {
    return { view: 'acquisition.file.workspace.view', upload: 'acquisition.file.workspace.upload' }
  }
  if (entityType.includes('proposal')) {
    return { view: 'proposal.file.workspace.view', upload: 'proposal.file.workspace.upload' }
  }
  if (entityType.includes('payroll') || entityType.includes('compensation')) {
    return { view: 'payroll.file.workspace.view', upload: 'payroll.file.workspace.upload' }
  }
  // Fallback: require global file workspace access
  return { view: 'file.workspace.view', upload: 'file.workspace.upload' }
}

/**
 * GET /api/files/entity/[entityType]/[entityId]
 * Lists all file attachments for a given entity with metadata and tags.
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { entityType, entityId } = await ctx.params
    const { view } = resolveFilePermissions(entityType)
    const auth = await authorizeApi(view)
    if (auth.error) return auth.error

    const attachments = await db.file_attachment.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      include: {
        file_record: {
          include: {
            file_version: {
              orderBy: { version_number: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { entry_ts: 'desc' },
    })

    const mappedFiles = attachments.map((a) => {
      const f = a.file_record
      const latestVersion = f.file_version[0]

      // Parse tags string into array
      let tagArray: string[] = []
      if (f.tags) {
        try {
          tagArray = f.tags.startsWith('[')
            ? JSON.parse(f.tags)
            : f.tags.split(',').map((t) => t.trim()).filter(Boolean)
        } catch {
          tagArray = f.tags.split(',').map((t) => t.trim()).filter(Boolean)
        }
      }

      return {
        attachment_id: a.id,
        file_id: f.id,
        file_name: f.original_name,
        file_size_kb: latestVersion ? Math.round(Number(latestVersion.size_bytes) / 1024) : 0,
        mime_type: latestVersion ? latestVersion.mime_type : 'application/octet-stream',
        storage_path: latestVersion ? latestVersion.storage_path : '',
        tags: tagArray,
        status: f.is_active ? 'ACTIVE' : 'inactive',
        uploaded_by: a.attached_by || f.owner_id || 'System',
        module: a.module,
        entry_ts: a.entry_ts.toISOString(),
      }
    })

    return NextResponse.json({ success: true, data: mappedFiles })
  } catch (error: any) {
    console.error('GET /api/files/entity error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch entity files' }, { status: 500 })
  }
}

/**
 * POST /api/files/entity/[entityType]/[entityId]
 * A) JSON body { file_ids, module }  → link existing files to entity
 * B) multipart/form-data { file, tags, module } → upload new file + attach
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { entityType, entityId } = await ctx.params
    const { upload } = resolveFilePermissions(entityType)
    const auth = await authorizeApi(upload)
    if (auth.error) return auth.error

    const contentType = req.headers.get('content-type') || ''

    // ── Option A: Link existing file IDs ─────────────────────────────────────
    if (contentType.includes('application/json')) {
      const body = await req.json()
      const { file_ids, module: moduleCode } = body

      if (!Array.isArray(file_ids) || file_ids.length === 0) {
        return NextResponse.json({ error: 'file_ids array is required' }, { status: 400 })
      }

      const attachmentsToCreate = file_ids.map((fileId: string) => ({
        id: uuidv4(),
        file_id: fileId,
        entity_type: entityType,
        entity_id: entityId,
        module: moduleCode || 'general',
        attached_by: String(auth.user.id),
        updt_ts: new Date(),
      }))

      await db.file_attachment.createMany({
        data: attachmentsToCreate,
        skipDuplicates: true,
      })

      return NextResponse.json({ success: true, count: attachmentsToCreate.length })
    }

    // ── Option B: Multipart upload with tags ──────────────────────────────────
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tagsRaw = formData.get('tags') as string | null
    const moduleCode = (formData.get('module') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Normalise tags to comma-separated string
    let tagsString: string | null = null
    if (tagsRaw) {
      try {
        const parsed = JSON.parse(tagsRaw)
        tagsString = Array.isArray(parsed) ? parsed.join(',') : String(tagsRaw)
      } catch {
        tagsString = String(tagsRaw)
      }
    }

    const fileId       = uuidv4()
    const versionId    = uuidv4()
    const attachmentId = uuidv4()
    const arrayBuffer  = await file.arrayBuffer()
    const buffer       = Buffer.from(arrayBuffer)
    const storagePath  = `uploads/${entityType}/${entityId}/${fileId}-${file.name}`

    // Atomic transaction: file_record + file_version + file_attachment
    await db.$transaction(async (tx) => {
      await tx.file_record.create({
        data: {
          id: fileId,
          original_name: file.name,
          owner_id: String(auth.user.id),
          tags: tagsString,
          is_active: true,
          updt_ts: new Date(),
        },
      })

      await tx.file_version.create({
        data: {
          id: versionId,
          file_id: fileId,
          version_number: 1,
          storage_provider: 'LOCAL',
          storage_path: storagePath,
          mime_type: file.type || 'application/octet-stream',
          extension: file.name.split('.').pop() || '',
          size_bytes: BigInt(buffer.length),
          updt_ts: new Date(),
        },
      })

      await tx.file_attachment.create({
        data: {
          id: attachmentId,
          file_id: fileId,
          entity_type: entityType,
          entity_id: entityId,
          module: moduleCode,
          attached_by: String(auth.user.id),
          updt_ts: new Date(),
        },
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        attachment_id: attachmentId,
        file_id: fileId,
        file_name: file.name,
        file_size_kb: Math.round(buffer.length / 1024),
        mime_type: file.type,
        tags: tagsString ? tagsString.split(',') : [],
        uploaded_by: String(auth.user.id),
        entry_ts: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('POST /api/files/entity upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
