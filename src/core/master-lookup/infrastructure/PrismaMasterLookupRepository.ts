import { IMasterLookupRepository, FindOptionsParams } from '../domain/IMasterLookupRepository'
import { MasterOption } from '../types'
import { db as prisma } from '@/lib/db'

export class PrismaMasterLookupRepository implements IMasterLookupRepository {
  async findOptions(params: FindOptionsParams): Promise<MasterOption[]> {
    const { master, labelField, valueField, dependencies, searchQuery, activeOnly } = params

    const where: any = {}

    if (activeOnly) {
      where.is_active = true
    }

    if (searchQuery) {
      where[labelField] = {
        contains: searchQuery,
        mode: 'insensitive',
      }
    }

    if (dependencies) {
      Object.entries(dependencies).forEach(([key, value]) => {
        where[key] = value
      })
    }

    // @ts-ignore - dynamic model query
    const records = await prisma[master].findMany({
      where,
      select: {
        [valueField]: true,
        [labelField]: true,
      },
      orderBy: {
        [labelField]: 'asc',
      },
    })

    return records.map((record: any) => ({
      value: String(record[valueField]),
      label: String(record[labelField]),
    }))
  }
}
