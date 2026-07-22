import type { PrismaClient } from '@prisma/client'

export async function seedProjAprvLocation(db: PrismaClient) {
  console.log('Seeding ProjAprvLocation master...')

  const locationsToCreate = [
    {
      aprvLocationCode: 'LOC-01',
      aprvCd: 10001n,
      areaCd: 'AREA-01',
      mineCd: 'MINE-01',
      mouzaLgd: 5001n,
      approvedArea: 1200.5,
      locationRemark: 'Main mouza for Rajapur OCP',
      landClassBreakup: {
        forest: 300.0,
        gair_mazarua: 150.5,
        raiyati: 750.0
      }
    },
    {
      aprvLocationCode: 'LOC-02',
      aprvCd: 10002n,
      areaCd: 'AREA-01',
      mineCd: 'MINE-01',
      mouzaLgd: 5002n,
      approvedArea: 850.0,
      locationRemark: 'Jhanjra mouza',
      landClassBreakup: {
        forest: 100.0,
        raiyati: 750.0
      }
    },
    {
      aprvLocationCode: 'LOC-03',
      aprvCd: 10003n,
      areaCd: 'AREA-01',
      mineCd: 'MINE-01',
      mouzaLgd: 5001n,
      approvedArea: 50.0,
      locationRemark: 'Expansion deviation for Rajapur OCP',
      landClassBreakup: {
        raiyati: 50.0
      }
    }
  ]

  for (const l of locationsToCreate) {
    const existing = await db.projAprvLocation.findUnique({ where: { aprvLocationCode: l.aprvLocationCode } })
    if (!existing) {
      await db.projAprvLocation.create({
        data: {
          ...l,
          entryTs: BigInt(Date.now()),
          updtTs: BigInt(Date.now()),
        }
      })
    }
  }

  console.log('ProjAprvLocation seeded successfully!')
}
