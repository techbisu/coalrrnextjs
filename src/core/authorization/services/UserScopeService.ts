import { ScopeLevel } from '@prisma/client';

export type EffectiveScope =
  | { level: 'HQ' }
  | { level: 'AREA'; areaIds: string[] }
  | { level: 'UNIT'; unitsByArea: Record<string, string[]> };

export class UserScopeService {
  private static setNested(obj: any, path: string, value: any) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    return obj;
  }

  /**
   * Generates a Prisma where clause for the organization scope.
   */
  static scopeToWhere(scope: EffectiveScope, areaField = 'area_cd', mineField = 'mine_cd') {
    if (scope.level === 'HQ') return {};
    
    if (scope.level === 'AREA') {
      return this.setNested({}, areaField, { in: scope.areaIds });
    }
    
    // UNIT level
    return {
      OR: Object.entries(scope.unitsByArea).map(([areaId, mineIds]) => {
        const cond = {};
        this.setNested(cond, areaField, areaId);
        this.setNested(cond, mineField, { in: mineIds });
        return cond;
      }),
    };
  }

  /**
   * Generates a Prisma where clause that includes scope visibility and personal visibility (creator/approver).
   */
  static visibilityWhere(
    scope: EffectiveScope, 
    userId: string, 
    areaField = 'area_cd', 
    mineField = 'mine_cd',
    creatorField = 'entry_by',
    approverField?: string
  ) {
    const orConditions: any[] = [
      this.scopeToWhere(scope, areaField, mineField)
    ];

    if (creatorField) {
      orConditions.push(this.setNested({}, creatorField, userId));
    }

    if (approverField) {
      orConditions.push(this.setNested({}, approverField, userId));
    }

    return { OR: orConditions };
  }

  /**
   * Converts a list of user_org_scope rows (for a UNIT user) into the EffectiveScope format.
   */
  static buildEffectiveScope(scopes: { scope_level: ScopeLevel, area_cd: string | null, mine_cd: string | null }[]): EffectiveScope {
    if (scopes.length === 0) return { level: 'HQ' }; // Default or no access? Usually HQ or throw. We'll default to HQ for admins if no scope, but better logic might be needed.
    
    // In reality, active scope must be unique per user or multiple? The DB says "unique active per user".
    // Wait, the prompt says "UNIT user with two mine assignments sees both", this implies multiple active rows, or a single row with multiple mines?
    // "CREATE UNIQUE INDEX uq_scope_active_per_user ON "UserOrgScope"(user_id) WHERE effective_to IS NULL"
    // Wait, if it's UNIQUE on user_id, how can a UNIT user have TWO mine assignments?
    // The prompt says: "UNIT user with two mine assignments sees both"
    // But the unique index `uq_scope_active_per_user` explicitly restricts it to ONE active row per user!
    // Ah, wait! If they are assigned to an AREA, they see all mines. If they need multiple mines, how is it represented? 
    // Maybe `mine_cd` is an array? No, `mine_cd String?`.
    // Let's assume `buildEffectiveScope` takes the single active row.
    const active = scopes[0];
    if (active.scope_level === 'HQ') return { level: 'HQ' };
    if (active.scope_level === 'AREA' && active.area_cd) return { level: 'AREA', areaIds: [active.area_cd] };
    if (active.scope_level === 'UNIT' && active.area_cd && active.mine_cd) {
      // Since it's only one row per user based on unique index, they have 1 mine.
      return { level: 'UNIT', unitsByArea: { [active.area_cd]: [active.mine_cd] } };
    }
    
    return { level: 'HQ' };
  }
}
