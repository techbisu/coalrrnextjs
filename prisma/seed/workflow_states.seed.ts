import type { PrismaClient } from '@prisma/client'

export async function seedWorkflowStates(db: PrismaClient) {
  console.log('🌱 Seeding workflow_states...')

  const states = [
    { workflow_code: 'LAND_SCHEDULE', state_code: 'Drafting', label: 'Drafting', description: 'Plot schedule & compliance items assembled by initiating unit.', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: 'FileEdit', step_order: 1.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'UnitSubmitted', label: 'Unit Submitted & Cross-Colliery Verification', description: 'Plot schedule forwarded for overlap checking.', color: 'bg-sky-100 text-sky-700 border-sky-300', icon: 'Send', step_order: 2.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'AreaVetting', label: 'Area Vetting', description: 'Area office verifies plots, CL items, and baseline.', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: 'ShieldCheck', step_order: 3.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'BoardEscalation', label: 'Board Escalation', description: 'Project baseline breached. Board reviews.', color: 'bg-red-100 text-red-700 border-red-300', icon: 'AlertTriangle', step_order: 3.5, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'HqParallelVetting', label: 'HQ Parallel Vetting', description: 'GM (Planning), GM (Safety), GM (Finance), and HOD (Legal) review in parallel.', color: 'bg-violet-100 text-violet-700 border-violet-300', icon: 'GitBranch', step_order: 4.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'GmLreReview', label: 'GM LRE Consolidation', description: 'GM (LRE) consolidates recommendations.', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300', icon: 'UserCheck', step_order: 5.0, is_terminal: false },
    { workflow_code: 'LAND_SCHEDULE', state_code: 'Published', label: 'Published', description: 'Digital workflow complete. Award published to ledger.', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: 'CheckCircle2', step_order: 6.0, is_terminal: true },
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
