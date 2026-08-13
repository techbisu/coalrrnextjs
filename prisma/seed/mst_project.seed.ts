import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedMstProject(db: PrismaClient) {
  console.log('Seeding demo projects...')

  // 1. Ensure required master data exists
  let state = await db.state.findFirst()
  if (!state) {
    state = await db.state.create({
      data: {
        state_lgd: BigInt(20),
        state_en: 'Jharkhand',
        state_loc_vern: 'Jharkhand',
        is_active: true,
      }
    })
  }

  let area = await db.area.findFirst()
  if (!area) {
    area = await db.area.create({
      data: {
        area_cd: 'AREA-01',
        area_en: 'BCCL Area 1',
        is_active: true,
        state_lgd: state.state_lgd,
      }
    })
  }

  let mine = await db.mine.findFirst()
  if (!mine) {
    mine = await db.mine.create({
      data: {
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
    const existing = await db.project.findFirst({ where: { projNm: p.name } })
    if (!existing) {
      await db.project.create({
        data: {
          projCd: randomUUID(),
          projNm: p.name,
          eclProjCd: p.mine_cd, // using mine_cd as eclProjCd for demo
          totalApprovedArea: p.total_land_limit_acres.toString(),
          totalAcquiredArea: '0',
          totalEmpSanctioned: p.total_employment_quota,
          totalEmpCompleted: 0,
          landBudget: p.total_budget_ceiling.toString(),
          rrBudget: '0',
          status: 0,
          isActive: true,
          lockedAt: p.locked_at,
        }
      })
    }
  }

  console.log('Demo projects seeded successfully!')
}
