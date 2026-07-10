export interface PafRecordDetails {
  id: string
  paf_id: string
  claimant_name: string
  category_of_entitlement: string
  sc_st_obc_category: string | null
  plot_id: string | null
  plot_number: string | null
  mouza: string | null
  photo_identity_card_doc: string | null
  entry_ts: string
}

export interface CreatePafRecordDto {
  paf_id: string
  claimant_name: string
  category_of_entitlement: string
  sc_st_obc_category?: string | null
  plot_id?: string | null
}

export interface UpdatePafRecordDto {
  claimant_name?: string
  category_of_entitlement?: string
  sc_st_obc_category?: string | null
  plot_id?: string | null
  photo_identity_card_doc?: string | null
}

export interface IPafRepository {
  findMany(filters: { category_of_entitlement?: string; sc_st_obc_category?: string }): Promise<PafRecordDetails[]>
  findById(id: string): Promise<PafRecordDetails | null>
  count(): Promise<number>
  create(data: CreatePafRecordDto): Promise<PafRecordDetails>
  update(id: string, data: UpdatePafRecordDto): Promise<PafRecordDetails>
  delete(id: string): Promise<void>
}
