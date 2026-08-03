'use client';

import React, { useState } from 'react';
import { AuditLogFilters } from '@/modules/audit-log/components/AuditLogFilters';
import { AuditLogTable } from '@/modules/audit-log/components/AuditLogTable';
import { fetchAuditLogsAction } from '@/modules/audit-log/actions';
import { toast } from 'sonner';

export const AuditLogPageClient = ({ initialData }: { initialData: any }) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    activity_type: '',
    table_name: '',
    action_by: ''
  });

  const loadData = async (currentFilters: any) => {
    setLoading(true);
    try {
      const result = await fetchAuditLogsAction(currentFilters);
      setData(result);
    } catch (error: any) {
      toast.error('Failed to load audit logs', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const newFilters = { ...filters, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    loadData(newFilters);
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col text-sm">
      <AuditLogFilters 
        filters={filters} 
        onFilterChange={setFilters} 
        onSearch={handleSearch} 
      />
      <div className="p-4 bg-white dark:bg-slate-950">
        <AuditLogTable 
          data={data?.data || []} 
          loading={loading}
          currentPage={data?.page || 1}
          totalPages={data?.totalPages || 0}
          totalRecords={data?.total || 0}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};
