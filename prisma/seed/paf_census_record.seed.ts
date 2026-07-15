import type { PrismaClient } from '@prisma/client'

export async function seedPafCensusRecord(db: PrismaClient) {
  console.log('🌱 Seeding paf_census_record...')

  const claims = await db.form_i_claim.findMany()
  const plots = await db.mst_plot.findMany()

  if (claims.length === 0 || plots.length === 0) return

  const existing = await db.paf_census_record.findFirst()
  if (existing) return

  const pafCategories = ['homestead', 'shifting_allowance', 'cattle_shed', 'subsistence_grant'] as const
  const scCategories = ['ST', 'SC', 'OBC', 'General'] as const
  for (let i = 0; i < 6; i++) {
    await db.paf_census_record.create({
      data: {
        paf_id: `PAF-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        claimant_name: claims[i % claims.length].claimant_name,
        category_of_entitlement: pafCategories[i % 4],
        sc_st_obc_category: scCategories[i % 4],
        plot_id: plots[i % plots.length].id,
        photo_identity_card_doc: i % 3 === 0 ? `doc-paf-${i}` : null,
      },
    })
  }
}
