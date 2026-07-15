import type { PrismaClient } from '@prisma/client'

export async function seedWorkflowReviewTask(db: PrismaClient) {
  console.log('🌱 Seeding workflow_review_task...')

  const payroll = await db.compensation_payroll.findFirst({ where: { payroll_code: 'PR-2026-0412' } })
  if (!payroll) return

  const existing = await db.workflow_review_task.findFirst({ where: { reviewable_id: payroll.id } })
  if (!existing) {
    await db.workflow_review_task.createMany({
      data: [
        { reviewable_type: 'compensation_payroll', reviewable_id: payroll.id, role: 'gm_planning', status: 'approved', decided_by: 'GM(Planning)-MK', decided_at: new Date(Date.now() - 86400000), comment: 'Verified plot schedules.' },
        { reviewable_type: 'compensation_payroll', reviewable_id: payroll.id, role: 'gm_finance', status: 'pending' },
      ],
    })
  }
}
