const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    const userRoles = await prisma.model_has_role.findMany({ where: { model_id: u.id, model_type: 'user' }, include: { role: true } });
    const fullRoles = await Promise.all(userRoles.map(r => prisma.role.findUnique({ where: { id: r.role_id }, include: { role_has_permission: { include: { permission: true } } } })));
    
    const permissions = new Set();
    fullRoles.forEach(fr => {
      if (fr && fr.role_has_permission) {
        fr.role_has_permission.forEach(rp => permissions.add(rp.permission.name));
      }
    });
    console.log(`User: ${u.email} | Roles: ${userRoles.map(r=>r.role.name)} | Has admin.users.view: ${permissions.has('admin.users.view')}`);
  }
}
main();
