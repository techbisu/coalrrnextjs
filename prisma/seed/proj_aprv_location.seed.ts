import type { PrismaClient } from '@prisma/client'

export async function seedProjAprvLocation(db: PrismaClient) {
  console.log('Seeding ProjAprvLocation master...')

  const locationsToCreate = [
    {
      aprvLocationCode: 'LOC-01',
      aprvCd: BigInt(211422),
      areaCd: 'AREA-01',
      mineCd: 'MINE-01',
      mouzaLgd: BigInt(211422),
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
      aprvCd: BigInt(211423),
      areaCd: 'AREA-01',
      mineCd: 'MINE-01',
      mouzaLgd: BigInt(211422),
      approvedArea: 850.0,
      locationRemark: 'Jhanjra mouza',
      landClassBreakup: {
        forest: 100.0,
        raiyati: 750.0
      }
    },
    {
      aprvLocationCode: 'LOC-03',
      aprvCd: BigInt(211424),
      areaCd: 'AREA-01',
      mineCd: 'MINE-01',
      mouzaLgd: BigInt(211422),
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
