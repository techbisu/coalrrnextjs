import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MASTER_REGISTRY } from '@/core/config/master.config'

/**
 * Master data lookup API.
 *
 * Returns the FULL dataset for the given table + dependency filters.
 * Search / filtering is done CLIENT-SIDE in MasterAutocomplete — no search param is accepted here.
 * Results are cached by React Query for 1 hour per dependency set.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const { searchParams } = new URL(req.url)

    const config = MASTER_REGISTRY[table]
    if (!config) {
      return NextResponse.json({ options: [] })
    }

    const modelName = config.modelName as keyof typeof db
    const primaryKey = config.primaryKey

    // Auto-detect label column (usually _en or name)
    const labelCol = config.columns.find(c =>
      c.type === 'string' &&
      (c.key.endsWith('_en') || c.key.includes('name') || c.key.includes('type') ||
       c.key.includes('class') || c.key.includes('method') || c.key.includes('use') ||
       c.key.includes('description'))
    )
    const labelKey = labelCol ? labelCol.key : config.columns[1].key

    const pkConfig = config.columns.find(c => c.key === primaryKey)
    const pkIsNumeric = pkConfig?.type === 'number'

    // Build where clause: activeOnly + cascade dependency filters + selected values for Edit mode
    const buildWhere = (useBigInt: boolean) => {
      const filters: any = {}

      // Active-only filter
      if (searchParams.get('activeOnly') === 'true' && config.columns.some(c => c.key === 'is_active')) {
        filters.is_active = true
      }

      // Cascade dependency filters (e.g. district_lgd=704 → filter blocks by district)
      searchParams.forEach((value, rawKey) => {
        if (rawKey === 'values' || rawKey === 'activeOnly' || rawKey === 'ignore_scope' || !value) return
        const key = rawKey === 'role' && config.modelName === 'user' ? 'designation' : rawKey
        const colConfig = config.columns.find(c => c.key === key)
        if (!colConfig) return

        if (value.includes(',')) {
          const list = value.split(',').filter(Boolean)
          filters[key] = colConfig?.type === 'number'
            ? { in: list.map(v => useBigInt ? BigInt(v) : Number(v)) }
            : { in: list }
        } else if (value === 'null') {
          filters[key] = null
        } else if (colConfig.type === 'string') {
          filters[key] = { contains: value, mode: 'insensitive' }
        } else {
          filters[key] = colConfig?.type === 'number'
            ? (useBigInt ? BigInt(value) : Number(value))
            : value
        }
      })

      // Selected values param — ensures pre-selected items always appear in Edit mode
      const valuesParam = searchParams.get('values')
      const valuesList = valuesParam ? valuesParam.split(',').filter(Boolean) : []

      if (valuesList.length > 0) {
        const parsedValues = valuesList.map(v => {
          if (pkIsNumeric) return useBigInt ? BigInt(v) : Number(v)
          if (pkConfig?.type === 'boolean') return v === 'true'
          return v
        })
        // OR: base filters OR forced PK match (so selected labels always resolve)
        return { OR: [filters, { [primaryKey]: { in: parsedValues } }] }
      }

      return filters
    }

    let records: any[]
    try {
      records = await (db as any)[modelName].findMany({
        where: buildWhere(true),
        take: 2000, // generous upper bound for client-side filtering
        orderBy: { [labelKey]: 'asc' },
      })
    } catch {
      // Fallback: retry with Number instead of BigInt
      records = await (db as any)[modelName].findMany({
        where: buildWhere(false),
        take: 2000,
        orderBy: { [labelKey]: 'asc' },
      })
    }

    const options = records.map((r: any) => ({
      value: String(r[primaryKey]), // BigInt → string safely
      label: config.labelFormat ? config.labelFormat(r) : String(r[labelKey]),
      data: Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
      )
    }))

    return NextResponse.json({ options })
  } catch (error: any) {
    console.error('Master data lookup error:', error.message)
    return NextResponse.json({ error: 'Failed to retrieve options' }, { status: 500 })
  }
}
