import type { PrismaClient } from '@prisma/client'

export async function seedWorkflowStates(db: PrismaClient) {
  console.log('🌱 Seeding workflow_states for Base & Direct Purchase (DP) Modes...')

  const states = [
    // Base LAND_SCHEDULE states
    { workflow_code: 'LAND_SCHEDULE', state_code: 'Drafting', label: 'Drafting', description: 'Plot schedule & compliance items assembled by initiating unit.', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: 'FileEdit', step_order: 1.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'UnitSubmitted', label: 'Unit Submitted & Cross-Colliery Verification', description: 'Plot schedule forwarded for overlap checking.', color: 'bg-sky-100 text-sky-700 border-sky-300', icon: 'Send', step_order: 2.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'AreaVetting', label: 'Area Vetting', description: 'Area office verifies plots, CL items, and baseline.', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: 'ShieldCheck', step_order: 3.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'BoardEscalation', label: 'Board Escalation', description: 'Project baseline breached. Board reviews.', color: 'bg-red-100 text-red-700 border-red-300', icon: 'AlertTriangle', step_order: 3.5, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'HqParallelVetting', label: 'HQ Parallel Vetting', description: 'GM (Planning), GM (Safety), GM (Finance), and HOD (Legal) review in parallel.', color: 'bg-violet-100 text-violet-700 border-violet-300', icon: 'GitBranch', step_order: 4.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'GmLreReview', label: 'GM LRE Consolidation', description: 'GM (LRE) consolidates recommendations.', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300', icon: 'UserCheck', step_order: 5.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'Published', label: 'Published', description: 'Digital workflow complete. Award published to ledger.', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: 'CheckCircle2', step_order: 6.0, is_terminal: true },

    // Direct Purchase (DP) Mode states (LAND_SCHEDULE_6 - acq_mode_id = 6)
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'Drafting', label: 'Direct Purchase Drafting', description: 'Plot schedule, tenancy list & rate proposal compiled.', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: 'FileEdit', step_order: 1.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'UnitSubmitted', label: 'Unit Submitted (Title Search)', description: 'Khatiyan land title search & survey boundary verification.', color: 'bg-sky-100 text-sky-700 border-sky-300', icon: 'Send', step_order: 2.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'PncVetting', label: 'Price Negotiation Committee (PNC) Vetting', description: 'PNC verifies Govt circle rates vs landowner demand & negotiates price.', color: 'bg-teal-100 text-teal-800 border-teal-300', icon: 'DollarSign', step_order: 2.5, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'FormXXIIClearance', label: 'Form-XXII Clearance', description: 'Land Cell verifies Form-XXII compliance & rate prescribed limits.', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: 'FileCheck', step_order: 2.8, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'AreaVetting', label: 'Area Vetting', description: 'Area GM & Area Vetting Committee verify PNC report.', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: 'ShieldCheck', step_order: 3.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'BoardEscalation', label: 'Board Escalation (Price Breach)', description: 'PNC negotiated price exceeds rate limits. Pending Board approval.', color: 'bg-red-100 text-red-700 border-red-300', icon: 'AlertTriangle', step_order: 3.5, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'HqParallelVetting', label: 'HQ Parallel Clearances', description: 'GM Planning, Finance, Safety, Legal review PNC package.', color: 'bg-violet-100 text-violet-700 border-violet-300', icon: 'GitBranch', step_order: 4.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'GmLreReview', label: 'GM LRE Consolidation', description: 'GM LRE consolidates PNC report and HQ clearances.', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300', icon: 'UserCheck', step_order: 5.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'DocketIssued', label: 'Purchase Docket Issued', description: 'Direct Purchase Agreement sale deed docket generated.', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: 'FileText', step_order: 5.5, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'ManuallyApproved', label: 'Sale Deed Executed', description: 'Sale deed executed & compensation payment cleared.', color: 'bg-teal-100 text-teal-700 border-teal-300', icon: 'Award', step_order: 5.8, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE_6', state_code: 'Published', label: 'Registered Deed Published', description: 'Registered sale deed published to Form-D ledger.', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: 'CheckCircle2', step_order: 6.0, is_terminal: true },
  ]

  for (const st of states) {
    await (db as any).workflow_states.upsert({
      where: {
        workflow_code_state_code: {
          workflow_code: st.workflow_code,
          state_code: st.state_code
        }
      },
      create: {
        ...st,
        entry_by: 'system',
        updt_by: 'system'
      },
      update: {
        label: st.label,
        description: st.description,
        color: st.color,
        icon: st.icon,
        step_order: st.step_order,
        is_terminal: st.is_terminal,
        updt_by: 'system'
      }
    })
  }
}
