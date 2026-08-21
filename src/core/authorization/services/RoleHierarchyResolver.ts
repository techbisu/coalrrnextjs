import 'server-only';

/**
 * RoleHierarchyResolver
 *
 * Resolves whether a user's role satisfies a required workflow role.
 * This separates role mapping logic from the core generic guard evaluator.
 */
export class RoleHierarchyResolver {
  static matches(userRole: string, requiredRole: string): boolean {
    if (!requiredRole || requiredRole === 'all' || requiredRole === '*') return true;
    if (!userRole) return false;

    const u = userRole.trim().toLowerCase();
    const r = requiredRole.trim().toLowerCase();

    if (u === r || u.includes('admin') || u.includes('super')) return true;

    // Unit-level role hierarchy
    if (r === 'unit_office' || r === 'unit') {
      return ['unit_office', 'unit', 'surveyor', 'colliery manager', 'project manager', 'project agent', 'colliery agent', 'land clerk'].some(
        (valid) => u.includes(valid) || valid.includes(u)
      );
    }

    // Area-level role hierarchy
    if (r === 'area_office' || r === 'area') {
      return ['area_office', 'area', 'area land officer', 'aldo', 'area land cell member', 'area general manager', 'areagm', 'area gm'].some(
        (valid) => u.includes(valid) || valid.includes(u)
      );
    }

    // HQ & GM roles
    if (r === 'gm_lre') {
      return u.includes('lre') || u.includes('gm');
    }
    if (r === 'gm_planning') {
      return u.includes('planning');
    }
    if (r === 'gm_finance') {
      return u.includes('finance');
    }
    if (r === 'gm_safety') {
      return u.includes('safety');
    }
    if (r === 'board') {
      return u.includes('board') || u.includes('cmd') || u.includes('director');
    }

    return u === r || u.replace(/[-_]/g, ' ') === r.replace(/[-_]/g, ' ');
  }
}
