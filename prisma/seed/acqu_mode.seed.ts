import type { PrismaClient } from '@prisma/client'

export async function seedAcquMode(db: PrismaClient) {
  console.log('🌱 Seeding acqu_mode...')

  const modes = [
    { acq_mode_id: BigInt(1), aquisition_method: "CBA (A&D) Act 1957" },
    { acq_mode_id: BigInt(2), aquisition_method: "RFCTLARR Act 2013" },
    { acq_mode_id: BigInt(4), aquisition_method: "Lease Government Land" },
    { acq_mode_id: BigInt(5), aquisition_method: "Diversion of Forest Land (FC Act 1980)" },
    { acq_mode_id: BigInt(7), aquisition_method: "Inherited land" },
    { acq_mode_id: BigInt(3), aquisition_method: "LTS/ Transfer of Government Land" },
    { acq_mode_id: BigInt(6), aquisition_method: "Direct Purchase" },
    { acq_mode_id: BigInt(8), aquisition_method: "LA Act / WB LAND (R&A) Act 1948" },
    { acq_mode_id: BigInt(9), aquisition_method: "Lease Tenancy Land" }
  ]

  for (const mode of modes) {
    await db.acqu_mode.upsert({
      where: { acq_mode_id: mode.acq_mode_id },
      update: { aquisition_method: mode.aquisition_method },
      create: mode,
    })
  }
}
