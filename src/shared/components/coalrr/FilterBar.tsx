import * as React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  onClearFilters?: () => void
  hasActiveFilters?: boolean
  children?: React.ReactNode
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onClearFilters,
  hasActiveFilters,
  children,
  className,
  ...props
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-card border rounded-lg shadow-sm transition-all duration-200", className)} {...props}>
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background focus-visible:ring-1 transition-shadow"
        />
        {searchQuery && (
          <button 
            type="button" 
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto flex-1 justify-end">
          {children}
        </div>
      )}

      {hasActiveFilters && onClearFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearFilters}
          className="text-xs text-muted-foreground hover:text-foreground h-9"
        >
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
