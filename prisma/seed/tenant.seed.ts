import type { PrismaClient } from '@prisma/client'

export async function seedTenant(db: PrismaClient) {
  console.log('Seeding Tenant master...')

  const defaultTenant = {
    tenantId: 'default-tenant',
    tenantCode: 'DEF',
    tenantName: 'Default Organization',
    tenantType: 'INTERNAL',
    parentOrg: 'HQ',
    isActive: true,
  }

  const existing = await db.tenant.findUnique({ where: { tenantId: defaultTenant.tenantId } })
  if (!existing) {
    await db.tenant.create({
      data: {
        ...defaultTenant,
        entryTs: BigInt(Date.now()),
        updtTs: BigInt(Date.now()),
      }
    })
  }

  console.log('Tenant master seeded successfully!')
}
