import { Prisma } from '@prisma/client'
// dynamically import auth to avoid circular dependency with db
import { Audit } from '@/core/audit'

const EXCLUDED_MODELS = ['audit_logs', 'audit_changes', 'audit_sessions', 'auth_session', 'user', 'audit_api_logs', 'audit_security_logs', 'audit_download_logs', 'audit_exception_logs', 'audit_login_attempts'];
const NO_AUDIT_FIELDS_MODELS = ['user_org_scope', 'model_has_role', 'role_has_permission', 'role', 'permission', 'auth_session'];

export const withAuditExtension = Prisma.defineExtension({
  name: 'PrismaAuditExtension',
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        let userId = 'system';
        try {
          const auth = await import('@/lib/auth');
          const u = await auth.getCurrentUser();
          if (u) userId = u.id;
        } catch(e) {}
        
        const modelName = String(model).toLowerCase();
        const skipInject = NO_AUDIT_FIELDS_MODELS.includes(modelName) || NO_AUDIT_FIELDS_MODELS.includes(model as string);

        if (args.data && !skipInject) {
           if ((model === 'document_instance' || model === 'document_audit_log') && !(args.data as any).id) {
               (args.data as any).id = require('crypto').randomUUID();
           }
           (args.data as any).entry_by = userId;
           (args.data as any).updt_by = userId;
           if (!(args.data as any).entry_ts) (args.data as any).entry_ts = new Date();
           if (!(args.data as any).updt_ts) (args.data as any).updt_ts = new Date();
        }
        
        const result = await query(args);
        
        if (!EXCLUDED_MODELS.includes(model)) {
          Audit.activity({
            event: 'CREATE',
            module: 'system',
            entityType: model,
            entityId: (result as any).id || (result as any).code || 'unknown',
            description: `Created new ${model}`,
            metadata: { user_id: userId, newData: result }
          }).catch(console.error);
        }
        
        return result;
      },
      
      async update({ model, operation, args, query }) {
        let userId = 'system';
        try {
          const auth = await import('@/lib/auth');
          const u = await auth.getCurrentUser();
          if (u) userId = u.id;
        } catch(e) {}
        
        const modelName = String(model).toLowerCase();
        const skipInject = NO_AUDIT_FIELDS_MODELS.includes(modelName) || NO_AUDIT_FIELDS_MODELS.includes(model as string);

        if (args.data && !skipInject) {
           (args.data as any).updt_by = userId;
           if (!(args.data as any).updt_ts) (args.data as any).updt_ts = new Date();
        }
        
        const result = await query(args);
        
        if (!EXCLUDED_MODELS.includes(model)) {
          Audit.activity({
            event: 'UPDATE',
            module: 'system',
            entityType: model,
            entityId: (result as any).id || (result as any).code || 'unknown',
            description: `Updated ${model}`,
            metadata: { user_id: userId, newData: result }
          }).catch(console.error);
        }
        
        return result;
      },
      
      async delete({ model, operation, args, query }) {
        let userId = 'system';
        try {
          const auth = await import('@/lib/auth');
          const u = await auth.getCurrentUser();
          if (u) userId = u.id;
        } catch(e) {}
        
        const result = await query(args);
        
        if (!EXCLUDED_MODELS.includes(model)) {
          Audit.activity({
            event: 'DELETE',
            module: 'system',
            entityType: model,
            entityId: (result as any).id || (result as any).code || 'unknown',
            description: `Deleted ${model}`,
            metadata: { user_id: userId, oldData: result }
          }).catch(console.error);
        }
        
        return result;
      }
    }
  }
})
