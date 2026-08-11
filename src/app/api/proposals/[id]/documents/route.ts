import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, serverError, notFound } from '@/app/api/_lib'
import { proposalDocumentPackageService } from '@/infrastructure/di/Container'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.view')
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const result = await proposalDocumentPackageService.getPackageDocuments(id)
    if (result.isFailure) return badRequest(String(result.error))

    return ok(result.value)
  } catch (e: any) {
    console.error('GET /api/proposals/[id]/documents error:', e)
    return serverError('Failed to fetch documents', e.message)
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.edit')
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return badRequest('No file provided')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await proposalDocumentPackageService.uploadAndAttach({
      proposalId: id,
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      userId: auth.user.id,
      module: 'LAND_ACQ_PROPOSAL'
    })

    if (result.isFailure) {
      if (String(result.error).includes('not found')) return notFound('Proposal not found')
      return badRequest(String(result.error))
    }

    return ok(result.value)
  } catch (e: any) {
    console.error('POST /api/proposals/[id]/documents error:', e)
    return serverError('Failed to upload document', e.message)
  }
}
