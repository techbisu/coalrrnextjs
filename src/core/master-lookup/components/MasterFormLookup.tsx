'use client'

import * as React from 'react'
import { useMasterQuery } from '../hooks/useMasterQuery'
import { MasterFormLookupProps } from '../types'
import { MasterLookup } from './MasterLookup'
import { MasterAutocomplete } from './MasterAutocomplete'
import { Controller } from 'react-hook-form'

export function MasterFormLookup({
  master,
  name,
  control,
  searchable = false,
  ...props
}: MasterFormLookupProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error
        
        const Component = searchable ? MasterAutocomplete : MasterLookup

        return (
          <div className="w-full">
            <Component
              master={master}
              value={field.value}
              onChange={field.onChange}
              className={hasError ? 'border-destructive ring-destructive' : ''}
              {...props}
            />
            {hasError && (
              <p className="mt-1 text-sm text-destructive">{fieldState.error?.message}</p>
            )}
          </div>
        )
      }}
    />
  )
}
