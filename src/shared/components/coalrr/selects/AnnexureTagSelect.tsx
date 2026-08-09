'use client'

import * as React from 'react'
import { Combobox, ComboboxOption } from '@/shared/components/ui/combobox'

export interface AnnexureTagSelectProps {
  value?: string | string[]
  onChange?: (value: string | string[], option?: ComboboxOption | ComboboxOption[]) => void
  showAllOption?: boolean
  isMulti?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

const ANNEXURE_OPTIONS: ComboboxOption[] = [
  { value: 'A', label: 'Annexure A — Fully Clear' },
  { value: 'B', label: 'Annexure B — Fully Purchased' },
  { value: 'C', label: 'Annexure C — Partially Purchased' },
]

export function AnnexureTagSelect({
  value,
  onChange,
  showAllOption = false,
  isMulti = false,
  placeholder = 'Select Annexure Tag...',
  disabled = false,
  className,
}: AnnexureTagSelectProps) {
  const options = React.useMemo(() => {
    if (showAllOption && !isMulti) {
      return [{ value: 'ALL', label: 'All Annexure Classes' }, ...ANNEXURE_OPTIONS]
    }
    return ANNEXURE_OPTIONS
  }, [showAllOption, isMulti])

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      isMulti={isMulti}
    />
  )
}
