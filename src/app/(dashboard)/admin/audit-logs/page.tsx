import { Suspense } from 'react';
import { AuditLogPageClient } from '../../audit-logs/AuditLogPageClient';
import { fetchAuditLogsAction } from '@/modules/audit-log/actions';
import { BackButton } from '@/components/ui/back-button';

export const metadata = {
  title: 'Audit Logs - Administration',
  description: 'View system audit logs and data modifications',
};

export default async function AuditLogsPage() {
  // Pre-fetch initial data to SSR the first page
  let initialData: any = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  
  try {
    initialData = await fetchAuditLogsAction({ page: 1, limit: 20 });
  } catch (error) {
    console.error('Failed to pre-fetch audit logs:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <BackButton iconOnly />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
          <p className="text-muted-foreground">Comprehensive overview of system activity and user actions.</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading interface...</div>}>
        <AuditLogPageClient initialData={initialData} />
      </Suspense>
    </div>
  );
}
