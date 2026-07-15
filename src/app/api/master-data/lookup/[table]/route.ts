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

    // Build Prisma query dynamically
    const whereClause = search ? {
      [labelKey]: { contains: search, mode: 'insensitive' }
    } : {};

    const records = await (db as any)[modelName].findMany({
      where: whereClause,
      select: { [primaryKey]: true, [labelKey]: true },
      take: 100
    });

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
