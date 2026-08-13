import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { jobDispatcher } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const auth = await authorizeApi('project.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { instanceId } = body
    
    if (!instanceId) {
      return badRequest('instanceId is required')
    }

    // 1. Atomic claim & duplicate click protection
    // Try to transition status to QUEUED only if not already QUEUED or GENERATING
    const claimResult = await db.document_instance.updateMany({
      where: {
        id: instanceId,
        status: { notIn: ['QUEUED', 'GENERATING'] }
      },
      data: { status: 'QUEUED' }
    })

    if (claimResult.count === 0) {
      // Instance was already claimed or does not exist
      const existing = await db.document_instance.findUnique({ where: { id: instanceId } })
      if (!existing) {
        return badRequest('Document instance not found')
      }
      if (['QUEUED', 'GENERATING'].includes(existing.status)) {
        return ok({
          success: true,
          instanceId,
          status: existing.status,
          message: 'Document generation is already in progress'
        })
      }
    }

    // 2. Dispatch background generation job via JobDispatcherService
    try {
      await jobDispatcher.dispatch('generateDocument', { instanceId })
    } catch (dispatchErr: any) {
      console.error(`[POST /api/document-engine/generate] Dispatch failed for ${instanceId}:`, dispatchErr)
      // Rollback ONLY if still QUEUED (do not overwrite if worker already moved to GENERATING)
      await db.document_instance.updateMany({
        where: {
          id: instanceId,
          status: 'QUEUED',
        },
        data: {
          status: 'DRAFT',
        },
      })
      throw dispatchErr
    }

    // 3. Return immediately without waiting for DOCX rendering
    return ok({
      success: true,
      instanceId,
      status: 'QUEUED'
    })
  } catch (error: any) {
    console.error('Error in POST /api/document-engine/generate:', error)
    return serverError('Failed to queue document generation', error.message)
  }
}
