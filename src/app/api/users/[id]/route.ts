import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    let user: any = null
    const numId = Number(id)

    if (!isNaN(numId)) {
      user = await db.user.findUnique({
        where: { id: numId },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          designation: true,
          tenant_id: true,
          user_org_scopes: {
            include: {
              area: { select: { area_en: true } },
              mine: { select: { mine_en: true } },
            },
          },
        },
      })
    } else {
      user = await db.user.findFirst({
        where: {
          OR: [
            { email: id },
            { name: id },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          designation: true,
          tenant_id: true,
          user_org_scopes: {
            include: {
              area: { select: { area_en: true } },
              mine: { select: { mine_en: true } },
            },
          },
        },
      })
    }

    // Fetch user_org_scopes ordered by created_at DESC so the latest active assignment is prioritized
    const scopeRecords = await (db as any).user_org_scope.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      include: {
        area: { select: { area_en: true, area_cd: true } },
        mine: { select: { mine_en: true, mine_cd: true } },
      },
    }).catch(() => [])

    // Find latest active scope (effective_to is null) or fallback to latest entry
    const activeScope = scopeRecords.find((s: any) => !s.effective_to) || scopeRecords[0]

    let areaName: string | undefined = undefined
    let collieryName: string | undefined = undefined

    if (activeScope) {
      // Resolve Area Name
      if (activeScope.area?.area_en) {
        areaName = activeScope.area.area_en
      } else if (activeScope.area_cd) {
        const areaDbRow = await (db as any).area.findFirst({
          where: { OR: [{ area_cd: activeScope.area_cd }, { area_en: { equals: activeScope.area_cd, mode: 'insensitive' } }] },
          select: { area_en: true },
        }).catch(() => null)
        areaName = areaDbRow?.area_en || activeScope.area_cd
      }

      // Resolve Colliery / Unit Name
      if (activeScope.scope_level === 'UNIT') {
        if (activeScope.mine?.mine_en) {
          collieryName = activeScope.mine.mine_en
        } else if (activeScope.mine_cd) {
          const mineDbRow = await (db as any).mine.findFirst({
            where: { OR: [{ mine_cd: activeScope.mine_cd }, { mine_en: { equals: activeScope.mine_cd, mode: 'insensitive' } }] },
            select: { mine_en: true },
          }).catch(() => null)
          collieryName = mineDbRow?.mine_en || activeScope.mine_cd
        }

        if (collieryName && collieryName === areaName) {
          collieryName = undefined
        }
      } else if (activeScope.scope_level === 'HQ') {
        areaName = 'HQ / Corporate'
        collieryName = undefined
      } else if (activeScope.scope_level === 'AREA') {
        collieryName = undefined
      }
    }

    // Fetch user's assigned RBAC role display name
    const userRoleRows = await (db as any).model_has_role.findMany({
      where: { model_id: user.id.toString(), model_type: 'user' },
      include: { role: { select: { name: true, display_name: true } } },
    }).catch(() => [])

    const roleName = userRoleRows[0]?.role?.display_name || userRoleRows[0]?.role?.name || undefined

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email || undefined,
      mobile: user.mobile || undefined,
      designation: user.designation || undefined,
      role_name: roleName,
      tenant_id: user.tenant_id || undefined,
      scope_level: activeScope?.scope_level || undefined,
      area_name: areaName,
      colliery_name: collieryName,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
