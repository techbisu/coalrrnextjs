'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'

export interface UserSelectProps {
  roleFilter?: string | string[]
  areaCd?: string
  mineCd?: string
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

export function UserSelect({
  roleFilter,
  areaCd,
  mineCd,
  value,
  onChange,
  ignoreScope = false,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select User / Official...',
  disabled = false,
  className,
  excludeValues = [],
}: UserSelectProps) {
  const dependencies = React.useMemo(() => {
    const deps: Record<string, any> = {}
    if (ignoreScope) deps.ignore_scope = 'true'
    if (roleFilter && typeof roleFilter === 'string' && roleFilter.trim() !== '') {
      deps.role = roleFilter
    }
    if (areaCd) deps.area_cd = areaCd
    if (mineCd) deps.mine_cd = mineCd
    return deps
  }, [ignoreScope, roleFilter, areaCd, mineCd])

  const { data, isLoading, error } = useMasterLookup({
    masterName: 'user_master',
    dependencies,
  })

  const options = React.useMemo(() => {
    let raw = (data?.options || []).filter(
      (opt) => !excludeValues.includes(String(opt.value))
    )

    if (roleFilter && typeof roleFilter === 'string' && roleFilter.trim() !== '') {
      const filterLower = roleFilter.toLowerCase()
      const term = filterLower.includes('manager')
        ? 'manager'
        : filterLower.includes('agent')
        ? 'agent'
        : filterLower.includes('surveyor')
        ? 'surveyor'
        : filterLower.includes('officer')
        ? 'officer'
        : filterLower

      raw = raw.filter((opt: any) => {
        const designation = (opt.data?.designation || '').toLowerCase()
        const label = (opt.label || '').toLowerCase()
        return designation.includes(term) || label.includes(term)
      })
    }

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All System Users' }, ...raw]
    }

    return raw
  }, [data?.options, excludeValues, roleFilter, showAllOption, isMulti])

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
