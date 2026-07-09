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
      where: { name_guardName: { name: p, guardName: 'web' } },
      update: {},
      create: { name: p, guardName: 'web' }
    });
  }

  const superAdminRole = await prisma.role.upsert({
    where: { name_guardName: { name: 'Super Administrator', guardName: 'web' } },
    update: {},
    create: { name: 'Super Administrator', guardName: 'web' }
  });

  // For the demo, let's just make the existing users Super Administrators
  // so they have all permissions
  const users = await prisma.user.findMany();
  for (const u of users) {
    // If they have ecl portal, make them super admin for demo purposes
    if (u.portal === 'ecl') {
      await prisma.modelHasRole.upsert({
        where: { roleId_modelType_modelId: { roleId: superAdminRole.id, modelId: u.id, modelType: 'User' } },
        update: {},
        create: { roleId: superAdminRole.id, modelId: u.id, modelType: 'User' }
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
