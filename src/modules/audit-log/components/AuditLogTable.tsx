import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/coalrr';
import { AuditDetailModal } from './AuditDetailModal';

export const AuditLogTable = ({ data, onPageChange, currentPage, totalRecords, loading }: any) => {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const columns: Column<any>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log) => log.entry_ts ? format(new Date(log.entry_ts), 'yyyy-MM-dd HH:mm:ss') : '-',
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (log) => <span className="font-medium text-gray-800">{log.activity}</span>,
    },
    {
      key: 'table',
      header: 'Table',
      render: (log) => <Badge variant="outline" className="font-mono bg-white">{log.table_name || 'N/A'}</Badge>,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (log) => (
        <div className="flex flex-col">
          <span className="text-gray-800">{log.action_by || 'System'}</span>
          <span className="text-xs text-gray-400 font-mono">{log.ip_address}</span>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (log) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
          View
        </Button>
      ),
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        loading={loading}
        serverSide={true}
        totalRecords={totalRecords || 0}
        currentPage={currentPage}
        onPageChange={onPageChange}
        searchable={false}
        pageSize={20}
      />
      <AuditDetailModal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        log={selectedLog} 
      />
    </div>
  );
};
