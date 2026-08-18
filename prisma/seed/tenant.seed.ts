import type { PrismaClient } from '@prisma/client'

export async function seedTenant(db: PrismaClient) {
  console.log('Seeding Tenant master...')

  const tenants = [
    {
      tenantId: 'ecl',
      tenantCode: 'ECL',
      tenantName: 'Eastern Coalfields Limited',
      tenantType: 'SUBSIDIARY',
      parentOrg: 'Coal India Limited',
      isActive: true,
    },
    {
      tenantId: 'public',
      tenantCode: 'PUB',
      tenantName: 'Public Citizen Portal',
      tenantType: 'EXTERNAL',
      parentOrg: 'ECL',
      isActive: true,
    },
    {
      tenantId: 'default-tenant',
      tenantCode: 'DEF',
      tenantName: 'Default Organization',
      tenantType: 'INTERNAL',
      parentOrg: 'HQ',
      isActive: true,
    },
  ]

  for (const tenantData of tenants) {
    const existing = await db.tenant.findUnique({ where: { tenantId: tenantData.tenantId } })
    if (!existing) {
      await db.tenant.create({
        data: {
          ...tenantData,
          entryTs: BigInt(Date.now()),
          updtTs: BigInt(Date.now()),
        },
      })
    }
  }

  console.log('Tenant master seeded successfully!')
}
