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

  const selectedValues = React.useMemo(() => {
    if (value === undefined || value === null || value === '') return []
    return Array.isArray(value) ? value.map(String) : [String(value)]
  }, [value])

  // Fetch the full list once per dependency set — no search param sent to server
  const { data, isLoading, error } = useMasterQuery({
    master,
    dependsOn,
    activeOnly,
    selectedValues,
  })

  const isDisabled = disabled || !!error

  // All options from server (full list, unfiltered)
  const allOptions = React.useMemo(() => {
    if (!data?.options) return []
    return data.options.map((opt) => ({
      value: String(opt.value),
      label: opt.label,
      group: (opt as any).group,
      data: (opt as any).data
    }))
  }, [data?.options])

  /**
   * Client-side filtering across the formatted label.
   * The label already contains: name | local | lgd_code (from labelFormat in master.config.ts)
   * so searching "2798", "पश्चिम", or "Paschim" all match naturally.
   */
  const options = React.useMemo(() => {
    if (!searchQuery.trim()) return allOptions
    const q = searchQuery.toLowerCase()
    return allOptions.filter(opt => opt.label.toLowerCase().includes(q))
  }, [allOptions, searchQuery])

  return (
    <Combobox
      options={options}
      value={isMulti ? selectedValues : selectedValues[0]}
      onChange={(v, optionData) => {
        if (isMulti) {
          onChange?.(v as string[])
        } else {
          // If onChange accepts a second argument, pass the data
          if ((onChange as any).length > 1) {
            (onChange as any)(v as string, optionData?.data)
          } else {
            onChange?.(v as string)
          }
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
