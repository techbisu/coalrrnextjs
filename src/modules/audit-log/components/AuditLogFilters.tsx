import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Search, Filter, Activity, X } from 'lucide-react';

export const AuditLogFilters = ({ filters, onFilterChange, onSearch }: any) => {
  const [localFilters, setLocalFilters] = useState({
    activity_type: filters.activity_type || '',
    table_name: filters.table_name || '',
    action_by: filters.action_by || ''
  });

  const hasFilters = localFilters.activity_type || localFilters.table_name || localFilters.action_by;

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, ...localFilters, page: 1 });
      onSearch();
    }, 400);
    return () => clearTimeout(timer);
  }, [localFilters]);

  const clearFilters = () => {
    setLocalFilters({ activity_type: '', table_name: '', action_by: '' });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-0 w-full bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 p-2 sm:p-0">
      
      {/* Search Activity */}
      <div className="flex-1 flex items-center w-full px-4 h-12 sm:border-r border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
        <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
        <input 
          placeholder="Search event type..." 
          value={localFilters.activity_type}
          onChange={(e) => setLocalFilters(p => ({ ...p, activity_type: e.target.value }))}
          className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0 p-0 text-sm"
        />
      </div>

      {/* Filter by Table */}
      <div className="flex items-center w-full sm:w-64 px-4 h-12 sm:border-r border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
        <Filter className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
        <input 
          placeholder="Filter by table..." 
          value={localFilters.table_name}
          onChange={(e) => setLocalFilters(p => ({ ...p, table_name: e.target.value }))}
          className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0 p-0 text-sm"
        />
      </div>
      
      {/* Filter by User */}
      <div className="flex items-center w-full sm:w-64 px-4 h-12 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
        <Activity className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
        <input 
          placeholder="Filter by actor ID..." 
          value={localFilters.action_by}
          onChange={(e) => setLocalFilters(p => ({ ...p, action_by: e.target.value }))}
          className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0 p-0 text-sm"
        />
      </div>

      {/* Clear Button (only if active) */}
      <div className="px-2 h-12 flex items-center justify-end border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 min-w-[4rem]">
        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearFilters}
            className="h-8 text-slate-500 hover:text-slate-900 dark:hover:text-white px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
