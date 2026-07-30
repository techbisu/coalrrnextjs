const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const p = await db.mouza_master.findUnique({ where: { mouza_lgd: 2819017n }});
  console.log({
    mouza_lgd: p.mouza_lgd.toString(),
    mouza_en: p.mouza_en,
    state_lgd: p.state_lgd ? p.state_lgd.toString() : null
  });
}
main().finally(() => db.$disconnect());
