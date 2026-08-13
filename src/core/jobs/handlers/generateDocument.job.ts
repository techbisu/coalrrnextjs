import { db } from '@/lib/db'

export interface GenerateDocumentJobPayload {
  instanceId: string
}

export const generateDocumentJob = async (payload: GenerateDocumentJobPayload): Promise<void> => {
  const { instanceId } = payload
  if (!instanceId) {
    console.warn('[generateDocumentJob] Missing instanceId in payload')
    return
  }

  console.log(`[generateDocumentJob] Starting generation for instanceId: ${instanceId}`)

  // 1. Fetch document_instance
  const instance = await db.document_instance.findUnique({
    where: { id: instanceId },
  })

  if (!instance) {
    console.warn(`[generateDocumentJob] Document instance not found: ${instanceId}`)
    return
  }

  // 2. Verify status is QUEUED or GENERATING (eligible for execution)
  if (instance.status !== 'QUEUED' && instance.status !== 'GENERATING') {
    console.warn(`[generateDocumentJob] Instance ${instanceId} in status '${instance.status}' is not eligible for generation`)
    return
  }

  // 3. Atomically transition state from QUEUED -> GENERATING
  if (instance.status === 'QUEUED') {
    await db.document_instance.update({
      where: { id: instanceId },
      data: { status: 'GENERATING' },
    })
  }

  try {
    // 4. Delegate execution to GenerateDocumentUseCase (pure domain business logic)
    const { generateDocumentUseCase } = await import('@/infrastructure/di/Container')
    const result = await generateDocumentUseCase.execute({ instanceId })

    if (result.isFailure) {
      console.error(`[generateDocumentJob] Generation failed for ${instanceId}:`, result.error)
      await db.document_instance.update({
        where: { id: instanceId },
        data: { status: 'FAILED' },
      })
      return
    }

    // 5. Success -> Update status to DRAFT (or COMPLETED if signed)
    const hasSigs = Array.isArray(instance.signature_data_json) && (instance.signature_data_json as any[]).length > 0
    const finalStatus = hasSigs ? 'COMPLETED' : 'DRAFT'

    await db.$transaction(async (tx) => {
      await tx.document_instance.update({
        where: { id: instanceId },
        data: { status: finalStatus },
      })

      // 6. Emit Outbox Event for Realtime SSE & TanStack Query auto-invalidation
      await tx.outbox_events.create({
        data: {
          event_name: 'DOCUMENT_GENERATED',
          module: 'DOCUMENT_ENGINE',
          payload: {
            instanceId,
            templateCode: instance.template_code,
            applicationId: instance.application_id,
            fileId: result.value?.fileId,
            status: finalStatus,
          },
        },
      })
    })

    console.log(`[generateDocumentJob] Successfully generated document for ${instanceId} (FileId: ${result.value?.fileId})`)
  } catch (err: any) {
    console.error(`[generateDocumentJob] Execution error for ${instanceId}:`, err)
    try {
      await db.document_instance.update({
        where: { id: instanceId },
        data: { status: 'FAILED' },
      })
    } catch (dbErr) {
      console.error('[generateDocumentJob] Failed to set status FAILED:', dbErr)
    }
  }
}
