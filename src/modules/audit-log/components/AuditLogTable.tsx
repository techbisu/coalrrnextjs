import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { DataTable, type Column } from '@/shared/components/coalrr';
import { AuditDetailModal } from './AuditDetailModal';
import { Eye, Plus, Pen, Trash2, Activity } from 'lucide-react';

export const AuditLogTable = ({ data, onPageChange, currentPage, totalRecords, loading }: any) => {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const getActivityStyle = (activity: string) => {
    const act = activity.toLowerCase();
    if (act.includes('create') || act.includes('insert')) return {
      color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200/50 dark:border-emerald-400/20',
      icon: <Plus className="w-3 h-3 mr-1" />
    };
    if (act.includes('delete') || act.includes('remove')) return {
      color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 border-rose-200/50 dark:border-rose-400/20',
      icon: <Trash2 className="w-3 h-3 mr-1" />
    };
    if (act.includes('update') || act.includes('modify')) return {
      color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200/50 dark:border-blue-400/20',
      icon: <Pen className="w-3 h-3 mr-1" />
    };
    return {
      color: 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700',
      icon: <Activity className="w-3 h-3 mr-1" />
    };
  };

  const columns: Column<any>[] = [
    {
      key: 'timestamp',
      header: 'TIME',
      render: (log) => {
        if (!log.entry_ts) return <span className="text-slate-400">-</span>;
        const date = new Date(log.entry_ts);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-800 dark:text-slate-200 font-medium text-sm whitespace-nowrap">
              {format(date, 'MMM dd, yyyy')}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
              {format(date, 'HH:mm:ss')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'activity',
      header: 'EVENT',
      render: (log) => {
        const style = getActivityStyle(log.activity);
        return (
          <Badge variant="outline" className={`font-medium tracking-wide rounded-md py-1 px-2.5 ${style.color}`}>
            <span className="flex items-center">
              {style.icon}
              {log.activity.toUpperCase()}
            </span>
          </Badge>
        );
      },
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
          <span className="text-slate-800 dark:text-slate-200 font-medium">{log.action_by || 'System'}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 w-fit">
            {log.ip_address}
          </span>
        </div>
      ),
    },
    {
      key: 'details',
      header: '',
      render: (log) => (
        <div className="flex justify-end pr-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedLog(log)}
            className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 h-8 font-medium transition-colors"
          >
            <Eye className="mr-2 w-4 h-4" />
            View Details
          </Button>
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
