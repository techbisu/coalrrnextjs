import { AsyncLocalStorage } from 'async_hooks';
import { AuditContext } from '@/audit/services/AuditService';

export const auditContextStorage = new AsyncLocalStorage<AuditContext>();

/**
 * Wraps a function execution with an AuditContext.
 * Any Prisma queries executed inside `fn` will have access to this context automatically.
 */
export function withAuditContext<T>(context: AuditContext, fn: () => Promise<T> | T): Promise<T> | T {
  return auditContextStorage.run(context, fn);
}

/**
 * Retrieve the current AuditContext. Returns an empty object if called outside `withAuditContext`.
 */
export function getAuditContext(): AuditContext {
  return auditContextStorage.getStore() || {};
}
