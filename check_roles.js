const { PrismaClient } = require('@prisma/client');
async function main() {
  const db = new PrismaClient();
  const userId = 'cmrlquldx000jtod0ijr2070g';
  
  const user = await db.user.findUnique({ where: { id: userId } });
  console.log('User role column:', user.role);

  const roles = await db.model_has_role.findMany({
    where: { model_id: userId, model_type: 'user' },
    include: { role: true }
  });
  console.log('Model Has Roles:', roles.map(r => r.role.name));
  
  const perms = await db.role_has_permission.findMany({
    where: { role_id: roles[0]?.role.id },
    include: { permission: true }
  });
  console.log('Permissions for role:', perms.map(p => p.permission.name));
  
  await db.$disconnect();
}
main().catch(console.error);
