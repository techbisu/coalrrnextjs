import { Prisma } from '@prisma/client';
import { AuditService } from '../services/AuditService';
import { getAuditContext } from '@/lib/context/AuditContext';

// Deep diff utility
function computeJsonDiff(oldObj: any, newObj: any) {
  const diff: Record<string, { old: any; new: any }> = {};

  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

  // Fields to ignore from auditing (e.g., timestamps)
  const ignoredFields = new Set(['entry_ts', 'updt_ts']);

  for (const key of allKeys) {
    if (ignoredFields.has(key)) continue;

    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];

    // Simple strict inequality check (for deep objects/arrays, would need lodash.isEqual)
    // For Prisma models, primitive equality is usually sufficient for fields
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal };
    }
  }

  return diff;
}

export const withAuditExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'AuditExtension',
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = await query(args);
          
          const context = getAuditContext();
          AuditService.logChange(
            'CREATE',
            'database', // Could be inferred from context if provided
            model,
            (result as any).id || 'unknown',
            null,
            result,
            null,
            context
          );
          
          return result;
        },
        
        async update({ model, args, query }) {
          // 1. Fetch the old record
          const id = (args.where as any).id;
          let oldRecord = null;
          if (id) {
            oldRecord = await (client as any)[model].findUnique({ where: { id } });
          }

          // 2. Perform the update
          const result = await query(args);

          // 3. Diff and log
          const context = getAuditContext();
          const diff = computeJsonDiff(oldRecord, result);
          
          AuditService.logChange(
            'UPDATE',
            'database', 
            model,
            (result as any).id || id || 'unknown',
            oldRecord,
            result,
            diff,
            context
          );

          return result;
        },

        async delete({ model, args, query }) {
          // 1. Fetch the old record (since it's being deleted)
          const id = (args.where as any).id;
          let oldRecord = null;
          if (id) {
            oldRecord = await (client as any)[model].findUnique({ where: { id } });
          }

          // 2. Perform the delete
          const result = await query(args);

          // 3. Log
          const context = getAuditContext();
          AuditService.logChange(
            'DELETE',
            'database',
            model,
            (result as any).id || id || 'unknown',
            oldRecord,
            null,
            null,
            context
          );

          return result;
        }
      }
    }
  });
});
