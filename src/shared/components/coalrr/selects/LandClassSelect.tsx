'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface LandClassSelectProps {
  landtId?: string
  districtLgd?: string
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

export function LandClassSelect({
  landtId,
  districtLgd,
  value,
  onChange,
  ignoreCascade = false,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select Land Class...',
  disabled = false,
  className,
  excludeValues = [],
}: LandClassSelectProps) {
  const dependencies = React.useMemo(() => {
    const deps: Record<string, any> = {}
    if (!ignoreCascade) {
      if (landtId) deps.landt_id = landtId
      if (districtLgd) deps.district_lgd = districtLgd
    }
    return deps
  }, [ignoreCascade, landtId, districtLgd])

  const { data, isLoading, error } = useMasterLookup({
    masterName: 'landclass',
    dependencies,
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Land Classes' }, ...raw]
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
