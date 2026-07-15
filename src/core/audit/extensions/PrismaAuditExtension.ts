import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { Audit } from '@/core/audit'

const EXCLUDED_MODELS = ['audit_logs', 'audit_changes', 'audit_sessions', 'auth_session', 'user', 'audit_api_logs', 'audit_security_logs', 'audit_download_logs', 'audit_exception_logs', 'audit_login_attempts'];

export const withAuditExtension = Prisma.defineExtension({
  name: 'PrismaAuditExtension',
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        let userId = 'system';
        try {
          const u = await getCurrentUser();
          if (u) userId = u.id;
        } catch(e) {}
        
        if (args.data) {
           (args.data as any).entry_by = userId;
           (args.data as any).updt_by = userId;
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
          const u = await getCurrentUser();
          if (u) userId = u.id;
        } catch(e) {}
        
        if (args.data) {
           (args.data as any).updt_by = userId;
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
          const u = await getCurrentUser();
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
