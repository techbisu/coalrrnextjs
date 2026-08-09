'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface ProjectSelectProps {
  areaCd?: string
  mineCd?: string
  lockedOnly?: boolean
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

export function ProjectSelect({
  areaCd,
  mineCd,
  lockedOnly = false,
  value,
  onChange,
  ignoreScope = false,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select Mining Project...',
  disabled = false,
  className,
  excludeValues = [],
}: ProjectSelectProps) {
  const dependencies = React.useMemo(() => {
    const deps: Record<string, any> = {}
    if (ignoreScope) deps.ignore_scope = 'true'
    if (areaCd) deps.area_cd = areaCd
    if (mineCd) deps.mine_cd = mineCd
    if (lockedOnly) deps.is_locked = 'true'
    return deps
  }, [ignoreScope, areaCd, mineCd, lockedOnly])

  const { data, isLoading, error } = useMasterLookup({
    masterName: 'project',
    dependencies,
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Mining Projects' }, ...raw]
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
