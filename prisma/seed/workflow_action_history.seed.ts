import type { PrismaClient } from '@prisma/client'

export async function seedWorkflowActionHistory(db: PrismaClient) {
  console.log('🌱 Seeding workflow_action_history...')

  const proposal = await db.acq_proposal.findFirst()
  if (!proposal) return

  const existing = await (db as any).workflow_action_history.findFirst({
    where: { entity_type: 'LAND_SCHEDULE', entity_id: proposal.proposal_id }
  })

  if (!existing) {
    await (db as any).workflow_action_history.create({
      data: {
        entity_type: 'LAND_SCHEDULE',
        entity_id: proposal.proposal_id,
        workflow_code: 'LAND_SCHEDULE',
        action: 'submit_to_unit',
        from_state: 'Drafting',
        to_state: 'UnitSubmitted',
        comments: 'Initial survey plot schedule attached and submitted for verification.',
        entry_by: proposal.entry_by || 'system',
        updt_by: proposal.entry_by || 'system'
      }
    })
  }
}
