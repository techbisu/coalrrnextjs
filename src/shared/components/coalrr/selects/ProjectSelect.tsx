'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'
import { useQuery } from '@tanstack/react-query'

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

async function fetchProjects() {
  const r = await fetch('/api/projects')
  if (!r.ok) throw new Error('Failed to load projects')
  const json = await r.json()
  return json.data || json
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

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  const options = React.useMemo(() => {
    let raw = (projects || [])
      .filter((p: any) => {
        if (lockedOnly && !p.isLocked) return false
        if (areaCd && p.area_cd !== areaCd) return false
        if (mineCd && p.mine_cd !== mineCd && !(p.mine_cds || []).includes(mineCd)) return false
        if (excludeValues.includes(String(p.id))) return false
        return true
      })
      .map((p: any) => ({
        value: String(p.id),
        label: [p.name, p.ecl_proj_cd].filter(Boolean).join(' | '),
        data: p
      }))

    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Mining Projects' }, ...raw]
    }

    return raw
  }, [projects, excludeValues, showAllOption, isMulti, lockedOnly, areaCd, mineCd])

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
