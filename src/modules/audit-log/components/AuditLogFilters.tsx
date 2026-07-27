import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const AuditLogFilters = ({ filters, onFilterChange, onSearch }: any) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-md shadow-sm border">
      <div className="flex-1">
        <label className="text-xs font-medium text-gray-500 mb-1 block">Search Activity</label>
        <Input 
          placeholder="e.g. 'Project created'..." 
          value={filters.activity_type || ''}
          onChange={(e) => onFilterChange({ ...filters, activity_type: e.target.value })}
        />
      </div>
      <div className="w-full sm:w-48">
        <label className="text-xs font-medium text-gray-500 mb-1 block">Table Name</label>
        <Input 
          placeholder="e.g. mst_project" 
          value={filters.table_name || ''}
          onChange={(e) => onFilterChange({ ...filters, table_name: e.target.value })}
        />
      </div>
      <div className="w-full sm:w-48">
        <label className="text-xs font-medium text-gray-500 mb-1 block">User ID / Email</label>
        <Input 
          placeholder="e.g. admin@coalrr.in" 
          value={filters.action_by || ''}
          onChange={(e) => onFilterChange({ ...filters, action_by: e.target.value })}
        />
      </div>
      <div className="flex items-end">
        <Button onClick={onSearch} className="w-full sm:w-auto">Apply Filters</Button>
      </div>
    </div>
  );
};
