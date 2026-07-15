'use client'

import * as React from 'react'
import { useMasterQuery } from '../hooks/useMasterQuery'
import { MasterLookupProps } from '../types'
import { Combobox } from '@/components/ui/combobox'

export function MasterAutocomplete({
  master,
  dependsOn,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  activeOnly = true,
  isMulti = false,
  className,
}: MasterLookupProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const selectedValues = React.useMemo(() => {
    if (value === undefined || value === null || value === '') return []
    return Array.isArray(value) ? value.map(String) : [String(value)]
  }, [value])

  const { data, isLoading, error } = useMasterQuery({ 
    master, 
    dependsOn, 
    searchQuery: debouncedSearch,
    activeOnly,
    selectedValues
  })

  const isDisabled = disabled || !!error

  const options = React.useMemo(() => {
    if (!data?.options) return []
    return data.options.map((opt) => ({
      value: String(opt.value),
      label: opt.label,
      group: (opt as any).group, // Maps group if returned by API
    }))
  }, [data?.options])

  return (
    <Combobox
      options={options}
      value={isMulti ? selectedValues : selectedValues[0]}
      onChange={(v) => {
        if (isMulti) {
          onChange?.(v as string[])
        } else {
          onChange?.(v as string)
        }
      }}
      onSearch={setSearchQuery}
      placeholder={placeholder}
      isMulti={isMulti}
      isLoading={isLoading}
      disabled={isDisabled}
      className={className}
    />
  )
}
