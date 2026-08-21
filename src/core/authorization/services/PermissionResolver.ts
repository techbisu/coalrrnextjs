import { normalizeModuleCode, MODULE_CODES } from '@/core/config/module-codes.config';
import type { AuthUser } from '@/lib/auth';

export type StandardAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'review'
  | 'sign'
  | 'transition'
  | 'approve';

/**
 * PermissionResolver
 *
 * Single source of truth for mapping module codes and actions to canonical permission keys.
 * Eliminates hardcoded permission strings across generic API routes and core services.
 */
export class PermissionResolver {
  /**
   * Resolves the list of permission keys that satisfy viewing access for a given module.
   */
  static resolveViewPermissions(moduleCode: string): string[] {
    const canonicalModule = normalizeModuleCode(moduleCode);

    switch (canonicalModule) {
      case MODULE_CODES.LAND_SCHEDULE:
        return [
          'proposal.view',
          'acquisition.view',
          'land_schedule.view',
          'project.view',
        ];
      case MODULE_CODES.COMPENSATION_PAYROLL:
        return ['payroll.view', 'compensation.view', 'project.view'];
      case MODULE_CODES.EMPLOYMENT_APP:
        return ['employment.view', 'claim.view', 'project.view'];
      case MODULE_CODES.FORM_I_CLAIM:
        return ['claim.view', 'project.view'];
      default: {
        const lower = (canonicalModule || moduleCode).toLowerCase().replace(/_/g, '.');
        return [`${lower}.view`, 'project.view'];
      }
    }
  }

  /**
   * Resolves the list of permission keys that satisfy an action for a given module.
   */
  static resolveActionPermissions(moduleCode: string, action: StandardAction | string): string[] {
    const canonicalModule = normalizeModuleCode(moduleCode);
    const act = action.toLowerCase();

    switch (canonicalModule) {
      case MODULE_CODES.LAND_SCHEDULE:
        if (act === 'edit' || act === 'create' || act === 'save') {
          return ['proposal.edit', 'acquisition.edit', 'land_schedule.edit'];
        }
        if (act === 'review' || act === 'approve') {
          return ['proposal.approve', 'acquisition.approve', 'proposal.review', 'workflow.approve'];
        }
        if (act === 'sign') {
          return ['document.sign', 'proposal.sign', 'workflow.approve'];
        }
        if (act === 'transition') {
          return ['proposal.edit', 'proposal.approve', 'acquisition.approve', 'workflow.approve'];
        }
        return [`proposal.${act}`, `acquisition.${act}`];

      case MODULE_CODES.COMPENSATION_PAYROLL:
        if (act === 'edit' || act === 'create') return ['payroll.edit', 'compensation.edit'];
        if (act === 'review' || act === 'approve') return ['payroll.approve', 'compensation.approve'];
        return [`payroll.${act}`];

      case MODULE_CODES.EMPLOYMENT_APP:
        if (act === 'edit' || act === 'create') return ['employment.edit', 'claim.edit'];
        if (act === 'review' || act === 'approve') return ['employment.approve', 'claim.approve'];
        return [`employment.${act}`];

      default: {
        const lower = (canonicalModule || moduleCode).toLowerCase().replace(/_/g, '.');
        return [`${lower}.${act}`, 'workflow.approve'];
      }
    }
  }

  /**
   * Checks if an authenticated user possesses access for the given module action.
   */
  static hasPermission(
    user: AuthUser | null | undefined,
    moduleCode: string,
    action: StandardAction | string
  ): boolean {
    if (!user) return false;

    const userPerms = user.permissions || [];
    const userRoles = user.roles || [];

    // 1. Super Admin / Admin wildcard override
    if (
      userPerms.includes('*') ||
      userRoles.some((r) => {
        const clean = r.toLowerCase().replace(/[^a-z0-9]/g, '');
        return clean.includes('admin') || clean.includes('super');
      })
    ) {
      return true;
    }

    // 2. Resolve required keys
    const requiredPerms =
      action === 'view'
        ? this.resolveViewPermissions(moduleCode)
        : this.resolveActionPermissions(moduleCode, action);

    // 3. Match against user's actual permission array
    return requiredPerms.some((req) => userPerms.includes(req));
  }
}

export const permissionResolver = PermissionResolver;
