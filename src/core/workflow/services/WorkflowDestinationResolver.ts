import 'server-only'
import { db } from '@/lib/db'
import type { Transition } from '../types'

export interface UserScopeResolution {
  isGlobal: boolean
  allowedAreaCds: string[]
  allowedMineCds: string[]
}

export interface DestinationMetadata {
  state: string
  label: string
  targetRole: string
}

export interface RecipientMetadata {
  required: boolean
  selectionType: 'AREA' | 'MINE' | 'CASCADE_AREA_MINE_UNIT' | 'USER' | null
  allowedAreaCds: string[]
  allowedMineCds: string[]
}

export interface ReasonMetadata {
  required: boolean
}

export interface SupportingDocumentMetadata {
  allowed: boolean
  required: boolean
}

export interface DestinationResolutionResult {
  destination: DestinationMetadata
  recipient: RecipientMetadata
  reason: ReasonMetadata
  supportingDocument: SupportingDocumentMetadata
}

export interface ValidateDestinationRequest {
  userId?: string | number
  userRole?: string
  area_cd?: string
  mine_cd?: string
  unit_cd?: string
  target_user_id?: string
  transition: Transition & { routing_type?: string; routingType?: string }
}

export class WorkflowDestinationResolver {
  /**
   * Resolves the authenticated user's allowed organizational scopes (Areas & Mines).
   * SuperAdmins / HQ roles or users with global scope return isGlobal = true.
   */
  async resolveUserAllowedScopes(userId?: string | number, role?: string): Promise<UserScopeResolution> {
    const roleClean = (role || '').toLowerCase()
    const isGlobalRole = roleClean.includes('admin') || roleClean.includes('super') || roleClean.includes('hq') || roleClean.includes('board')

    if (!userId || isGlobalRole) {
      const allAreas = await db.area.findMany({ where: { is_active: true }, select: { area_cd: true } })
      const allMines = await db.mine.findMany({ where: { is_active: true }, select: { mine_cd: true } })
      return {
        isGlobal: true,
        allowedAreaCds: allAreas.map(a => a.area_cd),
        allowedMineCds: allMines.map(m => m.mine_cd)
      }
    }

    const numUserId = typeof userId === 'number' ? userId : parseInt(String(userId), 10)
    if (isNaN(numUserId)) {
      return { isGlobal: false, allowedAreaCds: [], allowedMineCds: [] }
    }

    const userScopes = await db.user_org_scope.findMany({
      where: { user_id: numUserId },
      select: { scope_level: true, area_cd: true, mine_cd: true }
    })

    if (userScopes.length === 0) {
      const allAreas = await db.area.findMany({ where: { is_active: true }, select: { area_cd: true } })
      const allMines = await db.mine.findMany({ where: { is_active: true }, select: { mine_cd: true } })
      return {
        isGlobal: true,
        allowedAreaCds: allAreas.map(a => a.area_cd),
        allowedMineCds: allMines.map(m => m.mine_cd)
      }
    }

    const isGlobal = userScopes.some(s => s.scope_level === 'HQ' || (s.scope_level as string) === 'COMPANY')
    if (isGlobal) {
      const allAreas = await db.area.findMany({ where: { is_active: true }, select: { area_cd: true } })
      const allMines = await db.mine.findMany({ where: { is_active: true }, select: { mine_cd: true } })
      return {
        isGlobal: true,
        allowedAreaCds: allAreas.map(a => a.area_cd),
        allowedMineCds: allMines.map(m => m.mine_cd)
      }
    }

    const allowedAreaSet = new Set<string>()
    const allowedMineSet = new Set<string>()

    for (const s of userScopes) {
      if (s.area_cd) allowedAreaSet.add(s.area_cd)
      if (s.mine_cd) allowedMineSet.add(s.mine_cd)
    }

    if (allowedAreaSet.size > 0) {
      const areaMines = await db.mine.findMany({
        where: { area_cd: { in: Array.from(allowedAreaSet) }, is_active: true },
        select: { mine_cd: true }
      })
      areaMines.forEach(m => allowedMineSet.add(m.mine_cd))
    }

    return {
      isGlobal: false,
      allowedAreaCds: Array.from(allowedAreaSet),
      allowedMineCds: Array.from(allowedMineSet)
    }
  }

