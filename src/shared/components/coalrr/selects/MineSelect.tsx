'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface MineSelectProps {
  areaCd?: string | string[]
  value?: string | string[]
  onChange?: (value: string | string[], option?: ComboboxOption | ComboboxOption[]) => void
  ignoreScope?: boolean
  ignoreCascade?: boolean
  showAllOption?: boolean
  isMulti?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  excludeValues?: string[]
}

export function MineSelect({
  areaCd,
  value,
  onChange,
  ignoreScope = false,
  ignoreCascade = false,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select Colliery / Mine...',
  disabled = false,
  className,
  excludeValues = [],
}: MineSelectProps) {
  const dependencies = React.useMemo(() => {
    const deps: Record<string, any> = {}
    if (ignoreScope) deps.ignore_scope = 'true'
    if (!ignoreCascade && areaCd) {
      deps.area_cd = areaCd
    }
    if (value) {
      deps.values = Array.isArray(value) ? value : [value]
    }
    return deps
  }, [ignoreScope, ignoreCascade, areaCd, value])

  const { data, isLoading, error } = useMasterLookup({
    masterName: 'mine_master',
    dependencies,
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Mines / Collieries' }, ...raw]
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
