const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const permissions = [
    'dashboard.view',
    'project.view',
    'acquisition.view',
    'claim.view',
    'payroll.view',
    'census.view',
    'rnr.view',
    'ledger.view',
    'nomination.view',
    'employment.view',
    'workflow.view'
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name_guard_name: { name: p, guard_name: 'web' } },
      update: {},
      create: { name: p, guard_name: 'web' }
    });
  }

  const superAdminRole = await prisma.role.upsert({
    where: { name_guard_name: { name: 'Super Administrator', guard_name: 'web' } },
    update: {},
    create: { name: 'Super Administrator', guard_name: 'web' }
  });

  // For the demo, let's just make the existing users Super Administrators
  // so they have all permissions
  const users = await prisma.user.findMany();
  for (const u of users) {
    // If they have ecl portal, make them super admin for demo purposes
    if (u.portal === 'ecl') {
      await prisma.model_has_role.upsert({
        where: { role_id_model_type_model_id: { role_id: superAdminRole.id, model_id: u.id, model_type: 'user' } },
        update: {},
        create: { role_id: superAdminRole.id, model_id: u.id, model_type: 'user' }
      });
    }
  }

  console.log('RBAC Seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
