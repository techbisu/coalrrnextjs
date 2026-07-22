'use client'

import * as React from 'react'
import { MasterFormLookup } from './MasterFormLookup'
import { Control, useWatch } from 'react-hook-form'

export interface MasterCascadeProps {
  control: Control<any>
  chain: {
    master: string
    name: string
    dependsOn?: { field: string; param: string }[] // The fields in the form this dropdown depends on and their query param names
    placeholder?: string
    searchable?: boolean
    isMulti?: boolean
  }[]
  className?: string
}

import { useFormContext } from 'react-hook-form'

function CascadeField({ control, config }: { control: Control<any>, config: MasterCascadeProps['chain'][0] }) {
  const { setValue, formState: { dirtyFields } } = useFormContext()
  
  const parentFieldNames = React.useMemo(() => config.dependsOn?.map(d => d.field) || [], [config.dependsOn])
  
  // Scoped watch: use a dummy field if no parents to avoid subscribing to the whole form
  const parentValuesRaw = useWatch({
    control,
    name: parentFieldNames.length > 0 ? (parentFieldNames as any) : '$$no_deps$$'
  })

  // Normalize to array
  const parentValues = React.useMemo(() => {
    if (parentFieldNames.length === 0) return []
    if (parentFieldNames.length === 1 && !Array.isArray(parentValuesRaw)) return [parentValuesRaw]
    return Array.isArray(parentValuesRaw) ? parentValuesRaw : [parentValuesRaw]
  }, [parentValuesRaw, parentFieldNames])

  const isFirstMount = React.useRef(true)
  const prevParentValuesRef = React.useRef<string>(JSON.stringify(parentValues))

  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    const currentValuesStr = JSON.stringify(parentValues)
    const valuesChanged = prevParentValuesRef.current !== currentValuesStr
    prevParentValuesRef.current = currentValuesStr

    // Only wipe child if a parent changed due to user interaction (dirty)
    // AND the values actually changed (avoids wiping child when child is edited and dirtyFields updates)
    const hasDirtyParent = parentFieldNames.some(field => !!dirtyFields[field])

    if (valuesChanged && hasDirtyParent) {
      setValue(config.name, config.isMulti ? [] : null)
    }
  }, [JSON.stringify(parentValues), parentFieldNames, config.name, config.isMulti, dirtyFields, setValue])

  let dependencies: Record<string, any> | undefined = undefined

  if (config.dependsOn && config.dependsOn.length > 0) {
    dependencies = {}
    config.dependsOn.forEach((dep, i) => {
      dependencies![dep.param] = parentValues[i]
    })
  }

  const isDisabled = dependencies 
    ? Object.values(dependencies).some(val => val === null || val === undefined || val === '')
    : false

  return (
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
  )
}

export function MasterCascade({ control, chain, className }: MasterCascadeProps) {
  return (
    <div className={className}>
      {chain.map((config) => (
        <div key={config.name} className="flex-1">
          <CascadeField control={control} config={config} />
        </div>
      ))}
    </div>
  )
}
