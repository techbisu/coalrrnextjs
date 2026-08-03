import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '@/app/api/_lib'
import { approveBoardDeviationUseCase, uploadFileUseCase } from '@/infrastructure/di/Container'
type Ctx = { params: Promise<{ id: string }> }


export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('proposal.approve')
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    const formData = await req.formData()
    
    const file = formData.get('file') as File | null
    const extendedLimitAcres = formData.get('extendedLimitAcres') as string
    const oldLimitAcres = formData.get('oldLimitAcres') as string
    const extendedCostLimit = formData.get('extendedCostLimit') as string | undefined
    const oldCostLimit = formData.get('oldCostLimit') as string | undefined
    const extendedEmploymentQuota = formData.get('extendedEmploymentQuota') as string | undefined
    const oldEmploymentQuota = formData.get('oldEmploymentQuota') as string | undefined
    const comments = formData.get('comments') as string | undefined

    if (!extendedLimitAcres || !oldLimitAcres) {
      return badRequest('extendedLimitAcres and oldLimitAcres are required.')
    }

    let fileId: string | undefined = undefined
    
    if (file) {
      // Create a buffer from the file
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const uploadResult = await uploadFileUseCase.execute({
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        buffer,
        ownerId: auth.user.id
      })
      
      if (uploadResult.isSuccess) {
        fileId = uploadResult.value?.id
      } else {
        return badRequest(String(uploadResult.error))
      }
    }

    const result = await approveBoardDeviationUseCase.execute({
      proposalId: id,
      user_id: auth.user.id,
      oldLimitAcres,
      extendedLimitAcres,
      extendedCostLimit,
      oldCostLimit,
      extendedEmploymentQuota,
      oldEmploymentQuota,
      signedDocumentFileId: fileId,
      comments
    })

    if (result.isFailure) {
      if (String(result.error).includes('not found')) {
        return notFound(String(result.error))
      }
      return badRequest(String(result.error))
    }

    return ok({ success: true, data: result.value })
  } catch (e: any) {
    console.error('POST /api/proposals/[id]/board-approve error:', e)
    return serverError('Failed to approve board deviation', e.message)
  }
}
