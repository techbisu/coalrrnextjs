'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MasterDataConfig } from '@/modules/admin/master-data/config/MasterDataRegistry'
import { MasterAutocomplete } from '@/core/master-lookup/components/MasterAutocomplete'
import { createMasterRecord, updateMasterRecord } from './actions'

interface MasterFormDialogProps {
  config: MasterDataConfig
  mode: 'create' | 'edit'
  initialData?: Record<string, any>
  trigger?: React.ReactNode
  onSuccess?: () => void
}

// Dynamically build Zod schema from config columns
function buildSchema(config: MasterDataConfig) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const col of config.columns) {
    // Skip primary key on create — it may be auto-generated
    let field: z.ZodTypeAny
    if (col.type === 'number') {
      field = z.coerce.number()
    } else if (col.type === 'boolean') {
      field = z.boolean().optional().default(false)
    } else {
      field = z.string()
    }
    if (col.required && col.type !== 'boolean') {
      field = (field as z.ZodString | z.ZodNumber).min(1, `${col.label} is required`)
    } else if (!col.required) {
      field = field.optional()
    }
    shape[col.key] = field
  }
  return z.object(shape)
}

export function MasterFormDialog({
  config,
  mode,
  initialData,
  trigger,
  onSuccess,
}: MasterFormDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)

  const schema = React.useMemo(() => buildSchema(config), [config])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData ?? {},
  })

  // Watch all form values for cascading dependencies
  const watchedValues = form.watch()

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset(initialData ?? {})
    }
  }, [open, initialData])

  // Sort columns into a natural data-entry order:
  // 1. Root lookup fields (lookupFrom, no dependsOnField) e.g. State
  // 2. Dependent lookup fields in parent→child order e.g. District, then Block
  // 3. Plain input fields (PK, name, code etc.)
  // 4. Boolean toggles at the bottom
  const sortedColumns = React.useMemo(() => {
    const lookups   = config.columns.filter(c => !!c.lookupFrom)
    const plainCols = config.columns.filter(c => !c.lookupFrom && c.type !== 'boolean')
    const boolCols  = config.columns.filter(c => c.type === 'boolean')

    // Topological sort of just the lookup columns (parent before child)
    const sortedLookups: typeof lookups = []
    const placed = new Set<string>()
    while (sortedLookups.length < lookups.length) {
      const before = sortedLookups.length
      for (const col of lookups) {
        if (sortedLookups.some(c => c.key === col.key)) continue
        if (!col.dependsOnField || placed.has(col.dependsOnField)) {
          sortedLookups.push(col)
          placed.add(col.key)
        }
      }
      if (sortedLookups.length === before) break
    }

    return [...sortedLookups, ...plainCols, ...boolCols]
  }, [config.columns])

  async function onSubmit(values: any) {
    setIsPending(true)
    try {
      let result
      if (mode === 'create') {
        result = await createMasterRecord(config.modelName, values)
      } else {
        const id = initialData?.[config.primaryKey]
        result = await updateMasterRecord(config.modelName, config.primaryKey, id, values)
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Record created successfully' : 'Record updated successfully')
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'An error occurred')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'An unexpected error occurred')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {mode === 'create' ? `Add ${config.title}` : `Edit ${config.title}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
            {sortedColumns.map((col) => {
              const error = form.formState.errors[col.key]

              if (col.type === 'boolean') {
                return (
                  <div key={col.key} className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor={col.key} className="cursor-pointer">
                      {col.label}
                    </Label>
                    <Switch
                      id={col.key}
                      checked={!!form.watch(col.key)}
                      onCheckedChange={(v) => form.setValue(col.key, v)}
                    />
                  </div>
                )
              }              // Render a searchable MasterAutocomplete for FK columns
              if (col.lookupFrom) {
                // Build dependsOn from another form field value
                const dependsOn: Record<string, any> | undefined = col.dependsOnField
                  ? { [col.dependsOnField]: watchedValues[col.dependsOnField] }
                  : undefined

                const isDisabled = col.dependsOnField
                  ? !watchedValues[col.dependsOnField]
                  : false

                return (
                  <div key={col.key} className="space-y-1.5">
                    <Label htmlFor={col.key}>
                      {col.label}
                      {col.required && <span className="ml-1 text-destructive">*</span>}
                    </Label>
                    <MasterAutocomplete
                      master={col.lookupFrom}
                      value={watchedValues[col.key] ? String(watchedValues[col.key]) : undefined}
                      onChange={(val) => {
                        form.setValue(
                          col.key,
                          val !== null ? (col.type === 'number' ? Number(val) : val) : undefined,
                          { shouldValidate: true }
                        )
                        // When this field changes, clear all columns that depend on it
                        config.columns.forEach((otherCol) => {
                          if (otherCol.dependsOnField === col.key) {
                            form.setValue(otherCol.key, undefined, { shouldValidate: false })
                          }
                        })
                      }}
                      dependsOn={dependsOn}
                      placeholder={isDisabled ? `Select ${config.columns.find(c => c.key === col.dependsOnField)?.label ?? 'parent'} first...` : `Search ${col.label}...`}
                      disabled={isDisabled}
                      activeOnly={false}
                      className="w-full"
                    />
                    {error && (
                      <p className="text-xs text-destructive">{error.message as string}</p>
                    )}
                  </div>
                )
              }

              return (
                <div key={col.key} className="space-y-1.5">
                  <Label htmlFor={col.key}>
                    {col.label}
                    {col.required && <span className="ml-1 text-destructive">*</span>}
                  </Label>
                  <Input
                    id={col.key}
                    type={col.type === 'number' ? 'number' : 'text'}
                    placeholder={`Enter ${col.label.toLowerCase()}`}
                    className={error ? 'border-destructive' : ''}
                    {...form.register(col.key)}
                  />
                  {error && (
                    <p className="text-xs text-destructive">{error.message as string}</p>
                  )}
                </div>
              )
            })}
            </div>

            <DialogFooter className="pt-3 shrink-0 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Record' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
