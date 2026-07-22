import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

const ROLES = [
  'Super Administrator',
  'Unit Office',
  'Area Office',
  'GM (Planning)',
  'GM (Finance)',
  'GM (Safety)',
  'Director',
  'CMD',
  'Board of Directors',
  'Citizen',
]

const PERMISSIONS = [
  { name: 'dashboard.view', module: 'dashboard', group: 'Dashboard' },
  
  { name: 'project.view', module: 'project', group: 'M1: Project Master' },
  { name: 'project.create', module: 'project', group: 'M1: Project Master' },
  { name: 'project.edit', module: 'project', group: 'M1: Project Master' },
  { name: 'project.delete', module: 'project', group: 'M1: Project Master' },
  { name: 'project.lock', module: 'project', group: 'M1: Project Master' },
  
  { name: 'proposal.view', module: 'proposal', group: 'M2: Land Acquisition' },
  { name: 'proposal.create', module: 'proposal', group: 'M2: Land Acquisition' },
  { name: 'proposal.edit', module: 'proposal', group: 'M2: Land Acquisition' },
  { name: 'proposal.delete', module: 'proposal', group: 'M2: Land Acquisition' },
  { name: 'proposal.approve', module: 'proposal', group: 'M2: Land Acquisition' },
  { name: 'proposal.reject', module: 'proposal', group: 'M2: Land Acquisition' },
  { name: 'proposal.return', module: 'proposal', group: 'M2: Land Acquisition' },
  
  { name: 'claim.view', module: 'claim', group: 'M3: Form-I Claims' },
  { name: 'claim.create', module: 'claim', group: 'M3: Form-I Claims' },
  { name: 'claim.edit', module: 'claim', group: 'M3: Form-I Claims' },
  { name: 'claim.verify', module: 'claim', group: 'M3: Form-I Claims' },
  
  { name: 'payroll.view', module: 'payroll', group: 'M4: Compensation Payroll' },
  { name: 'payroll.create', module: 'payroll', group: 'M4: Compensation Payroll' },
  { name: 'payroll.edit', module: 'payroll', group: 'M4: Compensation Payroll' },
  { name: 'payroll.approve', module: 'payroll', group: 'M4: Compensation Payroll' },
  { name: 'payroll.reject', module: 'payroll', group: 'M4: Compensation Payroll' },
  
  { name: 'paf.view', module: 'paf', group: 'M6: PAF Census' },
  { name: 'paf.create', module: 'paf', group: 'M6: PAF Census' },
  { name: 'paf.edit', module: 'paf', group: 'M6: PAF Census' },
  { name: 'paf.delete', module: 'paf', group: 'M6: PAF Census' },
  { name: 'paf.census', module: 'paf', group: 'M6: PAF Census' },
  
  { name: 'rnr.view', module: 'rnr', group: 'M7: R&R Assets' },
  { name: 'rnr.create', module: 'rnr', group: 'M7: R&R Assets' },
  { name: 'rnr.edit', module: 'rnr', group: 'M7: R&R Assets' },
  { name: 'rnr.approve', module: 'rnr', group: 'M7: R&R Assets' },
  { name: 'rnr.reject', module: 'rnr', group: 'M7: R&R Assets' },
  
  { name: 'payment.view', module: 'payment', group: 'M8: Payment Ledger' },
  { name: 'payment.create', module: 'payment', group: 'M8: Payment Ledger' },
  { name: 'payment.seal', module: 'payment', group: 'M8: Payment Ledger' },
  
  { name: 'nomination.view', module: 'nomination', group: 'M9: Nominee Package' },
  { name: 'nomination.create', module: 'nomination', group: 'M9: Nominee Package' },
  { name: 'nomination.track', module: 'nomination', group: 'M9: Nominee Package' },
  
  { name: 'employment.view', module: 'employment', group: 'M10: Employment' },
  { name: 'employment.apply', module: 'employment', group: 'M10: Employment' },
  { name: 'employment.approve', module: 'employment', group: 'M10: Employment' },
  { name: 'employment.reject', module: 'employment', group: 'M10: Employment' },
  
  { name: 'workflow.view', module: 'workflow', group: 'Cross-Module Workflow' },
  { name: 'workflow.approve', module: 'workflow', group: 'Cross-Module Workflow' },
  { name: 'workflow.reject', module: 'workflow', group: 'Cross-Module Workflow' },
  { name: 'workflow.return', module: 'workflow', group: 'Cross-Module Workflow' },
  
  { name: 'document.view', module: 'document', group: 'document Engine' },
  { name: 'document.generate', module: 'document', group: 'document Engine' },
  { name: 'document.preview', module: 'document', group: 'document Engine' },
  { name: 'document.download', module: 'document', group: 'document Engine' },
  { name: 'document.sign', module: 'document', group: 'document Engine' },
  
  { name: 'file.upload', module: 'file', group: 'File Management' },
  { name: 'file.download', module: 'file', group: 'File Management' },
  { name: 'file.delete', module: 'file', group: 'File Management' },
  { name: 'file.share', module: 'file', group: 'File Management' },
  
  { name: 'user.view', module: 'user', group: 'Administration' },
  { name: 'user.create', module: 'user', group: 'Administration' },
  { name: 'user.edit', module: 'user', group: 'Administration' },
  { name: 'user.delete', module: 'user', group: 'Administration' },
  
  { name: 'role.view', module: 'role', group: 'Administration' },
  { name: 'role.create', module: 'role', group: 'Administration' },
  { name: 'role.edit', module: 'role', group: 'Administration' },
  { name: 'role.delete', module: 'role', group: 'Administration' },
  { name: 'role.assign', module: 'role', group: 'Administration' },
  
  { name: 'permission.view', module: 'permission', group: 'Administration' },
  { name: 'permission.manage', module: 'permission', group: 'Administration' },
  
  { name: 'settings.view', module: 'settings', group: 'Administration' },
  { name: 'settings.update', module: 'settings', group: 'Administration' },
  
  { name: 'audit.view', module: 'audit', group: 'Audit & Security' },
  { name: 'audit.export', module: 'audit', group: 'Audit & Security' },
  
  { name: 'notification.view', module: 'notification', group: 'Notifications' },
  { name: 'notification.manage', module: 'notification', group: 'Notifications' },
  
  { name: 'report.view', module: 'report', group: 'Reports' },
  { name: 'report.export', module: 'report', group: 'Reports' },
]

