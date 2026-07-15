'use client'

import * as React from 'react'
import { MasterFormLookup } from './MasterFormLookup'
import { Control, useWatch } from 'react-hook-form'

export interface MasterCascadeProps {
  control: Control<any>
  chain: {
    master: string
    name: string
    dependsOnField?: string // The field name in the form this dropdown depends on
    dependsOnParam?: string // The query parameter name this master API expects (e.g., 'state_lgd')
    placeholder?: string
    searchable?: boolean
    isMulti?: boolean
  }[]
  className?: string
}

export function MasterCascade({ control, chain, className }: MasterCascadeProps) {
  // We use useWatch to get all values from the form dynamically
  const formValues = useWatch({ control })

  return (
    <div className={className}>
      {chain.map((config, index) => {
        // Build dependencies object dynamically based on current form state
        let dependencies: Record<string, any> | undefined = undefined
        
        if (config.dependsOnField && config.dependsOnParam) {
          const parentValue = formValues[config.dependsOnField]
          dependencies = {
            [config.dependsOnParam]: parentValue
          }
        }

        // It is disabled if it has dependencies but the parent value is missing
        const isDisabled = dependencies 
          ? Object.values(dependencies).some(val => val === null || val === undefined || val === '')
          : false

        return (
          <div key={config.name} className="flex-1">
            <MasterFormLookup
              control={control}
              name={config.name}
              master={config.master}
              dependsOn={dependencies}
              placeholder={config.placeholder}
              searchable={config.searchable}
              isMulti={config.isMulti}
              disabled={isDisabled}
            />
          </div>
        )
      })}
    </div>
  )
}
