import 'server-only';
import { PermissionResolver } from './PermissionResolver';
import { RoleHierarchyResolver } from './RoleHierarchyResolver';

export type ActionType = 'TRANSITION' | 'DOCUMENT_GENERATION' | 'DOCUMENT_SIGNATURE' | 'PREREQUISITE' | 'GENERAL_EDIT';

export interface ActionEligibilityContext {
  moduleCode: string;
  entityType: string;
  actionType: ActionType;
  targetCode: string; // e.g. transition name, template code, or generic action
  userContext: {
    userId?: string;
    roles?: string[];
    permissions?: string[];
  };
  requiredRole?: string;
  requiredPermission?: string;
}

export type ActionClassification = 'ACTIONABLE_BY_ME' | 'WAITING_ON_ASSIGNEE' | 'BLOCKED_BY_PREREQUISITE' | 'NOT_AUTHORIZED' | 'COMPLETED';

export interface ActionEligibilityResult {
  isAuthorized: boolean;
  classification: ActionClassification;
}

/**
 * ActionEligibilityResolver
 * 
 * Generic service to evaluate if a user is authorized to perform a specific workflow action.
 * Maps module codes and contexts to standard permissions or role checks.
 */
export class ActionEligibilityResolver {
  /**
   * Determine if the current user can execute the specified action.
   */
  static evaluate(ctx: ActionEligibilityContext): ActionEligibilityResult {
    const roles = ctx.userContext.roles || [];
    const perms = ctx.userContext.permissions || [];
    const isAdmin = roles.some(r => r.toLowerCase().includes('admin') || r.toLowerCase().includes('super')) || perms.includes('*');

    if (isAdmin) {
      return { isAuthorized: true, classification: 'ACTIONABLE_BY_ME' };
    }

    let isAuthorized = false;

    switch (ctx.actionType) {
      case 'TRANSITION':
        // For transitions, we check the role mapped to the transition.
        if (ctx.requiredRole) {
          isAuthorized = roles.some(r => RoleHierarchyResolver.matches(r, ctx.requiredRole!));
        } else {
          // If no role required, default to true or check generic transition permission
          isAuthorized = true;
        }
        break;

      case 'DOCUMENT_GENERATION':
      case 'GENERAL_EDIT':
        // For generating documents or editing facts, user needs 'edit' permission on the module
        const editPerms = PermissionResolver.resolveActionPermissions(ctx.moduleCode, 'edit');
        isAuthorized = editPerms.some(p => perms.includes(p));
        break;

      case 'DOCUMENT_SIGNATURE':
        // For signatures, checking specifically requested signature permission
        if (ctx.requiredPermission) {
          isAuthorized = perms.includes(ctx.requiredPermission);
        } else {
          // Fallback to review/approve perm
          const reviewPerms = PermissionResolver.resolveActionPermissions(ctx.moduleCode, 'review');
          isAuthorized = reviewPerms.some(p => perms.includes(p));
        }
        break;

      case 'PREREQUISITE':
        // Prerequisites usually resolve to true if you have edit access, as it's just filling out forms
        const prereqPerms = PermissionResolver.resolveActionPermissions(ctx.moduleCode, 'edit');
        isAuthorized = prereqPerms.some(p => perms.includes(p));
        break;
    }

    return {
      isAuthorized,
      classification: isAuthorized ? 'ACTIONABLE_BY_ME' : 'WAITING_ON_ASSIGNEE'
    };
  }
}
