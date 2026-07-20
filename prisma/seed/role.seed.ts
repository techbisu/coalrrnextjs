import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedRole(db: PrismaClient) {
  console.log('Seeding Enterprise RBAC Hierarchy...')

  const perms = [
    'project.view', 'project.create', 'project.edit', 'project.lock',
    'acquisition.view', 'acquisition.create', 'acquisition.edit', 'acquisition.approve',
    'proposal.view', 'proposal.create', 'proposal.approve',
    'payroll.view', 'payroll.create', 'payroll.approve',
    'admin.users.view', 'admin.users.manage',
    'admin.roles.view', 'admin.roles.manage',
    'admin.permissions.view', 'admin.permissions.manage'
  ]

  for (const name of perms) {
    await db.permission.upsert({
      where: { name_guard_name: { name, guard_name: 'web' } },
      update: { updt_ts: new Date() },
      create: { id: randomUUID(), name, guard_name: 'web', updt_ts: new Date() }
    })
  }

  const roleDefinitions = {
    'Super Administrator': perms,
    'Director': perms,
    'GM Planning': perms,
    'Area Officer': [
      'project.view', 'project.edit', 'project.lock',
      'acquisition.view', 'acquisition.create', 'acquisition.edit',
      'proposal.view', 'proposal.create', 
      'payroll.view', 'payroll.create'
    ],
    'Unit Officer': [
      'project.view', 'project.create', 'project.edit', 'project.lock',
      'acquisition.view', 'acquisition.create', 'acquisition.edit',
      'proposal.view', 'proposal.create', 
      'payroll.view', 'payroll.create'
    ],
    'Deo': [
      'project.view', 'acquisition.view', 'proposal.view', 'payroll.view'
    ]
  }

  const roleIds: Record<string, string> = {}
  for (const [roleName, rolePerms] of Object.entries(roleDefinitions)) {
    const role = await db.role.upsert({
      where: { name_guard_name: { name: roleName, guard_name: 'web' } },
      update: { updt_ts: new Date() },
      create: { id: randomUUID(), name: roleName, guard_name: 'web', updt_ts: new Date() }
    })
    roleIds[roleName] = role.id

    for (const pName of rolePerms) {
      const p = await db.permission.findUnique({ where: { name_guard_name: { name: pName, guard_name: 'web' } } })
      if (p) {
        await db.role_has_permission.upsert({
          where: { role_id_permission_id: { role_id: role.id, permission_id: p.id } },
          update: { updt_ts: new Date() },
          create: { role_id: role.id, permission_id: p.id, updt_ts: new Date() }
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
        update: { updt_ts: new Date() },
        create: { model_id: user.id, model_type: 'user', role_id: assignedRoleId, updt_ts: new Date() }
      })
      
      await db.user.update({
        where: { id: user.id },
        data: { role: assignedRoleName }
      })
    }
  }

  console.log('✅ Enterprise RBAC Seeded Successfully!')
}
