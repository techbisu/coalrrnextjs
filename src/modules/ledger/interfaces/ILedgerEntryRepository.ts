import { form_d_ledger_entry, mst_plot, mst_mouza } from '@prisma/client'

export type FormDLedgerEntryWithPlotAndMouza = form_d_ledger_entry & {
  plot: (mst_plot & { mouza: mst_mouza }) | null
}

export interface ILedgerEntryRepository {
  findManyOrderedByPaidAtDesc(): Promise<FormDLedgerEntryWithPlotAndMouza[]>
  findLastEntryByProject(project_id: string): Promise<form_d_ledger_entry | null>
  create(data: Omit<form_d_ledger_entry, 'id' | 'paid_at' | 'entry_ts' | 'updt_ts' | 'del_ts' | 'entry_by' | 'updt_by'>): Promise<form_d_ledger_entry>
}
