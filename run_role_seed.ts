const { PrismaClient } = require('@prisma/client');
const { seedRole } = require('./prisma/seed/role.seed.ts');
const prisma = new PrismaClient();
async function main() {
  await seedRole(prisma);
}
main().finally(() => prisma.$disconnect());
