import { db } from './src/lib/db'

const translations = {
  'nav.dashboard.label': 'Dashboard',
  'nav.dashboard.desc': 'Cross-module KPIs, SLA countdowns, and pending approvals',
  'nav.project-master.label': 'Project Master & GIS',
  'nav.project-master.desc': 'Locked baseline, statutory clearances, GIS boundary',
  'nav.acquisition.label': 'Land Acquisition',
  'nav.acquisition.desc': 'Plot acquisition proposals, CL-1 checklists, area/HQ vetting',
  'nav.form-i-wizard.label': 'Form-I Claim Wizard',
  'nav.form-i-wizard.desc': 'Public portal multi-step claim submission (21-day timer)',
  'nav.payroll-builder.label': 'Compensation Payroll',
  'nav.payroll-builder.desc': 'Live Math Engine preview, batch award calculation',
  'nav.paf-census.label': 'PAF Census Register',
  'nav.paf-census.desc': 'Project Affected Families census, photo ID cards, satellite freeze',
  'nav.rnr-asset.label': 'R&R Asset Proposal',
  'nav.rnr-asset.desc': 'Homestead, shifting, cattle shed, subsistence grant payrolls',
  'nav.payment-ledger.label': 'Form-D Payment Ledger',
  'nav.payment-ledger.desc': 'Immutable hash-chained payment register',
  'nav.nomination.label': 'Nominee Package Deal',
  'nav.nomination.desc': 'Form-A nomination, nominee pooling toward 2.00-acre threshold',
  'nav.employment.label': 'Employment Verification',
  'nav.employment.desc': '2.00-acre nominee pooling gate, Form-IX/X quota, CL-4 checklist',
  'nav.employment-wizard.label': 'Employment Application',
  'nav.employment-wizard.desc': 'Form-V/VI bio-data wizard, document upload, status tracker',
  'nav.workflow-inbox.label': 'Workflow Inbox',
  'nav.workflow-inbox.desc': 'Pending approvals across all modules',
  'shell.loading': 'Loading COALRR…',
  'shell.logout': 'Logout',
  'shell.menu': 'Menu'
};

async function seed() {
  console.log('Seeding common translations...');
  
  const lang = await db.language.findUnique({ where: { code: 'en' } });
  if (!lang) throw new Error('English language not found. Run test-localization.ts first.');

  const mod = await db.translationModule.upsert({
    where: { name: 'common' },
    update: {},
    create: { name: 'common' },
  });

  for (const [keyPath, value] of Object.entries(translations)) {
    const key = await db.translationKey.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: keyPath } },
      update: {},
      create: { moduleId: mod.id, key: keyPath },
    });

    await db.translationValue.upsert({
      where: { translationKeyId_languageId: { translationKeyId: key.id, languageId: lang.id } },
      update: { value, status: 'approved' },
      create: { translationKeyId: key.id, languageId: lang.id, value, status: 'approved' },
    });
  }

  console.log('✅ Common translations seeded successfully!');
}

seed().catch(console.error).finally(() => process.exit(0));
