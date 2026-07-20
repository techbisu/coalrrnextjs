import { UserScopeService } from "@/core/authorization/services/UserScopeService";
import { db } from '@/lib/db'
import {
  IPafRepository,
  PafRecordDetails,
  CreatePafRecordDto,
  UpdatePafRecordDto,
} from '@/modules/paf/interfaces/IPafRepository'

function mapToDetails(record: any): PafRecordDetails {
  return {
    id: record.id.toString(),
    paf_id: record.paf_id,
    claimant_name: record.claimant_name,
    category_of_entitlement: record.category_of_entitlement,
    sc_st_obc_category: record.sc_st_obc_category,
    plot_id: record.plot_id?.toString() ?? null,
    plot_number: record.plot?.plot_number ?? null,
    mouza: record.plot?.mouza?.name ?? null,
    photo_identity_card_doc: record.photo_identity_card_doc,
    entry_ts: record.entry_ts?.toISOString() ?? new Date().toISOString(),
  }
}

export class PrismaPafRepository implements IPafRepository {
  async findMany(filters: { category_of_entitlement?: string; sc_st_obc_category?: string }): Promise<PafRecordDetails[]> {
    const where: Record<string, unknown> = {}
    if (filters.category_of_entitlement) where.category_of_entitlement = filters.category_of_entitlement
    if (filters.sc_st_obc_category) where.sc_st_obc_category = filters.sc_st_obc_category

    const records = await db.paf_census_record.findMany({
      where,
      include: { plot: { include: { mouza: true } } },
      orderBy: { entry_ts: 'desc' },
    })

    return records.map(mapToDetails)
  }

  async findById(id: string): Promise<PafRecordDetails | null> {
    const record = await db.paf_census_record.findUnique({
      where: { id },
      include: { plot: { include: { mouza: true } } },
    })

    return record ? mapToDetails(record) : null
  }

  async count(): Promise<number> {
    return await db.paf_census_record.count()
  }

  async create(data: CreatePafRecordDto): Promise<PafRecordDetails> {
    const record = await db.paf_census_record.create({
      data: {
        paf_id: data.paf_id,
        claimant_name: data.claimant_name,
        category_of_entitlement: data.category_of_entitlement,
        sc_st_obc_category: data.sc_st_obc_category ?? null,
        plot_id: data.plot_id ?? null,
      },
      include: { plot: { include: { mouza: true } } },
    })

    return mapToDetails(record)
  }

  async update(id: string, data: UpdatePafRecordDto): Promise<PafRecordDetails> {
    const record = await db.paf_census_record.update({
      where: { id },
      data: {
        ...(data.claimant_name && { claimant_name: data.claimant_name }),
        ...(data.category_of_entitlement && { category_of_entitlement: data.category_of_entitlement }),
        ...(data.sc_st_obc_category !== undefined && { sc_st_obc_category: data.sc_st_obc_category }),
        ...(data.plot_id !== undefined && { plot_id: data.plot_id ? data.plot_id : null }),
        ...(data.photo_identity_card_doc !== undefined && { photo_identity_card_doc: data.photo_identity_card_doc }),
      },
      include: { plot: { include: { mouza: true } } },
    })

    return mapToDetails(record)
  }

  async delete(id: string): Promise<void> {
    await db.paf_census_record.delete({ where: { id } })
  }
}
