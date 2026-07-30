const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const p = await db.project.findFirst({ select: { proj_cd: true, projNm: true, state_lgd: true }});
  console.log(p);
}
main().finally(() => db.$disconnect());
