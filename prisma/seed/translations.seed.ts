import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedTranslations(db: PrismaClient) {
  console.log('Seeding translations (simplified)...')

  // Ensure English language exists
  let enLang = await db.language.findUnique({ where: { code: 'en' } })
  if (!enLang) {
    enLang = await db.language.create({
      data: { id: randomUUID(), code: 'en', name: 'English', native_name: 'English', is_default: true, updt_ts: new Date() }
    })
  }
  
  let hiLang = await db.language.findUnique({ where: { code: 'hi' } })
  if (!hiLang) {
    hiLang = await db.language.create({
      data: { id: randomUUID(), code: 'hi', name: 'Hindi', native_name: 'हिन्दी', is_default: false, updt_ts: new Date() }
    })
  }

  // Translation seed structure per module (complies with translations.md):
  const translations = {
    common: {
      nav: {
        dashboard: { label: { en: 'Dashboard' }, desc: { en: 'Cross-module KPIs, SLA countdowns, and pending approvals' } },
        "project-master": { label: { en: 'Project Master & GIS' }, desc: { en: 'Locked baseline, statutory clearances, GIS boundary' } },
        acquisition: { label: { en: 'Land Acquisition' }, desc: { en: 'Plot acquisition proposals, CL-1 checklists, area/HQ vetting' } },
        "form-i-wizard": { label: { en: 'Form-I Claim Wizard' }, desc: { en: 'Public portal multi-step claim submission (21-day timer)' } },
        "payroll-builder": { label: { en: 'Compensation Payroll' }, desc: { en: 'Live Math Engine preview, batch award calculation' } },
        "paf-census": { label: { en: 'PAF Census Register' }, desc: { en: 'Project Affected Families census, photo ID cards, satellite freeze' } },
        "rnr-asset": { label: { en: 'R&R Asset Proposal' }, desc: { en: 'Homestead, shifting, cattle shed, subsistence grant payrolls' } },
        "payment-ledger": { label: { en: 'Form-D Payment Ledger' }, desc: { en: 'Immutable hash-chained payment register' } },
        nomination: { label: { en: 'Nominee Package Deal' }, desc: { en: 'Form-A nomination, nominee pooling toward 2.00-acre threshold' } },
        employment: { label: { en: 'Employment Verification' }, desc: { en: '2.00-acre nominee pooling gate, Form-IX/X quota, CL-4 checklist' } },
        "employment-wizard": { label: { en: 'Employment Application' }, desc: { en: 'Form-V/VI bio-data wizard, document upload, status tracker' } },
        "workflow-inbox": { label: { en: 'Workflow Inbox' }, desc: { en: 'Pending approvals across all modules' } },
        "admin-settings": { label: { en: 'System Settings' }, desc: { en: 'Configure core platform parameters and preferences' } },
        "admin-audit": { label: { en: 'Audit Logs' }, desc: { en: 'Immutable record of system-wide changes' } },
        "admin-users": { label: { en: 'User Management' }, desc: { en: 'Manage system users, passwords, and assignments' } },
        "admin-roles": { label: { en: 'Roles & Profiles' }, desc: { en: 'Define access roles and operational profiles' } },
        "admin-permissions": { label: { en: 'Permissions' }, desc: { en: 'Granular access control policies' } },
        "admin-master": { label: { en: 'Master Data' }, desc: { en: 'Manage lookup tables, dictionaries, and constants' } },
      },
      shell: {
        loading: { en: 'Loading COALRR…' },
        logout: { en: 'Logout' },
        menu: { en: 'Menu' },
        version: { en: 'Version' },
      },
      sidebar: {
        workspace: { en: 'Workspace' },
      },
      common: {
        cancel: { en: 'Cancel' },
        locking: { en: 'Locking…' },
        upload_success: { en: 'Uploaded: {name}' },
        upload_failed: { en: 'Failed to upload file' },
        save_changes: { en: 'Save Changes' },
        loading_approvals: { en: 'Loading approvals…' },
        uploaded: { en: 'Uploaded' },
        view_proposal: { en: 'View Proposal →' },
        edit: { en: 'Edit' },
        cleared: { en: 'cleared' },
        issued_on: { en: 'issued' },
      },
      config: {
        CATEGORY_AUTHENTICATION: { en: 'Authentication', hi: 'प्रमाणीकरण' },
        CATEGORY_NOTIFICATIONS: { en: 'Notifications', hi: 'सूचनाएं' },
        CATEGORY_SYSTEM: { en: 'System Settings', hi: 'सिस्टम सेटिंग्स' },
        TYPE_NUMBER: { en: 'Number', hi: 'संख्या' },
        TYPE_STRING: { en: 'Text', hi: 'पाठ' },
        TYPE_BOOLEAN: { en: 'Toggle (Yes/No)', hi: 'टॉगल (हां/नहीं)' },
      }
    },
    project_master: {
      lock_error: { en: 'Failed to lock baseline' },
      lock_success: { en: 'Baseline LOCKED for "{name}".' },
      lock_baseline_title: { en: 'Lock Baseline' },
      lock_baseline_desc: { en: 'This action is irreversible. Once locked, the project baseline (land limit, budget ceiling, employment quota) becomes immutable and downstream modules bind to it.' },
      irreversible_op: { en: 'Irreversible operation' },
      lock_confirm_prompt: { en: 'You are about to lock the baseline for ' },
      lock_type_confirm: { en: 'Type the project name exactly as shown below to confirm.' },
      type_name_to_confirm: { en: 'Type the project name to confirm' },
      name_matches: { en: 'Name matches — ready to lock.' },
      expected: { en: 'Expected:' },
      lock_baseline_btn: { en: 'Lock Baseline' },
      area_compliance: { en: 'Area Compliance' },
      save_error: { en: 'Failed to save project' },
      update_success: { en: 'Project updated.' },
      create_success: { en: 'Project "{name}" created as draft.' },
      edit_baseline: { en: 'Edit Project Baseline' },
      edit_baseline_desc: { en: 'Update draft baseline details. Once locked, these fields become immutable.' },
      new_project_desc: { en: 'Create a new draft project baseline. The baseline can be edited until it is locked.' },
      fields: {
        name: { en: 'Project name' },
        name_ph: { en: 'e.g. Bhubaneswari OCP Phase-III' },
        state: { en: 'State' },
        state_ph: { en: 'Select State...' },
        area: { en: 'Area' },
        area_ph: { en: 'Select Area...' },
        mine: { en: 'Mine / Colliery' },
        mine_ph: { en: 'Select Mine...' },
        mouzas: { en: 'Mapped Mouzas' },
        mouzas_ph: { en: 'Select Mouzas...' },
        land_limit: { en: 'Land limit (acres)' },
        employment_quota: { en: 'Employment quota' },
        budget_ceiling: { en: 'Total budget ceiling (₹)' },
        pr_doc: { en: 'Approved PR Document' },
        pr_doc_upload: { en: 'Upload document' },
      },
      form: {
        projectName: { en: 'Project Name *' },
        projectNamePlaceholder: { en: 'e.g. Bhubaneswari OCP Phase-III' },
        state: { en: 'State' },
        statePlaceholder: { en: 'Select State...' },
        area: { en: 'Area' },
        areaPlaceholder: { en: 'Select Area...' },
        mine: { en: 'Mine / Colliery' },
        minePlaceholder: { en: 'Select Mine...' },
        landLimitAcres: { en: 'Land limit (acres)' },
        landLimitPlaceholder: { en: '450.0000' },
        employmentQuota: { en: 'Employment quota' },
        employmentQuotaPlaceholder: { en: '0' },
        landBudget: { en: 'Land Budget (INR)' },
        landBudgetPlaceholder: { en: '0' },
        rrBudget: { en: 'R&R Budget (INR)' },
        rrBudgetPlaceholder: { en: '0' },
        approvalDate: { en: 'Approval Date *' },
        approvalDatePlaceholder: { en: 'Select approval date' },
        boardRef: { en: 'Board Ref / File No *' },
        boardRefPlaceholder: { en: 'e.g. CIL/BOARD/2026/01' },
        initialBaselineDoc: { en: 'Initial Baseline Approval Document (Form-I / Board Resolution) *' },
        proposedArea: { en: 'Proposed Additional Area (Acres)' },
        proposedAreaPlaceholder: { en: 'e.g. 50' },
        proposedJobs: { en: 'Proposed Additional Jobs' },
        proposedJobsPlaceholder: { en: 'e.g. 10' },
        boardApprovalDate: { en: 'Board Approval Date *' },
        dgmsStatus: { en: 'DGMS Clearance Status' },
        envStatus: { en: 'Environment Clearance Status' },
        forestStatus: { en: 'Forest Clearance Status' },
        selectStatus: { en: 'Select status...' },
        formXXIIDoc: { en: 'Form-XXII Approved Document *' }
      },
      form_xxii_error: { en: 'Failed to load Form-XXII approvals' },
      form_xxii_title: { en: 'Board Deviation Approvals (Form-XXII)' },
      form_xxii_desc: { en: 'Proposals that exceeded project limits and received formal Board approval' },
      simulate_form_xxii: { en: 'Simulate Form-XXII' },
      title: { en: 'Project Master' },
      no_projects_desc: { en: 'No projects yet — create one to get started.' },
      new_project: { en: 'New Project' },
      baseline_locked: { en: 'Baseline Locked' },
      draft_status: { en: 'Draft — not locked' },
      colliery_code: { en: 'Colliery code' },
      switch_project: { en: 'Switch project:' },
      baseline_not_locked_title: { en: 'Baseline not locked' },
      baseline_not_locked_desc: { en: 'This project is still in draft. Downstream modules (Form-I claims, compensation payrolls, Form-D ledger) cannot bind to an unlocked baseline. Lock it to enable acquisition workflows.' },
      stats: {
        land_limit: { en: 'Land Limit' },
        budget_ceiling: { en: 'Budget Ceiling' },
        utilized_pct: { en: 'utilized {pct}%' },
        statutory_jobs: { en: 'statutory jobs' },
        employment_quota: { en: 'Employment Quota' },
        plots_registered: { en: 'Plots Registered' },
      },
      map: {
        title: { en: 'Project Boundary & Plots' },
        desc: { en: 'PostGIS-style geometry viewer with statutory land-type color coding' },
      },
      clearances: {
        title: { en: 'Statutory Clearances' },
        desc: { en: 'DGMS, Environment, Forest Dept.' },
      },
      plot_schedule: {
        title: { en: 'Plot Schedule' },
        desc: { en: 'Master land registry (LIS mirror) with exhausted-area-for-jobs denormalized column' },
        cols: {
          plot: { en: 'Plot' },
          mouza: { en: 'Mouza' },
          type: { en: 'Type' },
          area: { en: 'Area (ac)' },
          exhausted: { en: 'Exhausted (jobs)' },
          job_quota: { en: 'Job Quota' },
        }
      },
      budget_compliance: {
        title: { en: 'Budget Compliance' },
        desc: { en: 'WithinProjectBaseline guard — payslips cannot exceed ceiling' },
        disbursed: { en: 'Disbursed vs. ceiling' },
        within_baseline: { en: 'Within baseline — {pct}% utilized, headroom for {count} active payroll(s).' },
        breach_warning: { en: 'Approaching ceiling — baseline breach will route payrolls to Board Escalation.' },
      },
      aprv_type: {
        initial_pr: { en: 'Initial PR Baseline' },
        form_xxii_deviation: { en: 'Form-XXII Deviation' },
      },
      aprv_level: {
        cmd: { en: 'CMD Approval' },
        board_of_directors: { en: 'Board of Directors' },
      }
    },
    Dashboard: {
      errors: {
        failedToLoad: { en: 'Failed to load dashboard', hi: 'डैशबोर्ड लोड करने में विफल' },
      },
      title: { en: 'Dashboard', hi: 'डैशबोर्ड' },
      description: { en: 'System-wide metrics and KPIs', hi: 'सिस्टम-वाइड मेट्रिक्स और केपीआई' },
      kpi: {
        projects: { en: 'Projects', hi: 'परियोजनाएं' },
        projectsSub: { en: 'Active Projects', hi: 'सक्रिय परियोजनाएं' },
        plots: { en: 'Plots', hi: 'भूखंड' },
        claims: { en: 'Claims', hi: 'दावे' },
        payrolls: { en: 'Payrolls', hi: 'पेरोल' },
        ledger: { en: 'Ledger', hi: 'बहीखाता' },
        ledgerSub: { en: 'Total Disbursed', hi: 'कुल वितरित' },
        employment: { en: 'Employment', hi: 'रोजगार' },
      },
      common: {
        acres: { en: 'Acres', hi: 'एकड़' },
      },
    },
    documentUploader: {
      title: { en: 'Upload Documents' },
      description: { en: 'Drag and drop files here, or click to browse.' },
      btn_browse: { en: 'Browse Files' },
      btn_done: { en: 'Done' },
      btn_upload: { en: 'Upload' },
      btn_cancel: { en: 'Cancel' },
      constraints: { en: 'Supported formats: PDF, DOCX, JPG, PNG (up to 10MB)' },
      uploading: { en: 'Uploading...' },
      success: { en: 'Upload successful' },
      scanning: { en: 'Scanning for viruses...' },
      clean: { en: 'Clean' },
    },
    roles: {
      land_clerk: { en: 'Land Clerk / Revenue Inspector', hi: 'भूमि लिपिक / राजस्व निरीक्षक' },
      surveyor: { en: 'Unit Surveyor', hi: 'इकाई सर्वेक्षक' },
      colliery_manager: { en: 'Colliery / Project Manager', hi: 'कोलियरी / परियोजना प्रबंधक' },
      project_agent: { en: 'Project / Colliery Agent', hi: 'परियोजना / कोलियरी एजेंट' },
      area_land_officer: { en: 'Area Land Dealing Officer (ALDO)', hi: 'क्षेत्रीय भूमि अधिकारी' },
      area_land_cell_member: { en: 'Area Land Cell Committee Member', hi: 'क्षेत्रीय भूमि सेल सदस्य' },
      area_gm: { en: 'Area General Manager (AGM)', hi: 'क्षेत्रीय महाप्रबंधक' },
      land_officer_lre: { en: 'Land Officer (L&RE HQ)', hi: 'भूमि अधिकारी (मुख्यालय)' },
      gm_lre: { en: 'General Manager (Land & Revenue HQ)', hi: 'महाप्रबंधक (भूमि एवं राजस्व)' },
      gm_planning: { en: 'General Manager (Planning HQ)', hi: 'महाप्रबंधक (योजना)' },
      gm_finance: { en: 'General Manager (Finance HQ)', hi: 'महाप्रबंधक (वित्त)' },
      gm_safety: { en: 'General Manager (Safety HQ)', hi: 'महाप्रबंधक (सुरक्षा)' },
      director: { en: 'Director / CMD', hi: 'निदेशक / सीएमडी' },
      super_admin: { en: 'System Super Administrator', hi: 'सिस्टम सुपर प्रशासक' },
    },
    forms: {
      form_vii: {
        title: { en: 'Form-VII: Joint Reconciliation Certificate', hi: 'प्रपत्र-VII: संयुक्त समाधान एवं सीमांकन प्रमाण पत्र' },
        description: { en: '12-Signature inter-colliery and inter-area land boundary reconciliation certificate.', hi: '12-हस्ताक्षर अंतर-कोलियरी एवं अंतर-क्षेत्रीय भूमि सीमा समाधान प्रमाण पत्र।' },
      },
      form_xvi: {
        title: { en: 'Form-XVI: Five-Point Land Certificate', hi: 'प्रपत्र-XVI: पंच-सूत्रीय भूमि प्रमाण पत्र' },
        description: { en: 'Five critical statutory land acquisition conditions certification.', hi: 'पांच महत्वपूर्ण वैधानिक भूमि अधिग्रहण शर्तों का प्रमाण पत्र।' },
      },
      form_xxii: {
        title: { en: 'Form-XXII: Area Land Cell Clearance', hi: 'प्रपत्र-XXII: क्षेत्रीय भूमि सेल अनापत्ति प्रमाण पत्र' },
        description: { en: 'Area land clearance and statutory vetting certificate.', hi: 'क्षेत्रीय भूमि अनापत्ति एवं वैधानिक जांच प्रमाण पत्र।' },
      },
      actions: {
        generate: { en: 'Generate Document', hi: 'दस्तावेज़ तैयार करें' },
        save_draft: { en: 'Save Draft Inputs', hi: 'प्रारूप सहेजें' },
        request_review: { en: 'Request Review', hi: 'समीक्षा का अनुरोध करें' },
        apply_signature: { en: 'Sign & Authorize', hi: 'हस्ताक्षर एवं अधिकृत करें' },
        download_docx: { en: 'Download DOCX', hi: 'DOCX डाउनलोड करें' },
      }
    }
  }

  // Iterate over translation object and insert flat keys required by next-intl/DB
  const langs: Record<string, string> = { en: enLang.id, hi: hiLang.id }

  for (const [moduleName, entities] of Object.entries(translations)) {
    const flatten = (obj: any, prefix = ''): { key: string, values: any }[] => {
      let result: { key: string, values: any }[] = []
      for (const [k, v] of Object.entries(obj)) {
        if (v && typeof v === 'object' && ('en' in v || 'hi' in v)) {
          result.push({ key: prefix + k, values: v })
        } else {
          result = result.concat(flatten(v, prefix + k + '.'))
        }
      }
      return result
    }

    const flatKeys = flatten(entities)
    
    for (const { key, values } of flatKeys) {
      for (const [langCode, val] of Object.entries(values)) {
        if (langs[langCode]) {
          await db.translation.upsert({
            where: { module_key_language_id: { module: moduleName, key: key, language_id: langs[langCode] } },
            update: { value: val as string, updt_ts: new Date() },
            create: {
              id: randomUUID(),
              module: moduleName,
              key: key,
              language_id: langs[langCode],
              value: val as string,
              updt_ts: new Date()
            }
          })
        }
      }
    }
  }

  console.log('✅ Translations seeded successfully!')
}
