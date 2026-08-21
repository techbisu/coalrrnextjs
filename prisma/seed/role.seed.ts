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
    'proposal.view', 'proposal.create', 'proposal.edit', 'proposal.approve',
    'proposal.file.workspace.view',
    'proposal.file.workspace.upload',

    // ── Payroll / Compensation module ───────────────────────────────────────
    'payroll.view', 'payroll.create', 'payroll.approve',
    'payroll.file.workspace.view',
    'payroll.file.workspace.upload',

    // ── Global File Manager module ──────────────────────────────────────────
    'file.workspace.view',    // global view & download files on any entity
    'file.workspace.upload',  // global upload / link / tag files on any entity

    // ── Document Signature Permissions (Form-VII, Form-XVI, Form-XXII) ─────
    'form_xvi.sign.surveyor',
    'form_xvi.sign.manager',
    'form_xvi.sign.agent',

    'form_vii.sign.purchasing_land_clerk',
    'form_vii.sign.purchasing_survey_officer',
    'form_vii.sign.purchasing_project_manager',
    'form_vii.sign.purchasing_project_agent',
    'form_vii.sign.purchasing_area_land_officer',
    'form_vii.sign.purchasing_area_gm',

    'form_vii.sign.adjacent_land_clerk',
    'form_vii.sign.adjacent_survey_officer',
    'form_vii.sign.adjacent_project_manager',
    'form_vii.sign.adjacent_project_agent',
    'form_vii.sign.adjacent_area_land_officer',
    'form_vii.sign.adjacent_area_gm',

    'form_xxii.sign.area_land_cell_member',
    'form_xxii.sign.area_land_officer',
    'form_xxii.sign.area_gm',

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

  // 1. Core operational permissions bundles
  const baseViewPerms = [
    'project.view', 'project.file.workspace.view',
    'acquisition.view', 'acquisition.file.workspace.view',
    'proposal.view', 'proposal.file.workspace.view',
    'payroll.view', 'payroll.file.workspace.view',
    'file.workspace.view',
  ]

  const unitOperatorPerms = [
    'project.view', 'project.create', 'project.edit',
    'project.file.workspace.view', 'project.file.workspace.upload',
    'acquisition.view', 'acquisition.create', 'acquisition.edit',
    'acquisition.file.workspace.view', 'acquisition.file.workspace.upload',
    'proposal.view', 'proposal.create', 'proposal.edit',
    'proposal.file.workspace.view', 'proposal.file.workspace.upload',
    'payroll.view', 'payroll.create',
    'payroll.file.workspace.view', 'payroll.file.workspace.upload',
    'file.workspace.view', 'file.workspace.upload',
  ]

  const areaReviewerPerms = [
    'project.view', 'project.edit', 'project.lock',
    'project.file.workspace.view', 'project.file.workspace.upload',
    'acquisition.view', 'acquisition.edit', 'acquisition.approve',
    'acquisition.file.workspace.view', 'acquisition.file.workspace.upload',
    'proposal.view', 'proposal.edit', 'proposal.approve',
    'proposal.file.workspace.view', 'proposal.file.workspace.upload',
    'payroll.view', 'payroll.approve',
    'payroll.file.workspace.view', 'payroll.file.workspace.upload',
    'file.workspace.view', 'file.workspace.upload',
  ]

  const hqApproverPerms = [
    'project.view', 'project.edit', 'project.lock',
    'project.file.workspace.view', 'project.file.workspace.upload',
    'acquisition.view', 'acquisition.edit', 'acquisition.approve',
    'acquisition.file.workspace.view', 'acquisition.file.workspace.upload',
    'proposal.view', 'proposal.edit', 'proposal.approve',
    'proposal.file.workspace.view', 'proposal.file.workspace.upload',
    'payroll.view', 'payroll.create', 'payroll.approve',
    'payroll.file.workspace.view', 'payroll.file.workspace.upload',
    'file.workspace.view', 'file.workspace.upload',
  ]

  // 2. Role Definitions mapped directly to specifications
  const roleDefinitions: Record<string, { displayName: string; description: string; permissions: string[] }> = {
    // ── 4 Unique Unit Roles ─────────────────────────────────────────────────
    'Land Clerk': {
      displayName: 'Land Clerk / Revenue Inspector',
      description: 'Prepares & reconciles land records, tenancy certificates, and Form-VII land schedules',
      permissions: [
        ...unitOperatorPerms,
        'form_vii.sign.purchasing_land_clerk',
        'form_vii.sign.adjacent_land_clerk',
      ],
    },
    'Surveyor': {
      displayName: 'Unit Surveyor',
      description: 'Carries out physical land demarcation, boundary checks, Form-XVI & Form-VII survey certifications',
      permissions: [
        ...unitOperatorPerms,
        'form_xvi.sign.surveyor',
        'form_vii.sign.purchasing_survey_officer',
        'form_vii.sign.adjacent_survey_officer',
      ],
    },
    'Colliery Manager': {
      displayName: 'Colliery / Project Manager',
      description: 'Certifies five-point compliance on Form-XVI and Colliery Manager reconciliation on Form-VII',
      permissions: [
        ...unitOperatorPerms,
        'acquisition.approve', 'proposal.approve',
        'form_xvi.sign.manager',
        'form_vii.sign.purchasing_project_manager',
        'form_vii.sign.adjacent_project_manager',
      ],
    },
    'Project Agent': {
      displayName: 'Project / Colliery Agent',
      description: 'Unit-level executive authority; endorses Form-XVI and Form-VII for transmission to Area',
      permissions: [
        ...unitOperatorPerms,
        'acquisition.approve', 'proposal.approve',
        'form_xvi.sign.agent',
        'form_vii.sign.purchasing_project_agent',
        'form_vii.sign.adjacent_project_agent',
      ],
    },

    // ── 3 Unique Area Roles ─────────────────────────────────────────────────
    'Area Land Officer': {
      displayName: 'Area Land Dealing Officer (ALDO)',
      description: 'Area land officer; conducts 13-year search vetting, Form-VII review, and Form-XXII title clearance',
      permissions: [
        ...areaReviewerPerms,
        'form_vii.sign.purchasing_area_land_officer',
        'form_vii.sign.adjacent_area_land_officer',
        'form_xxii.sign.area_land_officer',
      ],
    },
    'Area Land Cell Member': {
      displayName: 'Area Land Cell Committee Member',
      description: 'Multi-disciplinary committee member for statutory, legal, and valuation clearance on Form-XXII',
      permissions: [
        ...baseViewPerms,
        'acquisition.approve', 'proposal.approve',
        'form_xxii.sign.area_land_cell_member',
      ],
    },
    'Area General Manager': {
      displayName: 'Area General Manager (AGM)',
      description: 'Head of Area Office; approves Form-VII cross-colliery reconciliation and Form-XXII area vetting',
      permissions: [
        ...areaReviewerPerms,
        'form_vii.sign.purchasing_area_gm',
        'form_vii.sign.adjacent_area_gm',
        'form_xxii.sign.area_gm',
      ],
    },

    // ── 5 Unique HQ Roles ───────────────────────────────────────────────────
    'Land Officer LRE': {
      displayName: 'Land Officer (L&RE HQ)',
      description: 'HQ Land & Revenue executive; reviews acquisition proposals, compensation files, and gazette drafts',
      permissions: hqApproverPerms,
    },
    'GM LRE': {
      displayName: 'General Manager (Land & Revenue HQ)',
      description: 'HQ head of Land & Revenue Estate; sanctions land proposals, Form-XXII vetting, and compensation awards',
      permissions: hqApproverPerms,
    },
    'GM Planning': {
      displayName: 'General Manager (Planning HQ)',
      description: 'HQ head of Project Planning; evaluates Conceptual Reports, PR Schemes, baseline limits, and GIS bounds',
      permissions: hqApproverPerms,
    },
    'GM Finance': {
      displayName: 'General Manager (Finance HQ)',
      description: 'HQ head of Finance; sanctions financial concurrence, acquisition budgets, and disbursement funds',
      permissions: [
        ...baseViewPerms,
        'payroll.create', 'payroll.approve',
        'acquisition.approve', 'proposal.approve',
        'file.workspace.upload',
      ],
    },
    'GM Safety': {
      displayName: 'General Manager (Safety HQ)',
      description: 'HQ head of Safety & Mine Conservation; provides mine boundary safety clearance and DGMS compliance',
      permissions: baseViewPerms,
    },

    // ── Apex & System Roles ─────────────────────────────────────────────────
    'Director': {
      displayName: 'Director / CMD',
      description: 'Apex corporate authority; approves Board Deviations, Section 11 final sanctions, and high-value awards',
      permissions: perms,
    },
    'Super Administrator': {
      displayName: 'System Super Administrator',
      description: 'Full administrative control over all modules, workflows, configurations, and user assignments',
      permissions: perms,
    },
    'Deo': {
      displayName: 'Data Entry Operator (DEO)',
      description: 'View-only data operator across modules',
      permissions: baseViewPerms,
    },

    // ── Backward Compatible Aliases ─────────────────────────────────────────
    'Unit Officer': {
      displayName: 'Unit Officer (Surveyor / Nodal)',
      description: 'Legacy composite unit officer role with surveying, clerk, and submission capabilities',
      permissions: [
        ...unitOperatorPerms,
        'form_xvi.sign.surveyor',
        'form_vii.sign.purchasing_land_clerk',
        'form_vii.sign.purchasing_survey_officer',
      ],
    },
    'Area Officer': {
      displayName: 'Area Officer (ALDO / Reviewer)',
      description: 'Legacy composite area officer role with area land vetting and recommendation permissions',
      permissions: [
        ...areaReviewerPerms,
        'form_vii.sign.purchasing_area_land_officer',
        'form_xxii.sign.area_land_officer',
      ],
    },
  }

  const roleIds: Record<string, string> = {}
  for (const [roleName, roleDef] of Object.entries(roleDefinitions)) {
    const role = await db.role.upsert({
      where: { name_guard_name: { name: roleName, guard_name: 'web' } },
      update: {
        display_name: roleDef.displayName,
        description: roleDef.description,
        updt_ts: new Date(),
      },
      create: {
        id: randomUUID(),
        name: roleName,
        display_name: roleDef.displayName,
        description: roleDef.description,
        guard_name: 'web',
        updt_ts: new Date(),
      },
    })
    roleIds[roleName] = role.id

    for (const pName of roleDef.permissions) {
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

  // Also normalize legacy gm_lre row if it exists
  const legacyGmLre = await db.role.findFirst({ where: { name: 'gm_lre' } })
  if (legacyGmLre && roleIds['GM LRE']) {
    await db.role.update({
      where: { id: legacyGmLre.id },
      data: { display_name: 'General Manager (Land & Revenue HQ)', description: 'GM HQ Officer' }
    }).catch(() => null)
  }

  await db.model_has_role.deleteMany({})

  const userMappings: Record<string, string> = {
    'cmd@coalrr.gov.in':         'Director',
    'gm.planning@coalrr.gov.in': 'GM Planning',
    'gm.lre@coalrr.gov.in':      'GM LRE',
    'gm.finance@coalrr.gov.in':  'GM Finance',
    'gm.safety@coalrr.gov.in':   'GM Safety',
    'landofficer.lre@coalrr.gov.in': 'Land Officer LRE',
    'area@coalrr.gov.in':        'Area Land Officer',
    'areagm@coalrr.gov.in':      'Area General Manager',
    'landcell@coalrr.gov.in':    'Area Land Cell Member',
    'unit@coalrr.gov.in':        'Surveyor',
    'landclerk@coalrr.gov.in':   'Land Clerk',
    'manager@coalrr.gov.in':     'Colliery Manager',
    'agent@coalrr.gov.in':       'Project Agent',
    'superadmin@coalrr.in':      'Super Administrator',
  }

  const users = await db.user.findMany()
  for (const user of users) {
    if (!user.email) continue
    const assignedRoleName = userMappings[user.email] || 'Super Administrator'
    const assignedRoleId = roleIds[assignedRoleName]

    if (assignedRoleId) {
      await db.model_has_role.upsert({
        where: { role_id_model_type_model_id: { model_id: user.id.toString(), model_type: 'user', role_id: assignedRoleId } },
        update: { updt_ts: new Date() },
        create: { model_id: user.id.toString(), model_type: 'user', role_id: assignedRoleId, updt_ts: new Date() }
      })
    }
  }

  console.log('✅ Enterprise RBAC Seeded Successfully with all Unit, Area & HQ Roles!')
}
