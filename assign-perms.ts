import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function run() {
  const perm = await db.permission.upsert({
    where: { name: 'project.create' },
    update: {},
    create: {
      name: 'project.create',
      module: 'project',
      group: 'M1: Project Master'
    }
  });

  const roles = await db.role.findMany();
  for (const role of roles) {
    const exists = await db.role_has_permission.findFirst({
      where: { role_id: role.id, permission_id: perm.id }
    });
    if (!exists) {
      // Provide updt_ts explicitly since it fails without it sometimes
      await db.role_has_permission.create({
        data: {
          role_id: role.id,
          permission_id: perm.id,
          updt_ts: Math.floor(Date.now() / 1000)
        }
      });
    }
  }
  console.log('project.create permission ensured and assigned to all roles');
}
run().finally(() => db.$disconnect());
