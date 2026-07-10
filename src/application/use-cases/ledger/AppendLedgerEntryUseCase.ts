import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { ILedgerEntryRepository } from '@/modules/ledger/interfaces/ILedgerEntryRepository'
import { createHash } from 'crypto'
import { Prisma } from '@prisma/client'

export interface AppendLedgerEntryRequest {
  project_id?: string
  plot_id?: string
  amount_land?: string
  amount_rnr?: string
  payee_name?: string
  rtgs_utr_reference?: string
}

export interface AppendLedgerEntryResponse {
  id: string
  row_hash: string | null
  previous_hash: string | null
  isImmutable: boolean
  message: string
}

export class AppendLedgerEntryUseCase implements IUseCase<AppendLedgerEntryRequest, AppendLedgerEntryResponse> {
  constructor(private readonly ledgerEntryRepository: ILedgerEntryRepository) {}

  async execute(request: AppendLedgerEntryRequest): Promise<Result<AppendLedgerEntryResponse>> {
    try {
      if (!request.project_id || !request.plot_id || !request.amount_land || !request.amount_rnr || !request.payee_name) {
        return Fail('project_id, plot_id, amount_land, amount_rnr, payee_name required')
      }

      const projectIdBigInt = String(request.project_id)
      const plotIdBigInt = String(request.plot_id)

      const lastEntry = await this.ledgerEntryRepository.findLastEntryByProject(projectIdBigInt)
      const previous_hash = lastEntry?.row_hash ?? null

      const canonical = `${request.plot_id}|${request.amount_land}|${request.amount_rnr}|individual|${request.payee_name}|${request.rtgs_utr_reference ?? ''}|${previous_hash ?? 'GENESIS'}`
      const row_hash = createHash('sha256').update(canonical).digest('hex')

      const entry = await this.ledgerEntryRepository.create({
        project_id: projectIdBigInt,
        plot_id: plotIdBigInt,
        amount_land: new Prisma.Decimal(request.amount_land),
        amount_rnr: new Prisma.Decimal(request.amount_rnr),
        payee_type: 'individual',
        payee_name: request.payee_name,
        rtgs_utr_reference: request.rtgs_utr_reference || null,
        row_hash,
        previous_hash,
        state: 'approved',
      })

      return Ok({
        id: entry.id,
        row_hash: entry.row_hash,
        previous_hash: entry.previous_hash,
        isImmutable: true,
        message: 'Ledger entry sealed — row is now immutable (BEFORE UPDATE/DELETE trigger enforced).',
      })
    } catch (error) {
      return Fail(error instanceof Error ? error.message : String(error))
    }
  }
}
