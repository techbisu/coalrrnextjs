'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface DistrictSelectProps {
  stateLgd?: string | number | string[]
  value?: string | string[]
  onChange?: (value: string | string[], option?: ComboboxOption | ComboboxOption[]) => void
  ignoreCascade?: boolean
  showAllOption?: boolean
  isMulti?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  excludeValues?: string[]
}

export function DistrictSelect({
  stateLgd,
  value,
  onChange,
  ignoreCascade = false,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select District...',
  disabled = false,
  className,
  excludeValues = [],
}: DistrictSelectProps) {
  const dependencies = React.useMemo(() => {
    const deps: Record<string, any> = {}
    if (!ignoreCascade && stateLgd) {
      deps.state_lgd = stateLgd
    }
    if (value) {
      deps.values = Array.isArray(value) ? value : [value]
    }
    return deps
  }, [ignoreCascade, stateLgd, value])

  const { data, isLoading, error } = useMasterLookup({
    masterName: 'district',
    dependencies,
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Districts' }, ...raw]
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
