import type { PrismaClient } from '@prisma/client'

export async function seedTranslations(db: PrismaClient) {
  console.log('Seeding translation modules, keys, and values...')

  // Ensure English language exists
  let enLang = await db.language.findUnique({ where: { code: 'en' } })
  if (!enLang) {
    enLang = await db.language.create({
      data: { code: 'en', name: 'English', native_name: 'English', is_default: true }
    })
  }
  
  let hiLang = await db.language.findUnique({ where: { code: 'hi' } })
  if (!hiLang) {
    hiLang = await db.language.create({
      data: { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', is_default: false }
    })
  }

  // Ensure 'common' module exists
  const commonModule = await db.translation_module.upsert({
    where: { name: 'common' },
    update: {},
    create: { name: 'common', description: 'Common shared translations' },
  })

  // Common UI keys (from seed-common.ts and seed_translations.js)
  const commonKeys = [
    { key: 'nav.dashboard.label', en: 'Dashboard' },
    { key: 'nav.dashboard.desc', en: 'Cross-module KPIs, SLA countdowns, and pending approvals' },
    { key: 'nav.project-master.label', en: 'Project Master & GIS' },
    { key: 'nav.project-master.desc', en: 'Locked baseline, statutory clearances, GIS boundary' },
    { key: 'nav.acquisition.label', en: 'Land Acquisition' },
    { key: 'nav.acquisition.desc', en: 'Plot acquisition proposals, CL-1 checklists, area/HQ vetting' },
    { key: 'nav.form-i-wizard.label', en: 'Form-I Claim Wizard' },
    { key: 'nav.form-i-wizard.desc', en: 'Public portal multi-step claim submission (21-day timer)' },
    { key: 'nav.payroll-builder.label', en: 'Compensation Payroll' },
    { key: 'nav.payroll-builder.desc', en: 'Live Math Engine preview, batch award calculation' },
    { key: 'nav.paf-census.label', en: 'PAF Census Register' },
    { key: 'nav.paf-census.desc', en: 'Project Affected Families census, photo ID cards, satellite freeze' },
    { key: 'nav.rnr-asset.label', en: 'R&R Asset Proposal' },
    { key: 'nav.rnr-asset.desc', en: 'Homestead, shifting, cattle shed, subsistence grant payrolls' },
    { key: 'nav.payment-ledger.label', en: 'Form-D Payment Ledger' },
    { key: 'nav.payment-ledger.desc', en: 'Immutable hash-chained payment register' },
    { key: 'nav.nomination.label', en: 'Nominee Package Deal' },
    { key: 'nav.nomination.desc', en: 'Form-A nomination, nominee pooling toward 2.00-acre threshold' },
    { key: 'nav.employment.label', en: 'Employment Verification' },
    { key: 'nav.employment.desc', en: '2.00-acre nominee pooling gate, Form-IX/X quota, CL-4 checklist' },
    { key: 'nav.employment-wizard.label', en: 'Employment Application' },
    { key: 'nav.employment-wizard.desc', en: 'Form-V/VI bio-data wizard, document upload, status tracker' },
    { key: 'nav.workflow-inbox.label', en: 'Workflow Inbox' },
    { key: 'nav.workflow-inbox.desc', en: 'Pending approvals across all modules' },
    { key: 'nav.admin-settings.label', en: 'System Settings' },
    { key: 'nav.admin-settings.desc', en: 'Configure core platform parameters and preferences' },
    { key: 'nav.admin-audit.label', en: 'Audit Logs' },
    { key: 'nav.admin-audit.desc', en: 'Immutable record of system-wide changes' },
    { key: 'nav.admin-users.label', en: 'User Management' },
    { key: 'nav.admin-users.desc', en: 'Manage system users, passwords, and assignments' },
    { key: 'nav.admin-roles.label', en: 'Roles & Profiles' },
    { key: 'nav.admin-roles.desc', en: 'Define access roles and operational profiles' },
    { key: 'nav.admin-permissions.label', en: 'Permissions' },
    { key: 'nav.admin-permissions.desc', en: 'Granular access control policies' },
    { key: 'nav.admin-master.label', en: 'Master Data' },
    { key: 'nav.admin-master.desc', en: 'Manage lookup tables, dictionaries, and constants' },
    { key: 'shell.loading', en: 'Loading COALRR…' },
    { key: 'shell.logout', en: 'Logout' },
    { key: 'shell.menu', en: 'Menu' },
    { key: 'sidebar.workspace', en: 'Workspace' },
  ]

  for (const k of commonKeys) {
    const tKey = await db.translation_key.upsert({
      where: { module_id_key: { module_id: commonModule.id, key: k.key } },
      update: {},
      create: { module_id: commonModule.id, key: k.key },
    })
    await db.translation_value.upsert({
      where: { translation_key_id_language_id: { translation_key_id: tKey.id, language_id: enLang.id } },
      update: { value: k.en, status: 'approved' },
      create: { translation_key_id: tKey.id, language_id: enLang.id, value: k.en, status: 'approved' },
    })
  }

  // SysConfig translation keys (from old translations.seed.ts)
  const configKeys = [
    { key: 'CONFIG_CATEGORY_AUTHENTICATION', en: 'Authentication', hi: 'प्रमाणीकरण' },
    { key: 'CONFIG_CATEGORY_NOTIFICATIONS', en: 'Notifications', hi: 'सूचनाएं' },
    { key: 'CONFIG_CATEGORY_SYSTEM', en: 'System Settings', hi: 'सिस्टम सेटिंग्स' },
    { key: 'CONFIG_TYPE_NUMBER', en: 'Number', hi: 'संख्या' },
    { key: 'CONFIG_TYPE_STRING', en: 'Text', hi: 'पाठ' },
    { key: 'CONFIG_TYPE_BOOLEAN', en: 'Toggle (Yes/No)', hi: 'टॉगल (हां/नहीं)' },
  ]

  for (const k of configKeys) {
    const tKey = await db.translation_key.upsert({
      where: { module_id_key: { module_id: commonModule.id, key: k.key } },
      update: {},
      create: { module_id: commonModule.id, key: k.key },
    })
    await db.translation_value.upsert({
      where: { translation_key_id_language_id: { translation_key_id: tKey.id, language_id: enLang.id } },
      update: { value: k.en, status: 'approved' },
      create: { translation_key_id: tKey.id, language_id: enLang.id, value: k.en, status: 'approved' },
    })
    await db.translation_value.upsert({
      where: { translation_key_id_language_id: { translation_key_id: tKey.id, language_id: hiLang.id } },
      update: { value: k.hi, status: 'approved' },
      create: { translation_key_id: tKey.id, language_id: hiLang.id, value: k.hi, status: 'approved' },
    })
  }

  console.log('✅ Translations seeded successfully!')
}
