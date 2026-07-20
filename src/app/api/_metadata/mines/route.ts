import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const mines = await db.mine_master.findMany({
      where: { is_active: true },
      select: { mine_cd: true, mine_en: true, area_cd: true },
      orderBy: { mine_en: 'asc' }
    })
    return NextResponse.json(mines)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