  /**
   * Resolves routing metadata, selection requirements, and target scopes for a candidate transition.
   */
  async resolveDestinationMetadata(
    transition: Transition & { routing_type?: string; routingType?: string },
    userId?: string | number,
    role?: string
  ): Promise<DestinationResolutionResult> {
    const routingType = ((transition as any).routingType || (transition as any).routing_type || 'FORCED').toUpperCase()
    const targetRole = transition.role || 'unit_office'
    const toState = transition.to

    const isSelectionRequired = routingType === 'USER_CHOICE' || routingType === 'ROUTED'

    let selectionType: 'AREA' | 'MINE' | 'CASCADE_AREA_MINE_UNIT' | 'USER' | null = null
    if (isSelectionRequired) {
      if (targetRole === 'area_office') {
        selectionType = 'AREA'
      } else if (targetRole === 'user' || targetRole === 'specific_user') {
        selectionType = 'USER'
      } else {
        selectionType = 'CASCADE_AREA_MINE_UNIT'
      }
    }

    const userScope = await this.resolveUserAllowedScopes(userId, role)

    const isReturn =
      transition.name.toLowerCase().includes('return') ||
      transition.name.toLowerCase().includes('reject') ||
      (transition.from !== 'Drafting' && (toState === 'Drafting' || toState === 'UnitRevision'))

    return {
      destination: {
        state: toState,
        label: `Destination Stage: ${toState}`,
        targetRole
      },
      recipient: {
        required: isSelectionRequired,
        selectionType,
        allowedAreaCds: userScope.allowedAreaCds,
        allowedMineCds: userScope.allowedMineCds
      },
      reason: {
        required: isReturn
      },
      supportingDocument: {
        allowed: true,
        required: false
      }
    }
  }

  /**
   * Server-side authoritative validation of client-supplied destination payload.
   * Enforces existence, active status, parent-child hierarchy (mine belongs to area), and user scope limits.
   */
  async validateDestination(req: ValidateDestinationRequest): Promise<{ ok: boolean; reason?: string }> {
    const { userId, userRole, area_cd, mine_cd, transition } = req
    const routingType = ((transition as any).routingType || (transition as any).routing_type || 'FORCED').toUpperCase()
    const isSelectionRequired = routingType === 'USER_CHOICE' || routingType === 'ROUTED'

    if (isSelectionRequired && !area_cd && !mine_cd) {
      return {
        ok: false,
        reason: `Destination selection (Area / Mine) is required for transition '${transition.name}'`
      }
    }

    const userScope = await this.resolveUserAllowedScopes(userId, userRole)
    if (!userScope.isGlobal) {
      if (area_cd && !userScope.allowedAreaCds.includes(area_cd)) {
        return {
          ok: false,
          reason: `Unauthorized destination: Area '${area_cd}' is outside user scope`
        }
      }
      if (mine_cd && !userScope.allowedMineCds.includes(mine_cd)) {
        return {
          ok: false,
          reason: `Unauthorized destination: Mine '${mine_cd}' is outside user scope`
        }
      }
    }

    if (area_cd) {
      const areaObj = await db.area.findUnique({ where: { area_cd } })
      if (!areaObj || areaObj.is_active === false) {
        return { ok: false, reason: `Target Area '${area_cd}' is invalid or inactive` }
      }
    }

    if (mine_cd) {
      const mineObj = await db.mine.findUnique({ where: { mine_cd } })
      if (!mineObj || mineObj.is_active === false) {
        return { ok: false, reason: `Target Mine '${mine_cd}' is invalid or inactive` }
      }

      if (area_cd && mineObj.area_cd !== area_cd) {
        return {
          ok: false,
          reason: `Hierarchy error: Mine '${mine_cd}' does not belong to Area '${area_cd}'`
        }
      }
    }

    return { ok: true }
  }
}

export const workflowDestinationResolver = new WorkflowDestinationResolver()
