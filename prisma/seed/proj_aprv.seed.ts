import type { PrismaClient } from '@prisma/client'

export async function seedProjAprv(db: PrismaClient) {
  console.log('Seeding ProjAprv master...')

  const approvalsToCreate = [
    {
      aprvCd: 10001n,
      projCd: 'PROJ-01',
      aprvArea: 1200.5,
      areaAcq: 0,
      empSanc: 150,
      aprvDt: new Date('2023-01-15'),
      aprvRefNo: 'CMD/PR/2023/001',
      isActive: true,
      remark: 'Initial PR Baseline for Rajapur OCP Expansion',
      districtLgd: '20',
      psLgd: '120',
      blockLgd: '140',
      mouzaLgd: '5001',
      propId: 101n,
      rrCap: 5000000.0,
      landCap: 45000000.0,
      aprvType: 'INITIAL_PR',
      aprvLevel: 'CMD',
      aprvDocId: null
    },
    {
      aprvCd: 10002n,
      projCd: 'PROJ-02',
      aprvArea: 850.0,
      areaAcq: 250.0,
      empSanc: 85,
      aprvDt: new Date('2021-06-20'),
      aprvRefNo: 'CMD/PR/2021/088',
      isActive: true,
      remark: 'Initial PR Baseline for Jhanjra',
      districtLgd: '21',
      psLgd: '121',
      blockLgd: '141',
      mouzaLgd: '5002',
      propId: 102n,
      rrCap: 2000000.0,
      landCap: 28000000.0,
      aprvType: 'INITIAL_PR',
      aprvLevel: 'CMD',
      aprvDocId: null
    },
    {
      aprvCd: 10003n,
      projCd: 'PROJ-01',
      aprvArea: 50.0,
      areaAcq: 0,
      empSanc: 5,
      aprvDt: new Date('2024-02-10'),
      aprvRefNo: 'BRD/DEV/2024/022',
      isActive: true,
      remark: 'Board approval for extra 50 acres deviation Form-XXII',
      districtLgd: '20',
      psLgd: '120',
      blockLgd: '140',
      mouzaLgd: '5001',
      propId: 103n,
      rrCap: 500000.0,
      landCap: 2000000.0,
      aprvType: 'FORM_XXII_DEVIATION',
      aprvLevel: 'BOARD_OF_DIRECTORS',
      aprvDocId: null
    }
  ]

  for (const a of approvalsToCreate) {
    const existing = await db.projAprv.findUnique({ where: { aprvCd: a.aprvCd } })
    if (!existing) {
      await db.projAprv.create({
        data: {
          ...a,
          entryTs: BigInt(Date.now()),
          updtTs: BigInt(Date.now()),
        }
      })
    }
  }

  console.log('ProjAprv seeded successfully!')
}
