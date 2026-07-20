import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MASTER_REGISTRY } from '@/modules/admin/master-data/config/MasterDataRegistry'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const config = MASTER_REGISTRY[table];
    if (!config) {
      return NextResponse.json({ options: [] });
    }

    const modelName = config.modelName as keyof typeof db;
    const primaryKey = config.primaryKey;
    
    // Auto-detect a label column (usually _en or name)
    const labelCol = config.columns.find(c => 
      c.type === 'string' && 
      (c.key.endsWith('_en') || c.key.includes('name') || c.key.includes('type') || c.key.includes('class') || c.key.includes('method') || c.key.includes('use') || c.key.includes('description'))
    );
    const labelKey = labelCol ? labelCol.key : config.columns[1].key;

    // Build Prisma query dynamically with fallback for BigInt vs Int
    const buildWhere = (useBigInt: boolean) => {
      // Base filters (activeOnly, cascade dependencies)
      const baseFilters: any = {};
      
      if (searchParams.get('activeOnly') === 'true' && config.columns.some(c => c.key === 'is_active')) {
        baseFilters.is_active = true;
      }

      searchParams.forEach((value, key) => {
        if (key !== 'search' && key !== 'values' && key !== 'activeOnly' && value) {
          const colConfig = config.columns.find(c => c.key === key);
          if (colConfig?.type === 'number') {
            baseFilters[key] = useBigInt ? BigInt(value) : Number(value);
          } else {
            baseFilters[key] = value;
          }
        }
      });

      // Parse selected values param — critical for Edit mode label resolution
      const valuesParam = searchParams.get('values');
      const valuesList = valuesParam ? valuesParam.split(',').filter(Boolean) : [];
      const pkConfig = config.columns.find(c => c.key === primaryKey);

      const parsedValues = valuesList.map(v => {
        if (pkConfig?.type === 'number') return useBigInt ? BigInt(v) : Number(v);
        if (pkConfig?.type === 'boolean') return v === 'true';
        return v;
      });

      if (search && parsedValues.length > 0) {
        // Search + selected values: union (label match OR pk match), scoped by base filters
        return {
          ...baseFilters,
          OR: [
            { [labelKey]: { contains: search, mode: 'insensitive' } },
            { [primaryKey]: { in: parsedValues } }
          ]
        };
      } else if (search) {
        return { ...baseFilters, [labelKey]: { contains: search, mode: 'insensitive' } };
      } else if (parsedValues.length > 0) {
        // No search — selected items must always appear. Use OR: base filters OR forced pk match.
        // This ensures pre-selected items always resolve their labels in Edit mode.
        return {
          OR: [
            baseFilters,
            { [primaryKey]: { in: parsedValues } }
          ]
        };
      }

      return baseFilters;
    };

    let records;
    try {
      records = await (db as any)[modelName].findMany({
        where: buildWhere(true), // Try BigInt first (most common for PKs)
        select: { [primaryKey]: true, [labelKey]: true },
        take: 100
      });
    } catch (e: any) {
      // Fallback to Number if field is actually an Int
      records = await (db as any)[modelName].findMany({
        where: buildWhere(false),
        select: { [primaryKey]: true, [labelKey]: true },
        take: 100
      });
    }

    const options = records.map((r: any) => ({
      value: String(r[primaryKey]), // Convert BigInt to string safely
      label: String(r[labelKey])
    }));

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error('Master data lookup error:', error.message);
    return NextResponse.json({ error: 'Failed to retrieve options' }, { status: 500 });
  }
}
