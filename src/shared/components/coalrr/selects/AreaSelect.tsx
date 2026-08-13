'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface AreaSelectProps {
  value?: string | string[]
  onChange?: (value: string | string[], option?: ComboboxOption | ComboboxOption[]) => void
  ignoreScope?: boolean
  showAllOption?: boolean
  isMulti?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  excludeValues?: string[]
}

export function AreaSelect({
  value,
  onChange,
  ignoreScope = false,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select Area...',
  disabled = false,
  className,
  excludeValues = [],
}: AreaSelectProps) {
  const dependencies = React.useMemo(() => {
    const deps: Record<string, any> = {}
    if (ignoreScope) deps.ignore_scope = 'true'
    if (value) {
      deps.values = Array.isArray(value) ? value : [value]
    }
    return deps
  }, [ignoreScope, value])

  const { data, isLoading, error } = useMasterLookup({
    masterName: 'area',
    dependencies,
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Areas' }, ...raw]
    }

    return raw
  }, [data?.options, excludeValues, showAllOption, isMulti])

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isLoading={isLoading}
      disabled={disabled || !!error}
      className={className}
      isMulti={isMulti}
    />
  )
}
