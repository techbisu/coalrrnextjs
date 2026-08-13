'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface LandTypeSelectProps {
  category?: 'TENANCY' | 'GOVT' | 'FOREST' | 'PATTA'
  parentLandtId?: string
  value?: string | string[]
  onChange?: (value: string | string[], option?: ComboboxOption | ComboboxOption[]) => void
  showAllOption?: boolean
  isMulti?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  excludeValues?: string[]
}

export function LandTypeSelect({
  category,
  parentLandtId,
  value,
  onChange,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select Land Type...',
  disabled = false,
  className,
  excludeValues = [],
}: LandTypeSelectProps) {
  const dependencies = React.useMemo(() => {
    const deps: Record<string, any> = {}
    if (category) deps.category = category
    if (parentLandtId) deps.parent_landt_id = parentLandtId
    return deps
  }, [category, parentLandtId])

  const { data, isLoading, error } = useMasterLookup({
    masterName: 'landtype',
    dependencies,
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Land Types' }, ...raw]
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