export async function runAuthSeed() {
  console.log('Seeding roles and permissions...')

  // 1. Create Roles
  for (const name of ROLES) {
    await db.role.upsert({
      where: { name_guard_name: { name, guard_name: 'web' } },
      update: { updt_ts: new Date() },
      create: { id: randomUUID(), name, is_system: true, updt_ts: new Date() },
    })
  }

  // 2. Create Permissions
  const createdPermissions: any[] = []
  for (const p of PERMISSIONS) {
    const perm = await db.permission.upsert({
      where: { name_guard_name: { name: p.name, guard_name: 'web' } },
      update: { module: p.module, group: p.group, updt_ts: new Date() },
      create: { id: randomUUID(), name: p.name, module: p.module, group: p.group, updt_ts: new Date() },
    })
    createdPermissions.push(perm)
  }

  // 2.5 Assign all permissions to all ECL internal roles for now
  // (In a real system, you'd matrix these properly, but for development we give access to internal staff)
  const eclRoles = await db.role.findMany({
    where: { name: { not: 'Citizen' } }
  })

  for (const role of eclRoles) {
    for (const perm of createdPermissions) {
      // Don't give public portal permissions to internal staff? Actually it's fine.
      await db.role_has_permission.upsert({
        where: { role_id_permission_id: { permission_id: perm.id, role_id: role.id } },
        update: { updt_ts: new Date() },
        create: { permission_id: perm.id, role_id: role.id, updt_ts: new Date() }
      })
    }
  }

  // 3. Migrate Existing Users
  // The system uses a 'role' string on user table. Map that to the new role table.
  const users = await db.user.findMany()
  const rolesMap = await db.role.findMany().then(rs => new Map(rs.map(r => [r.name.toLowerCase().replace(/[^a-z0-9]/g, ''), r.id])))
  
  let mappedCount = 0
  for (const user of users) {
    // Current roles are e.g., 'area_office'. We need to map to 'Area Office' ID.
    let mappedName = user.role
    if (user.role === 'unit_office') mappedName = 'Unit Office'
    if (user.role === 'area_office') mappedName = 'Area Office'
    if (user.role === 'gm_planning') mappedName = 'GM (Planning)'
    if (user.role === 'gm_finance') mappedName = 'GM (Finance)'
    if (user.role === 'gm_safety') mappedName = 'GM (Safety)'
    if (user.role === 'director') mappedName = 'Director'
    if (user.role === 'cmd') mappedName = 'CMD'
    if (user.role === 'board') mappedName = 'Board of Directors'
    if (user.role === 'citizen') mappedName = 'Citizen'

    const searchKey = mappedName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const role_id = rolesMap.get(searchKey)

    if (role_id) {
      await db.model_has_role.upsert({
        where: { role_id_model_type_model_id: { role_id, model_type: 'user', model_id: user.id.toString() } },
        update: { updt_ts: new Date() },
        create: { role_id, model_type: 'user', model_id: user.id.toString(), updt_ts: new Date() },
      })
      mappedCount++
    }
  }

  console.log(`Seeded ${ROLES.length} roles and ${PERMISSIONS.length} permissions.`)
  console.log(`Migrated ${mappedCount} existing users to the new RBAC structure.`)
}

// Allow direct execution
if (require.main === module) {
  runAuthSeed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
