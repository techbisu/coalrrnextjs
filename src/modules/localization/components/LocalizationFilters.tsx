'use client';

import { useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Search, X } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { searchParamsParsers } from './search-params';

interface LocalizationFiltersProps {
  modules: string[];
  currentModule: string;
  currentSearch: string;
}

export function LocalizationFilters({ modules, currentModule, currentSearch }: LocalizationFiltersProps) {
  const [module, setModule] = useQueryState('module', searchParamsParsers.module.withOptions({ shallow: false }));
  const [search, setSearch] = useQueryState('search', searchParamsParsers.search.withOptions({ shallow: false, throttleMs: 300 }));
  const [page, setPage] = useQueryState('page', searchParamsParsers.page.withOptions({ shallow: false }));

  const handleModuleChange = (val: string) => {
    setModule(val === 'all' ? null : val);
    setPage(1); // Reset to page 1 on filter change
  };

  const clearFilters = () => {
    setSearch(null);
    setModule(null);
    setPage(1);
  };

  // We use the direct search state from the URL here for the input value.
  // Nuqs handles throttling internally via throttleMs, so we don't need a local state + useDebounce.
  
  const hasActiveFilters = (module && module !== 'all') || search;

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search keys or values..." 
            value={search || ''}
            onChange={(e) => setSearch(e.target.value || null)}
            className="pl-9 max-w-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Select value={currentModule} onValueChange={handleModuleChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="px-3">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
