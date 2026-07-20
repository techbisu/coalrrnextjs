import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const areas = await db.area_master.findMany({
      where: { is_active: true },
      select: { area_cd: true, area_en: true },
      orderBy: { area_en: 'asc' }
    })
    return NextResponse.json(areas)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
