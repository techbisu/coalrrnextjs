import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { DataTable, type Column } from '@/shared/components/coalrr';
import { AuditDetailModal } from './AuditDetailModal';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/shared/components/ui/dropdown-menu';
import { MoreHorizontal, Eye } from 'lucide-react';

export const AuditLogTable = ({ data, onPageChange, currentPage, totalRecords, loading }: any) => {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const getActivityColor = (activity: string) => {
    const act = activity.toLowerCase();
    if (act.includes('create') || act.includes('insert')) return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20';
    if (act.includes('delete') || act.includes('remove')) return 'text-rose-700 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20';
    if (act.includes('update') || act.includes('modify')) return 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-400/10 dark:border-blue-400/20';
    return 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700';
  };

  const columns: Column<any>[] = [
    {
      key: 'timestamp',
      header: 'TIME',
      render: (log) => (
        <span className="text-slate-500 font-mono text-xs whitespace-nowrap">
          {log.entry_ts ? format(new Date(log.entry_ts), 'yyyy-MM-dd HH:mm:ss') : '-'}
        </span>
      ),
    },
    {
      key: 'activity',
      header: 'EVENT',
      render: (log) => (
        <Badge variant="outline" className={`font-mono text-[10px] font-semibold tracking-wider rounded-md py-1 px-2 ${getActivityColor(log.activity)}`}>
          {log.activity.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'table',
      header: 'TARGET',
      render: (log) => <span className="text-slate-600 dark:text-slate-400 font-medium">{log.table_name || 'N/A'}</span>,
    },
    {
      key: 'actor',
      header: 'ACTOR',
      render: (log) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-700 dark:text-slate-300 font-medium">{log.action_by || 'System'}</span>
          <span className="text-[11px] text-slate-500 font-mono">{log.ip_address}</span>
        </div>
      ),
    },
    {
      key: 'details',
      header: '',
      render: (log) => (
        <div className="flex justify-end pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedLog(log)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                Inspect Payload
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
