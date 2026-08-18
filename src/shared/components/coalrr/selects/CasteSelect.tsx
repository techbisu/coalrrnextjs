'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface CasteSelectProps {
  value?: string | string[]
  onChange?: (value: string | string[], option?: ComboboxOption | ComboboxOption[]) => void
  showAllOption?: boolean
  isMulti?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  excludeValues?: string[]
}

export function CasteSelect({
  value,
  onChange,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select Caste Category...',
  disabled = false,
  className,
  excludeValues = [],
}: CasteSelectProps) {
  const { data, isLoading, error } = useMasterLookup({
    masterName: 'caste',
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).map((opt) => {
      const valStr = opt.data?.cast_type || opt.label || String(opt.value)
      return {
        value: valStr,
        label: opt.label || valStr,
        data: opt.data,
      }
    }).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Caste Categories' }, ...raw]
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
