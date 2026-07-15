const { PrismaClient } = require('@prisma/client');
async function main() {
  const db = new PrismaClient();
  const users = await db.user.findMany({ select: { id: true, email: true, role: true } });
  console.log('Users:', users);
  
  // Make everyone Super Administrator for local dev
  await db.user.updateMany({ data: { role: 'Super Administrator' } });
  
  // Assign role to model_has_role (just find the Super Admin role ID first)
  const role = await db.role.findFirst({ where: { name: 'Super Administrator' } });
  if (role) {
    for (const u of users) {
      await db.model_has_role.upsert({
        where: { role_id_model_type_model_id: { model_id: u.id, model_type: 'user', role_id: role.id } },
        update: {},
        create: { model_id: u.id, model_type: 'user', role_id: role.id }
      });
    }
    console.log('Updated all users to Super Administrator');
  }

  await db.$disconnect();
}
main().catch(console.error);
