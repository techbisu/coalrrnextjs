import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding demo projects...')

  // 1. Ensure required master data exists
  let state = await db.stateMaster.findFirst()
  if (!state) {
    state = await db.stateMaster.create({
      data: {
        stateLgd: 20,
        stateEn: 'Jharkhand',
        stateLocVern: 'Jharkhand',
        is_active: true,
      }
    })
  }

  let area = await db.areaMaster.findFirst()
  if (!area) {
    area = await db.areaMaster.create({
      data: {
        areaCd: 'AREA-01',
        areaEn: 'BCCL Area 1',
        is_active: true,
        stateLgd: state.stateLgd,
      }
    })
  }

  let mine = await db.mineMaster.findFirst()
  if (!mine) {
    mine = await db.mineMaster.create({
      data: {
        mineCd: 'MINE-01',
        mineEn: 'Demo Mine',
        areaCd: area.areaCd,
        is_active: true,
        stateLgd: state.stateLgd,
      }
    })
  }

  // 2. Clear existing projects if any to avoid collision
  await db.mst_project.deleteMany({})

  // 3. Create demo projects
  const projectsToCreate = [
    {
      name: 'BCCL Rajapur OCP Expansion',
      colliery_code: mine.mineCd,
      total_land_limit_acres: 1200.5,
      total_budget_ceiling: 45000000.0,
      total_employment_quota: 150,
      boundary: '{"type":"MultiPolygon","coordinates":[]}',
      locked_at: null,
      lockedBy: null,
    },
    {
      name: 'ECL Jhanjra Underground Phase II',
      colliery_code: mine.mineCd,
      total_land_limit_acres: 850.0,
      total_budget_ceiling: 28000000.0,
      total_employment_quota: 85,
      boundary: '{"type":"MultiPolygon","coordinates":[]}',
      locked_at: new Date(),
      lockedBy: 'admin',
    },
    {
      name: 'MCL Bhubaneswari OCP Greenfield',
      colliery_code: mine.mineCd,
      total_land_limit_acres: 3400.25,
      total_budget_ceiling: 120000000.0,
      total_employment_quota: 450,
      boundary: '{"type":"MultiPolygon","coordinates":[]}',
      locked_at: null,
      lockedBy: null,
    }
  ]

  for (const p of projectsToCreate) {
    await db.mst_project.create({
      data: {
        name: p.name,
        colliery_code: p.colliery_code,
        total_land_limit_acres: p.total_land_limit_acres,
        total_budget_ceiling: p.total_budget_ceiling,
        total_employment_quota: p.total_employment_quota,
        boundary: p.boundary,
        locked_at: p.locked_at,
        entry_ts: new Date(),
        updt_ts: new Date(),
      }
    })
  }

  console.log('Demo projects seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
