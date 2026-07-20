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

  async findOptionsByValues(params: {
    master: string
    labelField: string
    valueField: string
    values: string[]
  }): Promise<MasterOption[]> {
    const { master, labelField, valueField, values } = params

    if (values.length === 0) return []

    // Try BigInt conversion safely, fallback to string/number if it fails.
    // We assume all values are of the same type for a given table's PK.
    let typedValues: any[] = values
    try {
      typedValues = values.map(v => BigInt(v))
    } catch {
      try {
        typedValues = values.map(v => Number(v))
        if (typedValues.some(v => isNaN(v))) {
           typedValues = values
        }
      } catch {
        typedValues = values
      }
    }

    // @ts-ignore
    const records = await prisma[master].findMany({
      where: {
        [valueField]: { in: typedValues }
      },
      select: {
        [valueField]: true,
        [labelField]: true,
      }
    })

    return records.map((record: any) => ({
      value: String(record[valueField]),
      label: String(record[labelField]),
    }))
  }
}
