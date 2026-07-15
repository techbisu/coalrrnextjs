import type { PrismaClient } from '@prisma/client'

export async function seedGrievance(db: PrismaClient) {
  console.log('🌱 Seeding grievance...')

  const claims = await db.form_i_claim.findMany()
  if (claims.length < 2) return

  const existing = await db.grievance.findFirst({ where: { grievance_code: 'GRV-2026-0034' } })
  if (existing) return

  await db.grievance.create({
    data: {
      grievance_code: 'GRV-2026-0034',
      related_type: 'form_i_claim',
      related_id: claims[1].id,
      complainant_name: 'Neighbor: Durga Prasad',
      description: 'Boundary dispute on northern edge of plot P-102; claims overlap with adjoining tenancy land.',
      sla_due_at: new Date(Date.now() + 6 * 86400000),
    },
  })
}
