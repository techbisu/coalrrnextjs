import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

export async function seedRbac() {
  console.log('Seeding Enterprise RBAC Hierarchy...')

  const perms = [
    'project.view', 'project.create', 'project.edit', 'project.lock',
    'acquisition.view', 'acquisition.create', 'acquisition.edit', 'acquisition.approve',
    'proposal.view', 'proposal.create', 'proposal.approve',
    'payroll.view', 'payroll.create', 'payroll.approve',
  ]

  for (const name of perms) {
    await db.permission.upsert({
      where: { name_guard_name: { name, guard_name: 'web' } },
      update: {},
      create: { name, guard_name: 'web' }
    })
  }

  const roleDefinitions = {
    'Super Administrator': perms,
    'Director': perms,
    'GM Planning': perms,
    'Area Officer': [
      'project.view', 
      'acquisition.view', 'acquisition.create', 'acquisition.edit',
      'proposal.view', 'proposal.create', 
      'payroll.view', 'payroll.create'
    ],
    'Unit Officer': [
      'project.view', 'project.create',
      'acquisition.view', 'acquisition.create', 'acquisition.edit',
      'proposal.view', 'proposal.create', 
      'payroll.view', 'payroll.create'
    ],
    'Deo': [
      'project.view', 'acquisition.view', 'proposal.view', 'payroll.view'
    ]
  }

  const roleIds: Record<string, bigint> = {}
  for (const [roleName, rolePerms] of Object.entries(roleDefinitions)) {
    const role = await db.role.upsert({
      where: { name_guard_name: { name: roleName, guard_name: 'web' } },
      update: {},
      create: { name: roleName, guard_name: 'web' }
    })
    roleIds[roleName] = role.id

    for (const pName of rolePerms) {
      const p = await db.permission.findUnique({ where: { name_guard_name: { name: pName, guard_name: 'web' } } })
      if (p) {
        await db.role_has_permission.upsert({
          where: { role_id_permission_id: { role_id: role.id, permission_id: p.id } },
          update: {},
          create: { role_id: role.id, permission_id: p.id }
        })
      }
    }
  }

  await db.model_has_role.deleteMany({})

  const userMappings = {
    'cmd@coalrr.gov.in': 'Director',
    'gm.planning@coalrr.gov.in': 'GM Planning',
    'area@coalrr.gov.in': 'Area Officer',
    'unit@coalrr.gov.in': 'Unit Officer'
  }

  const users = await db.user.findMany()
  for (const user of users) {
    const assignedRoleName = userMappings[user.email as keyof typeof userMappings] || 'Super Administrator'
    const assignedRoleId = roleIds[assignedRoleName]

    if (assignedRoleId) {
      await db.model_has_role.upsert({
        where: { role_id_model_type_model_id: { model_id: user.id, model_type: 'user', role_id: assignedRoleId } },
        update: {},
        create: { model_id: user.id, model_type: 'user', role_id: assignedRoleId }
      })
      
      await db.user.update({
        where: { id: user.id },
        data: { role: assignedRoleName }
      })
    }
  }

  console.log('✅ Enterprise RBAC Seeded Successfully!')
}

if (require.main === module || process.argv[1].includes('seed-rbac')) {
  seedRbac().catch(e => {
    console.error(e)
    process.exit(1)
  }).finally(async () => {
    await db.$disconnect()
  })
}
