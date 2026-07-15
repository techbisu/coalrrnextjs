'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMasterQuery } from '../hooks/useMasterQuery'
import { MasterLookupProps } from '../types'
import { Loader2 } from 'lucide-react'

export function MasterLookup({
  master,
  dependsOn,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  activeOnly = true,
  className,
}: MasterLookupProps) {
  const { data, isLoading, error } = useMasterQuery({ master, dependsOn, activeOnly })

  const isDisabled = disabled || isLoading || !!error

  return (
    <Select value={value ? String(value) : undefined} onValueChange={onChange} disabled={isDisabled}>
      <SelectTrigger className={className} data-slot="select-trigger">
        <SelectValue placeholder={placeholder} />
        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </SelectTrigger>
      <SelectContent>
        {data?.options?.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
        {data?.options?.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground text-center">
            No options found
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
