const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const p = await db.project.findFirst({ include: { approvals: { include: { locations: true } } } });
  console.log(p);
}
main().finally(() => db.$disconnect());
