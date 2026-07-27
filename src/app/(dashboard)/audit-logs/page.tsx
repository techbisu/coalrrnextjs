import { Suspense } from 'react';
import { AuditLogPageClient } from './AuditLogPageClient';
import { fetchAuditLogsAction } from '@/modules/audit-log/actions';

export const metadata = {
  title: 'Audit Logs - Administration',
  description: 'View system audit logs and data modifications',
};

export default async function AuditLogsPage() {
  // Pre-fetch initial data to SSR the first page
  let initialData = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  
  try {
    initialData = await fetchAuditLogsAction({ page: 1, limit: 20 });
  } catch (error) {
    console.error('Failed to pre-fetch audit logs:', error);
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
        <p className="text-gray-500 text-sm">Review activity events and data changes across the application.</p>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading interface...</div>}>
        <AuditLogPageClient initialData={initialData} />
      </Suspense>
    </div>
  );
}
