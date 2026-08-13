'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface MouzaSelectProps {
  stateLgd?: string | number | string[]
  districtLgd?: string | number | string[]
  blockLgd?: string | number | string[]
  projCd?: string
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

export function MouzaSelect({
  stateLgd,
  districtLgd,
  blockLgd,
  projCd,
  value,
  onChange,
  ignoreCascade = false,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select Mouza...',
  disabled = false,
  className,
  excludeValues = [],
}: MouzaSelectProps) {
  const dependencies = React.useMemo(() => {
    const deps: Record<string, any> = {}
    if (!ignoreCascade) {
      if (stateLgd) deps.state_lgd = stateLgd
      if (districtLgd) deps.district_lgd = districtLgd
      if (blockLgd) deps.block_lgd = blockLgd
      if (projCd) deps.proj_cd = projCd
    }
    if (value) {
      deps.values = Array.isArray(value) ? value : [value]
    }
    return deps
  }, [ignoreCascade, stateLgd, districtLgd, blockLgd, projCd, value])

  const { data, isLoading, error } = useMasterLookup({
    masterName: 'mouza',
    dependencies,
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Mouzas' }, ...raw]
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
