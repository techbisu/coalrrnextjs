import { UserScopeService } from "@/core/authorization/services/UserScopeService";
import { db } from '@/lib/db'
import { form_d_ledger_entry } from '@prisma/client'
import { ILedgerEntryRepository, FormDLedgerEntryWithPlotAndMouza } from '@/modules/ledger/interfaces/ILedgerEntryRepository'

export class PrismaLedgerEntryRepository implements ILedgerEntryRepository {
  async findManyOrderedByPaidAtDesc(): Promise<FormDLedgerEntryWithPlotAndMouza[]> {
    return db.form_d_ledger_entry.findMany({
      orderBy: { paid_at: 'desc' },
    })
  }

  async findLastEntryByProject(project_id: string): Promise<form_d_ledger_entry | null> {
    return db.form_d_ledger_entry.findFirst({
      where: { project_id },
      orderBy: { paid_at: 'desc' },
    })
  }

  async create(data: Omit<form_d_ledger_entry, 'id' | 'paid_at' | 'entry_ts' | 'updt_ts' | 'del_ts' | 'entry_by' | 'updt_by'>): Promise<form_d_ledger_entry> {
    const { randomUUID } = require('crypto');
    return db.form_d_ledger_entry.create({
      data: {
        ...data,
        id: randomUUID(),
        updt_ts: new Date()
      }
    })
  }
}
