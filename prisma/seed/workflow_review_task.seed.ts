import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedWorkflowReviewTask(db: PrismaClient) {
  console.log('🌱 Seeding workflow_review_task...')

  const payroll = await db.compensation_payroll.findFirst({ where: { payroll_code: 'PR-2026-0412' } })
  if (!payroll) return

  const existing = await (db as any).workflow_review_task.findFirst({ where: { entity_id: payroll.id } })
  if (!existing) {
    await (db as any).workflow_review_task.createMany({
      data: [
        { review_task_id: randomUUID(), entity_type: 'compensation_payroll', entity_id: payroll.id, role: 'gm_planning', status: 'approved', decided_by: 'GM(Planning)-MK', decided_at: new Date(Date.now() - 86400000), comment: 'Verified plot schedules.', entry_by: 'system', updt_by: 'system', entry_ts: new Date(), updt_ts: new Date() },
        { review_task_id: randomUUID(), entity_type: 'compensation_payroll', entity_id: payroll.id, role: 'gm_finance', status: 'pending', entry_by: 'system', updt_by: 'system', entry_ts: new Date(), updt_ts: new Date() },
      ],
    })
  }
}
