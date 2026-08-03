'use client'

import * as React from 'react'
import { Combobox } from '@/shared/components/ui/combobox'
import { useMasterLookup, UseMasterLookupProps } from '@/hooks/useMasterLookup'

export interface MasterLookupProps extends Omit<UseMasterLookupProps, 'enabled'> {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  isMulti?: boolean
  excludeValues?: string[]
}

export function MasterLookup({
  masterName,
  dependencies,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className,
  isMulti = false,
  excludeValues = [],
}: MasterLookupProps) {
  const { data, isLoading, error } = useMasterLookup({ masterName, dependencies })

  const isDisabled = disabled || !!error

  const options = React.useMemo(() => {
    if (!data?.options) return []
    return data.options
      .filter((opt) => !excludeValues.includes(String(opt.value)))
      .map((opt) => ({
        value: String(opt.value),
        label: opt.label,
        group: (opt as any).group,
      }))
  }, [data?.options, excludeValues])

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isLoading={isLoading}
      disabled={isDisabled}
      className={className}
      isMulti={isMulti}
    />
  )
}
