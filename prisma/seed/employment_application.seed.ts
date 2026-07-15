import type { PrismaClient } from '@prisma/client'

export async function seedEmploymentApplication(db: PrismaClient) {
  console.log('🌱 Seeding employment_application...')

  const project = await db.mst_project.findFirst()
  const pool = await db.nominee_pool.findFirst()

  if (!project || !pool) return

  const existing = await db.employment_application.findFirst({ where: { application_code: 'EMP-2026-0117' } })
  if (existing) return

  await db.employment_application.create({
    data: {
      application_code: 'EMP-2026-0117',
      project_id: project.id,
      nominee_pool_id: pool.id,
      form_ix_balance_acres: '2.2500',
      form_x_balance_jobs: 1,
      state: 'Cl4Checklist',
      exception_flags: JSON.stringify({ femaleNomineeCounselingRequired: false, landCategoryException: null }),
    },
  })
}
