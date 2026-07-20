import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedMstProject(db: PrismaClient) {
  console.log('Seeding demo projects...')

  // 1. Ensure required master data exists
  let state = await db.state_master.findFirst()
  if (!state) {
    state = await db.state_master.create({
      data: {
        id: randomUUID(),
        state_lgd: 20n,
        state_en: 'Jharkhand',
        stateLocVern: 'Jharkhand',
        is_active: true,
      }
    })
  }

  let area = await db.area_master.findFirst()
  if (!area) {
    area = await db.area_master.create({
      data: {
        id: randomUUID(),
        area_cd: 'AREA-01',
        area_en: 'BCCL Area 1',
        is_active: true,
        state_lgd: state.state_lgd,
      }
    })
  }

  let mine = await db.mine_master.findFirst()
  if (!mine) {
    mine = await db.mine_master.create({
      data: {
        id: randomUUID(),
        mine_cd: 'MINE-01',
        mine_en: 'Demo Mine',
        area_cd: area.area_cd,
        is_active: true,
        state_lgd: state.state_lgd,
      }
    })
  }
  // 2. Clear existing projects if any to avoid collision
  // await db.mst_project.deleteMany({}) // Disabled to prevent FK violation on land_schedule

  // 3. Create demo projects
  const projectsToCreate = [
    {
      name: 'BCCL Rajapur OCP Expansion',
      mine_cd: mine.mine_cd,
      total_land_limit_acres: 1200.5,
      total_budget_ceiling: 45000000.0,
      total_employment_quota: 150,
      boundary: '{"type":"MultiPolygon","coordinates":[]}',
      locked_at: null,
      lockedBy: null,
    },
    {
      name: 'ECL Jhanjra Underground Phase II',
      mine_cd: mine.mine_cd,
      total_land_limit_acres: 850.0,
      total_budget_ceiling: 28000000.0,
      total_employment_quota: 85,
      boundary: '{"type":"MultiPolygon","coordinates":[]}',
      locked_at: new Date(),
      lockedBy: 'admin',
    },
    {
      name: 'MCL Bhubaneswari OCP Greenfield',
      mine_cd: mine.mine_cd,
      total_land_limit_acres: 3400.25,
      total_budget_ceiling: 120000000.0,
      total_employment_quota: 450,
      boundary: '{"type":"MultiPolygon","coordinates":[]}',
      locked_at: null,
      lockedBy: null,
    }
  ]

  for (const p of projectsToCreate) {
    const existing = await db.mst_project.findFirst({ where: { name: p.name } })
    if (!existing) {
      await db.mst_project.create({
        data: {
          id: randomUUID(),
          name: p.name,
          mine_cd: p.mine_cd,
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
  }

  console.log('Demo projects seeded successfully!')
}
