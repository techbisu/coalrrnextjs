'use client'

import * as React from 'react'
import { Combobox } from '@/components/ui/combobox'
import { useMasterLookup, UseMasterLookupProps } from '@/hooks/useMasterLookup'

export interface MasterLookupProps extends Omit<UseMasterLookupProps, 'enabled'> {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MasterLookup({
  masterName,
  dependencies,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className,
}: MasterLookupProps) {
  const { data, isLoading, error } = useMasterLookup({ masterName, dependencies })

  const isDisabled = disabled || !!error

  const options = React.useMemo(() => {
    if (!data?.options) return []
    return data.options.map((opt) => ({
      value: String(opt.value),
      label: opt.label,
      group: (opt as any).group,
    }))
  }, [data?.options])

  return (
    <Combobox
      options={options}
      value={value}
      onChange={(v) => onChange?.(v as string)}
      placeholder={placeholder}
      isLoading={isLoading}
      disabled={isDisabled}
      className={className}
    />
  )
}
