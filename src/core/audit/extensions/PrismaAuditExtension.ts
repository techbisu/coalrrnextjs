import { Prisma } from '@prisma/client'
// dynamically import auth to avoid circular dependency with db
import { Audit } from '@/core/audit/services/AuditService'
import { getRealIp } from '@/core/audit/utils/getRealIp'

import { auditConfig } from '@/core/config/audit.config'

const EXCLUDED_MODELS = auditConfig.excludedModels;
const NO_AUDIT_FIELDS_MODELS = auditConfig.noAuditFieldsModels;

export const withAuditExtension = Prisma.defineExtension({
  name: 'PrismaAuditExtension',
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        let userId = 'system';
        let ipAddress: string | null = null;
        let userAgent: string | null = null;
        
        try {
          const auth = await import('@/lib/auth');
          const u = await auth.getCurrentUser();
          if (u) userId = u.id;
          
          const { headers } = await import('next/headers');
          const h = await headers();
          ipAddress = await getRealIp();
          
          userAgent = h.get('user-agent') || null;
        } catch(e) {}
        
        const modelName = String(model).toLowerCase();
        const skipInject = NO_AUDIT_FIELDS_MODELS.includes(modelName) || NO_AUDIT_FIELDS_MODELS.includes(model as string);

        if (args.data && !skipInject) {
           const dmmfModel = Prisma.dmmf.datamodel.models.find(m => m.name === model);
           const isCamel = dmmfModel?.fields.some(f => f.name === 'entryBy') ?? false;

           if ((model === 'document_instance') && !(args.data as any).id) {
               (args.data as any).id = require('crypto').randomUUID();
           }

           if (isCamel) {
             (args.data as any).entryBy = userId;
             (args.data as any).updtBy = userId;
             if (!(args.data as any).entryTs) (args.data as any).entryTs = Math.floor(Date.now() / 1000);
             if (!(args.data as any).updtTs) (args.data as any).updtTs = Math.floor(Date.now() / 1000);
           } else {
             (args.data as any).entry_by = userId;
             (args.data as any).updt_by = userId;
             if (!(args.data as any).entry_ts) (args.data as any).entry_ts = new Date();
             if (!(args.data as any).updt_ts) (args.data as any).updt_ts = new Date();
           }
        }
        
        const result = await query(args);
        
        if (!EXCLUDED_MODELS.includes(modelName) && !EXCLUDED_MODELS.includes(model as string)) {
          Audit.updateRecord(
            model,
            'CREATE',
            undefined, // conditions
            undefined, // oldData
            result,    // newData
            userId,
            ipAddress ?? undefined,
            userAgent ?? undefined
          ).catch(console.error);
        }
        
        return result;
      },
      
      async update({ model, operation, args, query }) {
        let userId = 'system';
        let ipAddress: string | null = null;
        let userAgent: string | null = null;

        try {
          const auth = await import('@/lib/auth');
          const u = await auth.getCurrentUser();
          if (u) userId = u.id;
          
          const { headers } = await import('next/headers');
          const h = await headers();
          ipAddress = await getRealIp();

          userAgent = h.get('user-agent') || null;
        } catch(e) {}
        
        const modelName = String(model).toLowerCase();
        const skipInject = NO_AUDIT_FIELDS_MODELS.includes(modelName) || NO_AUDIT_FIELDS_MODELS.includes(model as string);

        if (args.data && !skipInject) {
           const dmmfModel = Prisma.dmmf.datamodel.models.find(m => m.name === model);
           const isCamel = dmmfModel?.fields.some(f => f.name === 'entryBy' || f.name === 'updtBy') ?? false;

           if (isCamel) {
             (args.data as any).updtBy = userId;
             if (!(args.data as any).updtTs) (args.data as any).updtTs = Math.floor(Date.now() / 1000);
           } else {
             (args.data as any).updt_by = userId;
             if (!(args.data as any).updt_ts) (args.data as any).updt_ts = new Date();
           }
        }
        
        const result = await query(args);
        
        if (!EXCLUDED_MODELS.includes(modelName) && !EXCLUDED_MODELS.includes(model as string)) {
          Audit.updateRecord(
            model,
            'UPDATE',
            (args as any).where,
            undefined, // oldData
            result,    // newData
            userId,
            ipAddress ?? undefined,
            userAgent ?? undefined
          ).catch(console.error);
        }
        
        return result;
      },
      
      async delete({ model, operation, args, query }) {
        let userId = 'system';
        let ipAddress: string | null = null;
        let userAgent: string | null = null;

        try {
          const auth = await import('@/lib/auth');
          const u = await auth.getCurrentUser();
          if (u) userId = u.id;
          
          const { headers } = await import('next/headers');
          const h = await headers();
          ipAddress = await getRealIp();

          userAgent = h.get('user-agent') || null;
        } catch(e) {}
        
        const result = await query(args);
        
        const modelName = String(model).toLowerCase();
        if (!EXCLUDED_MODELS.includes(modelName) && !EXCLUDED_MODELS.includes(model as string)) {
          Audit.updateRecord(
            model,
            'DELETE',
            (args as any).where,
            result,    // oldData
            undefined, // newData
            userId,
            ipAddress ?? undefined,
            userAgent ?? undefined
          ).catch(console.error);
        }
        
        return result;
      }
    }
  }
})
