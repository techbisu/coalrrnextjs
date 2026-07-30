'use client'

import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save, Trash2, X, ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { PlotScheduleSchema } from '@/core/validation/schemas/plot-schedule.schema'
import { MasterAutocomplete } from '@/core/master-lookup'
import { PLOT_TYPES } from './PlotScheduleManager'
import { generatePlotNo, autoSetOptionalPlotFields } from '@/shared/utils/plot.utils'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupSelect,
} from '@/shared/components/ui/input-group'


type PlotFormValues = z.infer<typeof PlotScheduleSchema>

interface AddPlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposalId: string
  projectStateLgd: string
  projectMouzas: string[]
  editPlotId?: string | null
  onSuccess: () => void
}

export function AddPlotDialog({
  open,
  onOpenChange,
  proposalId,
  projectStateLgd,
  projectMouzas,
  editPlotId,
  onSuccess
}: AddPlotDialogProps) {
  const [loading, setLoading] = useState(false)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
  const qc = useQueryClient()

  const form = useForm<PlotFormValues>({
    resolver: zodResolver(PlotScheduleSchema) as any,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      plot_no: 'auto-generated',
      acq_status: 'PROPOSED',
      entry_by: 'system',
      mouza_lgd: undefined,
      total_ror_area: undefined,
      plot_ty: '',
      plot_number: '',
      bata_no: '',
      opt_plot_ty: '',
      opt_plot: '',
      opt_bata: '',
      land_types: [
        { landt_id: undefined as any, area: undefined as any, area_to_acquire: undefined as any }
      ]
    } as unknown as PlotFormValues
  })

  const { fields: landTypeFields, append, remove } = useFieldArray({
    name: 'land_types',
    control: form.control
  })

  // Fetch plot data for editing
  useEffect(() => {
    if (open && editPlotId) {
      setLoading(true)
      fetch(`/api/proposals/${proposalId}/plots/${editPlotId}`)
        .then(res => res.json())
        .then(data => {
          const totalRorArea = data.land_types?.reduce((sum: number, lt: any) => sum + Number(lt.area), 0) || 0;
          form.reset({
            ...data,
            total_ror_area: totalRorArea
          } as PlotFormValues)
          setLoading(false)
        })
        .catch(err => {
          toast.error('Failed to load plot data')
          setLoading(false)
        })
    } else if (!open) {
      form.reset({
        plot_no: 'auto-generated',
        acq_status: 'PROPOSED',
        entry_by: 'system',
        mouza_lgd: undefined as any,
        total_ror_area: undefined as any,
        plot_ty: '',
        plot_number: '',
        bata_no: '',
        opt_plot_ty: '',
        opt_plot: '',
        opt_bata: '',
        land_types: [
          { landt_id: undefined as any, area: undefined as any, area_to_acquire: undefined as any }
        ]
      } as unknown as PlotFormValues)
      userEditedOptRef.current = false
    }
  }, [open, editPlotId, proposalId, form])

  // Watch for dynamic filtering
  const selectedPlotTy = form.watch('plot_ty')
  const selectedPlotNumber = form.watch('plot_number')
  const selectedBataNo = form.watch('bata_no')
  const selectedMouzaLgd = form.watch('mouza_lgd')
  const formStateLgd = form.watch('state_lgd')
  const totalRorArea = form.watch('total_ror_area')

  // Read dirtyFields during render to enable RHF Proxy subscription!
  const isPlotNumberDirty = form.formState.dirtyFields.plot_number
  const isPlotTyDirty = form.formState.dirtyFields.plot_ty
  const isBataNoDirty = form.formState.dirtyFields.bata_no

  const userEditedOptRef = useRef(false)

  // Fallback to projectStateLgd, then formStateLgd (from mouza selection)
  const derivedStateLgd = projectStateLgd || formStateLgd?.toString() || ''

  // Auto-set Optional Fields based on State LGD
  useEffect(() => {
    if (selectedPlotTy && selectedPlotNumber && derivedStateLgd) {
      const autoSet = autoSetOptionalPlotFields(derivedStateLgd, selectedPlotTy, selectedPlotNumber, selectedBataNo || '')
      if (autoSet) {
        const isPrimaryDirty = isPlotNumberDirty || isPlotTyDirty || isBataNoDirty
        const currentOptPlot = form.getValues('opt_plot')

        // Only override if the user hasn't manually edited the optional plot number IN THIS SESSION
        // AND either the primary fields are actively being edited, or it's a completely fresh form (empty opt_plot)
        if (!userEditedOptRef.current && (isPrimaryDirty || !currentOptPlot)) {
          form.setValue('opt_plot_ty', autoSet.opt_plot_ty, { shouldValidate: true })
          form.setValue('opt_plot', autoSet.opt_plot, { shouldValidate: true })
          form.setValue('opt_bata', autoSet.opt_bata, { shouldValidate: true })
        }
      }
    }
  }, [selectedPlotTy, selectedPlotNumber, selectedBataNo, derivedStateLgd, form])

  const landTypesWatch = form.watch('land_types')

  // Real-time validation for area fields
  useEffect(() => {
    if (landTypesWatch) {
      // Keep hidden 'to_be_acquired_area' in sync so cross-validation doesn't fail against stale DB values on edits
      const totalAcquireArea = landTypesWatch.reduce((acc, lt) => acc + (Number(lt.area_to_acquire) || 0), 0)
      if (totalAcquireArea > 0 || form.getValues('to_be_acquired_area') !== undefined) {
        form.setValue('to_be_acquired_area', totalAcquireArea, { shouldValidate: true })
      }

      // Trigger root array validation (sum of areas)
      form.trigger('land_types')
      // Trigger individual row validations (area_to_acquire <= area)
      landTypesWatch.forEach((_, i) => {
        form.trigger(`land_types.${i}.area`)
        form.trigger(`land_types.${i}.area_to_acquire`)
        form.trigger(`land_types.${i}.landt_id`)
      })
    }
  }, [landTypesWatch, form])

  // Real-time duplicate plot check
  useEffect(() => {
    if (selectedPlotTy && selectedPlotNumber && selectedMouzaLgd) {
      const rawPlotNo = generatePlotNo({
        stateLgd: derivedStateLgd,
        mouzaLgd: selectedMouzaLgd,
        plotTy: selectedPlotTy,
        plotNumber: selectedPlotNumber,
        bataNo: selectedBataNo
      })

      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/plots/check?plot_no=${rawPlotNo}&mouza_lgd=${selectedMouzaLgd}${editPlotId ? `&exclude_proposal_id=${proposalId}` : ''}`)
          const data = await res.json()
          if (data.exists) {
            setDuplicateError('Plot already exists in the system.')
          } else {
            setDuplicateError(null)
          }
        } catch (error) {
          console.error("Duplicate check failed", error)
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setDuplicateError(null)
    }
  }, [selectedPlotTy, selectedPlotNumber, selectedBataNo, selectedMouzaLgd, derivedStateLgd, proposalId, editPlotId])

  const availableOptTypes = PLOT_TYPES.filter(pt => {
    if (derivedStateLgd === '19') return pt.value === '2' // WB -> only RS
    if (derivedStateLgd === '20') return pt.value === '3' // JH -> only CS
    return true
  })

  // Auto-select opt_plot_ty if there's only one option
  useEffect(() => {
    if (availableOptTypes.length === 1 && form.getValues('opt_plot_ty') !== availableOptTypes[0].value) {
      form.setValue('opt_plot_ty', availableOptTypes[0].value, { shouldValidate: true })
    }
  }, [availableOptTypes, form])

  const onSubmit = async (values: any) => {
    if (duplicateError) {
      toast.error(duplicateError)
      return
    }

    setLoading(true)

    // Auto-generate plot_no before submit
    const plotNo = generatePlotNo({
      stateLgd: derivedStateLgd,
      mouzaLgd: values.mouza_lgd,
      plotTy: values.plot_ty,
      plotNumber: values.plot_number,
      bataNo: values.bata_no
    })
    values.plot_no = plotNo

    // Auto-calculate to_be_acquired_area
    values.to_be_acquired_area = values.land_types.reduce((acc, lt) => acc + lt.area_to_acquire, 0)

    try {
      let res;
      if (editPlotId) {
        // PUT request for edit (single plot payload)
        res = await fetch(`/api/proposals/${proposalId}/plots/${editPlotId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      } else {
        // POST request for add (array payload)
        const payload = { plots: [values] }
        res = await fetch(`/api/proposals/${proposalId}/plots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save plot')
      }

      toast.success(editPlotId ? 'Plot updated successfully!' : 'Plot added successfully!')
      onSuccess()

      if (!editPlotId) {
        // Reset form for continuous entry (scanner style)
        form.reset({
          ...form.getValues(),
          plot_number: '',
          bata_no: '',
          opt_plot: '',
          opt_bata: '',
          total_ror_area: undefined as any,
          land_types: [
            { landt_id: undefined as any, area: undefined as any, area_to_acquire: undefined as any }
          ]
        } as unknown as PlotFormValues)
      }

      qc.invalidateQueries({ queryKey: ['proposal_plots', proposalId] })

    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editPlotId ? 'Edit Plot' : 'Add New Plot'}</DialogTitle>
          <DialogDescription>
            {editPlotId ? 'Update the plot details below.' : 'Enter plot details. Use the exact LR/RS/CS records.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 pt-4">

            {/* Master Plot Data - Refined Stacked Layout */}
            <div className="flex flex-col gap-4 border-b pb-6">
              
              {/* Row 1: Mouza LGD */}
              <div className="w-full">
                <FormField
                  control={form.control as any}
                  name="mouza_lgd"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Mouza LGD *</FormLabel>
                      <FormControl>
                        <MasterAutocomplete 
                          master="mouza_master"
                          dependsOn={{ mouza_lgd: projectMouzas.length > 0 ? projectMouzas.join(',') : '-1' }}
                          value={field.value}
                          onChange={(val, optionData: any) => {
                            field.onChange(val)
                            // Populate the hidden state_lgd from the selected mouza_master data
                            if (optionData?.state_lgd) {
                              form.setValue('state_lgd', Number(optionData.state_lgd), { shouldValidate: true })
                            } else {
                              form.setValue('state_lgd', undefined, { shouldValidate: true })
                            }
                          }}
                          placeholder="Search Mouza..."
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                      {/* Hidden field for state_lgd to ensure it's submitted to the backend if needed */}
                      <input type="hidden" {...form.register('state_lgd')} />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: 1/2 Primary Plot Group | 1/2 Opt Plot Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Primary Plot *</FormLabel>
                    <InputGroup>
                      <InputGroupAddon align="inline-start" className="p-0 border-r-0 relative">
                        <FormField
                          control={form.control as any}
                          name="plot_ty"
                          render={({ field }) => (
                            <InputGroupSelect {...field} className="w-20 border-r border-input bg-muted/20 pl-2 pr-6">
                              <option value="">Type</option>
                              {PLOT_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label.split(' - ')[1]}</option>)}
                            </InputGroupSelect>
                          )}
                        />
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      </InputGroupAddon>
                      
                      <FormField
                        control={form.control as any}
                        name="plot_number"
                        render={({ field }) => (
                          <InputGroupInput placeholder="No *" className="px-2" {...field} />
                        )}
                      />

                      <InputGroupAddon align="inline-end" className="p-0 border-l-0">
                        <FormField
                          control={form.control as any}
                          name="bata_no"
                          render={({ field }) => (
                            <InputGroupInput placeholder="Bata" className="w-16 px-2 border-l border-input bg-muted/20" {...field} />
                          )}
                        />
                      </InputGroupAddon>
                    </InputGroup>
                    {(form.formState.errors.plot_ty || form.formState.errors.plot_number || duplicateError) && (
                      <div className="flex justify-between text-[10px] font-medium text-destructive mt-1">
                        {form.formState.errors.plot_ty && <span>{form.formState.errors.plot_ty.message}</span>}
                        {form.formState.errors.plot_number && <span>{form.formState.errors.plot_number.message}</span>}
                        {duplicateError && <span>{duplicateError}</span>}
                      </div>
                    )}
                  </FormItem>
                </div>

                <div className="col-span-1">
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Previous Plot (Opt)</FormLabel>
                    <InputGroup>
                      <InputGroupAddon align="inline-start" className="p-0 border-r-0 relative">
                        <FormField
                          control={form.control as any}
                          name="opt_plot_ty"
                          render={({ field }) => (
                            <InputGroupSelect 
                              {...field} 
                              className="w-20 border-r border-input bg-muted/20 pl-2 pr-6"
                              onChange={(e) => {
                                userEditedOptRef.current = true
                                field.onChange(e)
                              }}
                            >
                              <option value="">Type</option>
                              {availableOptTypes.map(pt => <option key={pt.value} value={pt.value}>{pt.label.split(' - ')[1]}</option>)}
                            </InputGroupSelect>
                          )}
                        />
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      </InputGroupAddon>
                      
                      <FormField
                        control={form.control as any}
                        name="opt_plot"
                        render={({ field }) => (
                          <InputGroupInput 
                            placeholder="No" 
                            className="px-2" 
                            {...field} 
                            onChange={(e) => {
                              userEditedOptRef.current = true
                              field.onChange(e)
                            }}
                          />
                        )}
                      />

                      <InputGroupAddon align="inline-end" className="p-0 border-l-0">
                        <FormField
                          control={form.control as any}
                          name="opt_bata"
                          render={({ field }) => (
                            <InputGroupInput 
                              placeholder="Bata" 
                              className="w-16 px-2 border-l border-input bg-muted/20" 
                              {...field} 
                              onChange={(e) => {
                                userEditedOptRef.current = true
                                field.onChange(e)
                              }}
                            />
                          )}
                        />
                      </InputGroupAddon>
                    </InputGroup>

                  </FormItem>
                </div>
              </div>

              {/* Row 3: Total Area */}
              <div className="w-full">
                <FormField
                  control={form.control as any}
                  name="total_ror_area"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Total ROR Area *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0001" 
                          placeholder="0.0000" 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e.target.value)
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val)) {
                              field.onChange(val.toFixed(4))
                            }
                            field.onBlur()
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Land Types Array */}
            {totalRorArea && totalRorArea > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Land Types & Areas</h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ landt_id: '' as any, area: 0, area_to_acquire: 0 })}
                  className="h-8 text-xs px-3 bg-card"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Land Type
                </Button>
              </div>
              
              {(form.formState.errors.land_types?.root?.message || (form.formState.errors.land_types as any)?.message) && (
                <div className="p-2 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20">
                  {form.formState.errors.land_types?.root?.message || (form.formState.errors.land_types as any)?.message}
                </div>
              )}

              <div className="flex flex-col gap-3">
                {landTypeFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-3 gap-3 items-start bg-card/50 border rounded-lg p-3 relative group hover:border-primary/20 transition-colors">
                    
                    {landTypeFields.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => remove(index)} 
                        className="absolute -top-2 -right-2 bg-muted hover:bg-destructive text-muted-foreground hover:text-destructive-foreground rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Remove land type"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {/* 1/3 Land Type */}
                    <div className="col-span-1">
                      <FormField
                        control={form.control as any}
                        name={`land_types.${index}.landt_id`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Land Type *</FormLabel>
                            <FormControl>
                              <MasterAutocomplete 
                                master="landtype_master"
                                value={field.value}
                                onChange={(val) => {
                                  field.onChange(val)
                                  // Force immediate validation clear
                                  form.trigger(`land_types.${index}.landt_id`)
                                }}
                                placeholder="Select..."
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 1/3 L-Area */}
                    <div className="col-span-1">
                      <FormField
                        control={form.control as any}
                        name={`land_types.${index}.area`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Area As per ROR *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001" 
                                placeholder="0.0000" 
                                {...field} 
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value)
                                  // Trigger cross-field validation immediately
                                  setTimeout(() => {
                                    form.trigger(`land_types.${index}.area_to_acquire`)
                                    form.trigger('land_types')
                                  }, 0)
                                }}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (!isNaN(val)) field.onChange(val.toFixed(4))
                                  field.onBlur()
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 1/3 Acq-Area */}
                    <div className="col-span-1">
                      <FormField
                        control={form.control as any}
                        name={`land_types.${index}.area_to_acquire`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Area to be acquire *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001" 
                                placeholder="0.0000" 
                                {...field} 
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value)
                                  // Trigger cross-field validation immediately
                                  setTimeout(() => {
                                    form.trigger(`land_types.${index}.area`)
                                    form.trigger('land_types')
                                  }, 0)
                                }}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (!isNaN(val)) field.onChange(val.toFixed(4))
                                  field.onBlur()
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editPlotId ? 'Update Plot' : 'Save & Add Another'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
