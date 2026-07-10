import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { ILedgerEntryRepository } from '@/modules/ledger/interfaces/ILedgerEntryRepository'

export interface LedgerEntryDTO {
  id: string
  plot_id: string
  plot_number?: string
  mouza?: string
  amount_land: string
  amount_rnr: string
  payee_type: string
  payee_name: string
  rtgs_utr_reference: string | null
  row_hash: string | null
  previous_hash: string | null
  state: string
  paid_at: string
  isImmutable: boolean
}

export class ListLedgerEntriesUseCase implements IUseCase<void, LedgerEntryDTO[]> {
  constructor(private readonly ledgerEntryRepository: ILedgerEntryRepository) {}

  async execute(): Promise<Result<LedgerEntryDTO[]>> {
    try {
      const entries = await this.ledgerEntryRepository.findManyOrderedByPaidAtDesc()

      const dtos: LedgerEntryDTO[] = entries.map((e) => ({
        id: e.id,
        plot_id: e.plot_id,
        plot_number: e.plot?.plot_number,
        mouza: e.plot?.mouza?.name,
        amount_land: e.amount_land.toString(),
        amount_rnr: e.amount_rnr.toString(),
        payee_type: e.payee_type,
        payee_name: e.payee_name,
        rtgs_utr_reference: e.rtgs_utr_reference,
        row_hash: e.row_hash,
        previous_hash: e.previous_hash,
        state: e.state,
        paid_at: e.paid_at.toISOString(),
        isImmutable: e.row_hash !== null,
      }))

      return Ok(dtos)
    } catch (error) {
      return Fail(error instanceof Error ? error.message : String(error))
    }
  }
}
