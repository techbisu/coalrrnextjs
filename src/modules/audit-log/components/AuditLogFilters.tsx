import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Activity } from 'lucide-react';

export const AuditLogFilters = ({ filters, onFilterChange, onSearch }: any) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-0 w-full bg-slate-50/50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 p-2 sm:p-0">
      
      {/* Terminal Prompt Activity Search */}
      <div className="flex-1 flex items-center w-full px-4 h-12 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
        <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
        <input 
          placeholder="Search activity..." 
          value={filters.activity_type || ''}
          onChange={(e) => onFilterChange({ ...filters, activity_type: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0 p-0 text-sm"
        />
      </div>

      {/* Table Filter */}
      <div className="flex items-center w-full sm:w-64 px-4 h-12 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
        <Filter className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
        <input 
          placeholder="Filter by table..." 
          value={filters.table_name || ''}
          onChange={(e) => onFilterChange({ ...filters, table_name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0 p-0 text-sm"
        />
      </div>
      
      {/* User / IP Filter */}
      <div className="flex items-center w-full sm:w-64 px-4 h-12 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
        <Activity className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
        <input 
          placeholder="Filter by user..." 
          value={filters.action_by || ''}
          onChange={(e) => onFilterChange({ ...filters, action_by: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0 p-0 text-sm"
        />
      </div>

      <div className="p-2 w-full sm:w-auto shrink-0">
        <Button 
          onClick={onSearch} 
          className="w-full sm:w-auto"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};
