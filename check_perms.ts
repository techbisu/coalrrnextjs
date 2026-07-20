const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const adminRole = await prisma.role.findFirst({
    where: { name: 'Super Administrator' },
    include: { role_has_permission: { include: { permission: true } } }
  });
  console.log("Super Admin Permissions:");
  adminRole.role_has_permission.forEach(rp => console.log(rp.permission.name));
}
main();
