import type { PrismaClient } from '@prisma/client'

export async function seedAcquMode(db: PrismaClient) {
  console.log('🌱 Seeding acqu_mode...')

  const modes = [
    { acq_mode_id: 1n, aquisition_method: "CBA (A&D) Act 1957" },
    { acq_mode_id: 2n, aquisition_method: "RFCTLARR Act 2013" },
    { acq_mode_id: 4n, aquisition_method: "Lease Government Land" },
    { acq_mode_id: 5n, aquisition_method: "Diversion of Forest Land (FC Act 1980)" },
    { acq_mode_id: 7n, aquisition_method: "Inherited land" },
    { acq_mode_id: 3n, aquisition_method: "LTS/ Transfer of Government Land" },
    { acq_mode_id: 6n, aquisition_method: "Direct Purchase" },
    { acq_mode_id: 8n, aquisition_method: "LA Act / WB LAND (R&A) Act 1948" },
    { acq_mode_id: 9n, aquisition_method: "Lease Tenancy Land" }
  ]

  for (const mode of modes) {
    await db.acqu_mode.upsert({
      where: { acq_mode_id: mode.acq_mode_id },
      update: { aquisition_method: mode.aquisition_method },
      create: mode,
    })
  }
}
