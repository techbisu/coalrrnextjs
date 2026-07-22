import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedTranslations(db: PrismaClient) {
  console.log('Seeding translation modules, keys, and values...')

  // Ensure English language exists
  let enLang = await db.language.findUnique({ where: { code: 'en' } })
  if (!enLang) {
    enLang = await db.language.create({
      data: { id: randomUUID(), code: 'en', name: 'English', native_name: 'English', is_default: true }
    })
  }
  
  let hiLang = await db.language.findUnique({ where: { code: 'hi' } })
  if (!hiLang) {
    hiLang = await db.language.create({
      data: { id: randomUUID(), code: 'hi', name: 'Hindi', native_name: 'हिन्दी', is_default: false }
    })
  }

  // Ensure 'common' module exists
  const commonModule = await db.translation_module.upsert({
    where: { name: 'common' },
    update: { updt_ts: new Date() },
    create: { id: randomUUID(), name: 'common', description: 'Common shared translations', updt_ts: new Date() },
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
    { key: 'shell.version', en: 'Version' },
    { key: 'sidebar.workspace', en: 'Workspace' },
    { key: 'common.cancel', en: 'Cancel' },
    { key: 'common.locking', en: 'Locking…' },
    { key: 'common.upload_success', en: 'Uploaded: {name}' },
    { key: 'common.upload_failed', en: 'Failed to upload file' },
    { key: 'common.save_changes', en: 'Save Changes' },
    { key: 'common.loading_approvals', en: 'Loading approvals…' },
    { key: 'common.uploaded', en: 'Uploaded' },
    { key: 'common.view_proposal', en: 'View Proposal →' },
    { key: 'common.edit', en: 'Edit' },
    { key: 'common.cleared', en: 'cleared' },
    { key: 'common.issued_on', en: 'issued' },
  ]

  for (const k of commonKeys) {
    const tKey = await db.translation_key.upsert({
      where: { module_id_key: { module_id: commonModule.id, key: k.key } },
      update: { updt_ts: new Date() },
      create: { id: randomUUID(), module_id: commonModule.id, key: k.key, updt_ts: new Date() },
    })
    await db.translation_value.upsert({
      where: { translation_key_id_language_id: { translation_key_id: tKey.id, language_id: enLang.id } },
      update: { value: k.en, status: 'approved', updt_ts: new Date() },
      create: { id: randomUUID(), translation_key_id: tKey.id, language_id: enLang.id, value: k.en, status: 'approved', updt_ts: new Date() },
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
      update: { updt_ts: new Date() },
      create: { id: randomUUID(), module_id: commonModule.id, key: k.key, updt_ts: new Date() },
    })
    await db.translation_value.upsert({
      where: { translation_key_id_language_id: { translation_key_id: tKey.id, language_id: enLang.id } },
      update: { value: k.en, status: 'approved', updt_ts: new Date() },
      create: { id: randomUUID(), translation_key_id: tKey.id, language_id: enLang.id, value: k.en, status: 'approved', updt_ts: new Date() },
    })
    await db.translation_value.upsert({
      where: { translation_key_id_language_id: { translation_key_id: tKey.id, language_id: hiLang.id } },
      update: { value: k.hi, status: 'approved', updt_ts: new Date() },
      create: { id: randomUUID(), translation_key_id: tKey.id, language_id: hiLang.id, value: k.hi, status: 'approved', updt_ts: new Date() },
    })
  }

  // Project Master translation keys
  const projectMasterModule = await db.translation_module.upsert({
    where: { name: 'project_master' },
    update: { updt_ts: new Date() },
    create: { id: randomUUID(), name: 'project_master', description: 'Project Master Module', updt_ts: new Date() },
  })

  const projectMasterKeys = [
    { key: 'project_master.lock_error', en: 'Failed to lock baseline' },
    { key: 'project_master.lock_success', en: 'Baseline LOCKED for "{name}".' },
    { key: 'project_master.lock_baseline_title', en: 'Lock Baseline' },
    { key: 'project_master.lock_baseline_desc', en: 'This action is irreversible. Once locked, the project baseline (land limit, budget ceiling, employment quota) becomes immutable and downstream modules bind to it.' },
    { key: 'project_master.irreversible_op', en: 'Irreversible operation' },
    { key: 'project_master.lock_confirm_prompt', en: 'You are about to lock the baseline for ' },
    { key: 'project_master.lock_type_confirm', en: 'Type the project name exactly as shown below to confirm.' },
    { key: 'project_master.type_name_to_confirm', en: 'Type the project name to confirm' },
    { key: 'project_master.name_matches', en: 'Name matches — ready to lock.' },
    { key: 'project_master.expected', en: 'Expected:' },
    { key: 'project_master.lock_baseline_btn', en: 'Lock Baseline' },
    { key: 'project_master.form_xxii_title', en: 'Board Deviation Approvals (Form-XXII)' },
    { key: 'project_master.form_xxii_desc', en: 'Proposals that exceeded project limits and received formal Board approval' },
    { key: 'project_master.simulate_form_xxii', en: 'Simulate Form-XXII' },
    { key: 'project_master.area_compliance', en: 'Area Compliance' },
    { key: 'project_master.save_error', en: 'Failed to save project' },
    { key: 'project_master.update_success', en: 'Project updated.' },
    { key: 'project_master.create_success', en: 'Project "{name}" created as draft.' },
    { key: 'project_master.edit_baseline', en: 'Edit Project Baseline' },
    { key: 'project_master.edit_baseline_desc', en: 'Update draft baseline details. Once locked, these fields become immutable.' },
    { key: 'project_master.new_project_desc', en: 'Create a new draft project baseline. The baseline can be edited until it is locked.' },
    { key: 'project_master.fields.name', en: 'Project name' },
    { key: 'project_master.fields.name_ph', en: 'e.g. Bhubaneswari OCP Phase-III' },
    { key: 'project_master.fields.state', en: 'State' },
    { key: 'project_master.fields.state_ph', en: 'Select State...' },
    { key: 'project_master.fields.area', en: 'Area' },
    { key: 'project_master.fields.area_ph', en: 'Select Area...' },
    { key: 'project_master.fields.mine', en: 'Mine / Colliery' },
    { key: 'project_master.fields.mine_ph', en: 'Select Mine...' },
    { key: 'project_master.fields.mouzas', en: 'Mapped Mouzas' },
    { key: 'project_master.fields.mouzas_ph', en: 'Select Mouzas...' },
    { key: 'project_master.fields.land_limit', en: 'Land limit (acres)' },
    { key: 'project_master.fields.employment_quota', en: 'Employment quota' },
    { key: 'project_master.fields.budget_ceiling', en: 'Total budget ceiling (₹)' },
    { key: 'project_master.fields.pr_doc', en: 'Approved PR Document' },
    { key: 'project_master.fields.pr_doc_upload', en: 'Upload document' },
    { key: 'project_master.form_xxii_error', en: 'Failed to load Form-XXII approvals' },
    { key: 'project_master.form_xxii_title', en: 'Board Deviation Approvals (Form-XXII)' },
    { key: 'project_master.form_xxii_desc', en: 'Proposals that exceeded project limits and received formal Board approval' },
    { key: 'project_master.title', en: 'Project Master' },
    { key: 'project_master.no_projects_desc', en: 'No projects yet — create one to get started.' },
    { key: 'project_master.new_project', en: 'New Project' },
    { key: 'project_master.baseline_locked', en: 'Baseline Locked' },
    { key: 'project_master.draft_status', en: 'Draft — not locked' },
    { key: 'project_master.colliery_code', en: 'Colliery code' },
    { key: 'project_master.switch_project', en: 'Switch project:' },
    { key: 'project_master.baseline_not_locked_title', en: 'Baseline not locked' },
    { key: 'project_master.baseline_not_locked_desc', en: 'This project is still in draft. Downstream modules (Form-I claims, compensation payrolls, Form-D ledger) cannot bind to an unlocked baseline. Lock it to enable acquisition workflows.' },
    { key: 'project_master.stats.land_limit', en: 'Land Limit' },
    { key: 'project_master.stats.budget_ceiling', en: 'Budget Ceiling' },
    { key: 'project_master.stats.utilized_pct', en: 'utilized {pct}%' },
    { key: 'project_master.stats.statutory_jobs', en: 'statutory jobs' },
    { key: 'project_master.stats.employment_quota', en: 'Employment Quota' },
    { key: 'project_master.stats.plots_registered', en: 'Plots Registered' },
    { key: 'project_master.map.title', en: 'Project Boundary & Plots' },
    { key: 'project_master.map.desc', en: 'PostGIS-style geometry viewer with statutory land-type color coding' },
    { key: 'project_master.clearances.title', en: 'Statutory Clearances' },
    { key: 'project_master.clearances.desc', en: 'DGMS, Environment, Forest Dept.' },
    { key: 'project_master.plot_schedule.title', en: 'Plot Schedule' },
    { key: 'project_master.plot_schedule.desc', en: 'Master land registry (LIS mirror) with exhausted-area-for-jobs denormalized column' },
    { key: 'project_master.plot_schedule.cols.plot', en: 'Plot' },
    { key: 'project_master.plot_schedule.cols.mouza', en: 'Mouza' },
    { key: 'project_master.plot_schedule.cols.type', en: 'Type' },
    { key: 'project_master.plot_schedule.cols.area', en: 'Area (ac)' },
    { key: 'project_master.plot_schedule.cols.exhausted', en: 'Exhausted (jobs)' },
    { key: 'project_master.plot_schedule.cols.job_quota', en: 'Job Quota' },
    { key: 'project_master.budget_compliance.title', en: 'Budget Compliance' },
    { key: 'project_master.budget_compliance.desc', en: 'WithinProjectBaseline guard — payslips cannot exceed ceiling' },
    { key: 'project_master.budget_compliance.disbursed', en: 'Disbursed vs. ceiling' },
    { key: 'project_master.budget_compliance.within_baseline', en: 'Within baseline — {pct}% utilized, headroom for {count} active payroll(s).' },
    { key: 'project_master.budget_compliance.breach_warning', en: 'Approaching ceiling — baseline breach will route payrolls to Board Escalation.' },
    { key: 'project_master.aprv_type.initial_pr', en: 'Initial PR Baseline' },
    { key: 'project_master.aprv_type.form_xxii_deviation', en: 'Form-XXII Deviation' },
    { key: 'project_master.aprv_level.cmd', en: 'CMD Approval' },
    { key: 'project_master.aprv_level.board_of_directors', en: 'Board of Directors' }
  ]

  for (const k of projectMasterKeys) {
    // We strip the module namespace 'project_master.' from the key before saving it to the db
    // because next-intl resolves `module.key` by looking up the `key` under the `module`.
    const dbKey = k.key.replace(/^project_master\./, '')
    const tKey = await db.translation_key.upsert({
      where: { module_id_key: { module_id: projectMasterModule.id, key: dbKey } },
      update: { updt_ts: new Date() },
      create: { id: randomUUID(), module_id: projectMasterModule.id, key: dbKey, updt_ts: new Date() },
    })
    await db.translation_value.upsert({
      where: { translation_key_id_language_id: { translation_key_id: tKey.id, language_id: enLang.id } },
      update: { value: k.en, status: 'approved', updt_ts: new Date() },
      create: { id: randomUUID(), translation_key_id: tKey.id, language_id: enLang.id, value: k.en, status: 'approved', updt_ts: new Date() },
    })
  }

  // documentUploader module
  const docUploaderModule = await db.translation_module.upsert({
    where: { name: 'documentUploader' },
    update: { updt_ts: new Date() },
    create: { id: randomUUID(), name: 'documentUploader', description: 'Translations for Document Uploader component', updt_ts: new Date() },
  })

  const docUploaderKeys = [
    { key: 'title', en: 'Upload Documents' },
    { key: 'description', en: 'Drag and drop files here, or click to browse.' },
    { key: 'btn_browse', en: 'Browse Files' },
    { key: 'btn_done', en: 'Done' },
    { key: 'btn_upload', en: 'Upload' },
    { key: 'btn_cancel', en: 'Cancel' },
    { key: 'constraints', en: 'Supported formats: PDF, DOCX, JPG, PNG (up to 10MB)' },
    { key: 'error_size', en: 'File size exceeds the 10MB limit.' },
    { key: 'error_type', en: 'File type not allowed.' },
    { key: 'uploading', en: 'Uploading...' },
    { key: 'success', en: 'Upload successful' },
    { key: 'scanning', en: 'Scanning for viruses...' },
    { key: 'clean', en: 'Clean' },
  ]

  for (const k of docUploaderKeys) {
    const tKey = await db.translation_key.upsert({
      where: { module_id_key: { module_id: docUploaderModule.id, key: k.key } },
      update: { updt_ts: new Date() },
      create: { id: randomUUID(), module_id: docUploaderModule.id, key: k.key, updt_ts: new Date() },
    })
    await db.translation_value.upsert({
      where: { translation_key_id_language_id: { translation_key_id: tKey.id, language_id: enLang.id } },
      update: { value: k.en, status: 'approved', updt_ts: new Date() },
      create: { id: randomUUID(), translation_key_id: tKey.id, language_id: enLang.id, value: k.en, status: 'approved', updt_ts: new Date() },
    })
  }

  console.log('✅ Translations seeded successfully!')
}
