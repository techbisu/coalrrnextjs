import { db } from '@/lib/db'

export const invalidateContextualDocumentsHandler = async (payload: any): Promise<void> => {
  const proposalId = payload?.data?.proposal_id || payload?.entity_id
  
  if (!proposalId) {
    console.warn(`[invalidateContextualDocuments.job] Missing proposal_id in payload.`, payload)
    return
  }

  console.log(`[invalidateContextualDocuments.job] Invalidating context documents for proposal ${proposalId}`)

  // 1. Invalidate any draft or generated documents associated with this proposal's multi-target context
  //    that were explicitly created for the cross-colliery target.
  const result = await db.document_instance.updateMany({
    where: {
      application_id: proposalId,
      context_type: 'proposal',
      status: { in: ['DRAFT', 'GENERATED', 'PENDING_SIGNATURE'] },
      // Specifically target context_id != null or specific context docs if needed
      context_id: { not: null }
    },
    data: {
      status: 'VOIDED',
      updt_ts: new Date()
    }
  })

  console.log(`[invalidateContextualDocuments.job] Voided ${result.count} contextual documents for proposal ${proposalId}`)
}
