import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedRole(db: PrismaClient) {
  console.log('Seeding Enterprise RBAC Hierarchy...')

  const perms = [
    // ── Project module ──────────────────────────────────────────────────────
    'project.view', 'project.create', 'project.edit', 'project.lock',
    'project.file.workspace.view',    // view & download files on project entities
    'project.file.workspace.upload',  // upload / link / tag files on project entities

    // ── Land Acquisition module ─────────────────────────────────────────────
    'acquisition.view', 'acquisition.create', 'acquisition.edit', 'acquisition.approve',
    'acquisition.file.workspace.view',
    'acquisition.file.workspace.upload',

    // ── Proposal module ─────────────────────────────────────────────────────
    'proposal.view', 'proposal.create', 'proposal.approve',
    'proposal.file.workspace.view',
    'proposal.file.workspace.upload',

    // ── Payroll / Compensation module ───────────────────────────────────────
    'payroll.view', 'payroll.create', 'payroll.approve',
    'payroll.file.workspace.view',
    'payroll.file.workspace.upload',

    // ── Global File Manager module ──────────────────────────────────────────
    'file.workspace.view',    // global view & download files on any entity
    'file.workspace.upload',  // global upload / link / tag files on any entity

    // ── Admin module ────────────────────────────────────────────────────────
    'admin.users.view', 'admin.users.manage',
    'admin.roles.view', 'admin.roles.manage',
    'admin.permissions.view', 'admin.permissions.manage',
  ]

  for (const name of perms) {
    await db.permission.upsert({
      where: { name_guard_name: { name, guard_name: 'web' } },
      update: { updt_ts: new Date() },
      create: { id: randomUUID(), name, guard_name: 'web', updt_ts: new Date() }
    })
  }

  const roleDefinitions: Record<string, string[]> = {
    'Super Administrator': perms,
    'Director': perms,
    'GM Planning': perms,

    'Area Officer': [
      'project.view', 'project.edit', 'project.lock',
      'project.file.workspace.view', 'project.file.workspace.upload',
      'acquisition.view', 'acquisition.create', 'acquisition.edit',
      'acquisition.file.workspace.view', 'acquisition.file.workspace.upload',
      'proposal.view', 'proposal.create',
      'proposal.file.workspace.view', 'proposal.file.workspace.upload',
      'payroll.view', 'payroll.create',
      'payroll.file.workspace.view', 'payroll.file.workspace.upload',
      'file.workspace.view', 'file.workspace.upload', // Global
    ],

    'Unit Officer': [
      'project.view', 'project.create', 'project.edit', 'project.lock',
      'project.file.workspace.view', 'project.file.workspace.upload',
      'acquisition.view', 'acquisition.create', 'acquisition.edit',
      'acquisition.file.workspace.view', 'acquisition.file.workspace.upload',
      'proposal.view', 'proposal.create',
      'proposal.file.workspace.view', 'proposal.file.workspace.upload',
      'payroll.view', 'payroll.create',
      'payroll.file.workspace.view', 'payroll.file.workspace.upload',
      'file.workspace.view', 'file.workspace.upload', // Global
    ],

    // Deo: view-only across all modules, view-only file workspace
    'Deo': [
      'project.view',      'project.file.workspace.view',
      'acquisition.view',  'acquisition.file.workspace.view',
      'proposal.view',     'proposal.file.workspace.view',
      'payroll.view',      'payroll.file.workspace.view',
      'file.workspace.view', // Global view
    ],
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
    'cmd@coalrr.gov.in':         'Director',
    'gm.planning@coalrr.gov.in': 'GM Planning',
    'area@coalrr.gov.in':        'Area Officer',
    'unit@coalrr.gov.in':        'Unit Officer'
  }

  const users = await db.user.findMany()
  for (const user of users) {
    const assignedRoleName = userMappings[user.email as keyof typeof userMappings] || 'Super Administrator'
    const assignedRoleId   = roleIds[assignedRoleName]

    if (assignedRoleId) {
      await db.model_has_role.upsert({
        where: { role_id_model_type_model_id: { model_id: user.id.toString(), model_type: 'user', role_id: assignedRoleId } },
        update: { updt_ts: new Date() },
        create: { model_id: user.id.toString(), model_type: 'user', role_id: assignedRoleId, updt_ts: new Date() }
      })
    }
  }

  console.log('✅ Enterprise RBAC Seeded Successfully!')
}
