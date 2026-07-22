import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedProject(db: PrismaClient) {
  console.log('Seeding Project master...')

  const projectsToCreate = [
    {
      projCd: 'PROJ-01',
      eclProjCd: 'ECL-P-01',
      projNm: 'BCCL Rajapur OCP Expansion Baseline',
      projectDesc: 'Rajapur Open Cast Project Phase II',
      totalApprovedArea: 1200.5,
      totalAcquiredArea: 0,
      totalEmpSanctioned: 150,
      totalEmpCompleted: 0,
      landBudget: 45000000.0,
      rrBudget: 5000000.0,
      status: 1,
      tenantId: 'default-tenant',
      statutoryClearances: {
        dgms: 'DGMS/APP/2023/101',
        environment: 'EC/2023/8892',
        forest: 'FC/2023/Stage1/992'
      }
    },
    {
      projCd: 'PROJ-02',
      eclProjCd: 'ECL-P-02',
      projNm: 'ECL Jhanjra Underground Phase II Baseline',
      projectDesc: 'Jhanjra UG Expansion',
      totalApprovedArea: 850.0,
      totalAcquiredArea: 250.0,
      totalEmpSanctioned: 85,
      totalEmpCompleted: 20,
      landBudget: 28000000.0,
      rrBudget: 2000000.0,
      status: 1,
      tenantId: 'default-tenant',
      statutoryClearances: {
        dgms: 'DGMS/APP/2021/404',
        environment: 'EC/2021/3341',
        forest: 'FC/2021/Stage2/112'
      }
    }
  ]

  for (const p of projectsToCreate) {
    const existing = await db.project.findUnique({ where: { projCd: p.projCd } })
    if (!existing) {
      await db.project.create({
        data: {
          projCd: p.projCd,
          eclProjCd: p.eclProjCd,
          projNm: p.projNm,
          projectDesc: p.projectDesc,
          totalApprovedArea: p.totalApprovedArea,
          totalAcquiredArea: p.totalAcquiredArea,
          totalEmpSanctioned: p.totalEmpSanctioned,
          totalEmpCompleted: p.totalEmpCompleted,
          landBudget: p.landBudget,
          rrBudget: p.rrBudget,
          status: p.status,
          tenantId: p.tenantId,
          statutoryClearances: p.statutoryClearances,
          isActive: true,
          entryTs: BigInt(Date.now()),
          updtTs: BigInt(Date.now()),
        }
      })
    }
  }

  console.log('Project master seeded successfully!')
}
