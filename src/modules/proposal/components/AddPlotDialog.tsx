'use client'

import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronDown, 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Building,
  Calculator,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { PlotScheduleSchema, Step1PlotSchema } from '@/core/validation/schemas/plot-schedule.schema'
import { MasterAutocomplete, useMasterQuery } from '@/core/master-lookup'
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
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
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

const USE_PURPOSES = [
  { value: 'EXCAVATION', label: 'Excavation / Mining' },
  { value: 'SAFETY_ZONE', label: 'Safety Zone' },
  { value: 'OB_DUMP', label: 'OB Dump' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure & Plant' },
  { value: 'DIVERSION', label: 'Road / Nallah Diversion' },
  { value: 'REHABILITATION', label: 'R&R' },
  { value: 'OTHER', label: 'Other Purpose' },
] as const

/**
 * Simple Dropdown UI component for Master Data selection
 */
function MasterSelect({
  master,
  dependsOn,
  value,
  onChange,
  placeholder,
  className
}: {
  master: string
  dependsOn?: Record<string, any>
  value?: any
  onChange: (val: any) => void
  placeholder?: string
  className?: string
}) {
  const { data, isLoading } = useMasterQuery({ master, dependsOn })
  const options = data?.options || []

  return (
    <select
      value={value !== undefined && value !== null ? String(value) : ''}
      onChange={(e) => {
        const val = e.target.value
        onChange(val ? Number(val) : undefined)
      }}
      disabled={isLoading}
      className={className || "h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"}
    >
      <option value="">{isLoading ? 'Loading options...' : (placeholder || 'Select Land Type...')}</option>
      {options.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface SubTypeListProps {
  nestIndex: number
  control: any
  form: any
}

function SubTypeList({ nestIndex, control, form }: SubTypeListProps) {
  const { fields, append, remove } = useFieldArray({
    name: `land_types.${nestIndex}.sub_types`,
    control
  })

  // Realtime parent area vs sub-types area check
  const parentArea = Number(form.watch(`land_types.${nestIndex}.area`)) || 0
  const subTypesWatch = form.watch(`land_types.${nestIndex}.sub_types`) || []
  const currentSubAllocated = subTypesWatch.reduce((sum: number, st: any) => sum + (Number(st?.area_to_acquire) || 0), 0)
  const remainingUnallocatedSub = Math.max(0, parentArea - currentSubAllocated)
  const isSubTypeAreaExceeded = currentSubAllocated - parentArea > 0.00001
  const subTypeExcessArea = currentSubAllocated - parentArea

  // Extract error for this sub_types array from RHF formState
  const subTypesErrorObj = form.formState.errors.land_types?.[nestIndex]?.sub_types as any
  const subTypesError = subTypesErrorObj?.root?.message || subTypesErrorObj?.message

  return (
    <div className="col-span-12 mt-1 pl-3 border-l-2 border-primary/20 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">To be acquired</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-5 text-[10px] px-1.5 py-0"
          onClick={() => append({ 
            sub_landt_id: undefined as any, 
            area_to_acquire: remainingUnallocatedSub > 0 ? Number(remainingUnallocatedSub.toFixed(4)) : '' as any
          })}
        >
          <Plus className="w-2.5 h-2.5 mr-0.5" /> Add Sub-Type
        </Button>
      </div>

      {/* REALTIME SUB-TYPE EXCESS AREA ALERT */}
      {isSubTypeAreaExceeded && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive bg-destructive/10 p-2 rounded border border-destructive/30 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Sum of Sub-Types ({currentSubAllocated.toFixed(4)} ac) exceeds Primary Area ({parentArea.toFixed(4)} ac) by {subTypeExcessArea.toFixed(4)} ac!</span>
        </div>
      )}

      {subTypesError && !isSubTypeAreaExceeded && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive bg-destructive/10 p-2 rounded border border-destructive/30">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{subTypesError}</span>
        </div>
      )}

      {fields.map((item, subIndex) => (
        <div key={item.id} className="grid grid-cols-12 gap-2 items-center relative bg-background/80 p-1.5 rounded border">
          {fields.length > 1 && (
            <button 
              type="button" 
              onClick={() => remove(subIndex)} 
              className="absolute -top-1.5 -right-1.5 bg-muted hover:bg-destructive text-muted-foreground hover:text-destructive-foreground rounded-full p-0.5 shadow-sm opacity-80 hover:opacity-100 transition-all z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Sub-Type Selection - Simple Dropdown UI */}
          <div className="col-span-6">
            <FormField
              control={control}
              name={`land_types.${nestIndex}.sub_types.${subIndex}.sub_landt_id`}
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <MasterSelect 
                      master="landtype"
                      dependsOn={{ 
                        p_id: form.watch(`land_types.${nestIndex}.landt_id`),
                        activeOnly: 'true' 
                      }}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        form.trigger(`land_types.${nestIndex}.sub_types.${subIndex}.sub_landt_id`)
                      }}
                      placeholder="Select Sub-Type..."
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] text-destructive font-medium" />
                </FormItem>
              )}
            />
          </div>

          {/* Area to Acquire */}
          <div className="col-span-6">
            <FormField
              control={control}
              name={`land_types.${nestIndex}.sub_types.${subIndex}.area_to_acquire`}
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0001" 
                      placeholder="Acq Area (ac)" 
                      className="h-8 text-xs px-2"
                      {...field} 
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        form.trigger(`land_types.${nestIndex}`)
                        form.trigger('land_types')
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val)) field.onChange(val.toFixed(4))
                        field.onBlur()
                        form.trigger(`land_types.${nestIndex}`)
                        form.trigger('land_types')
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] text-destructive font-medium" />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}
    </div>
  )
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
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
  const qc = useQueryClient()

  const form = useForm<PlotFormValues>({
    resolver: zodResolver(PlotScheduleSchema) as any,
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    defaultValues: {
      plot_no: 'auto-generated',
      acq_status: 'PROPOSED',
      entry_by: 'system',
      mouza_lgd: undefined,
      total_ror_area: undefined,
      ecl_acquired_area: 0,
      plot_ty: '',
      plot_number: '',
      bata_no: '',
      opt_plot_ty: '',
      opt_plot: '',
      opt_bata: '',
      land_types: [
        { 
          landt_id: undefined as any, 
          area: undefined as any, 
          use_purpose: 'EXCAVATION',
          sub_types: [
            { sub_landt_id: undefined as any, area_to_acquire: undefined as any }
          ]
        }
      ]
    } as unknown as PlotFormValues
  })

  const { fields: landTypeFields, append, remove } = useFieldArray({
    name: 'land_types',
    control: form.control
  })

  // Reset step on open
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
    }
  }, [open])

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
            total_ror_area: totalRorArea,
            ecl_acquired_area: Number(data.ecl_acquired_area || 0)
          } as PlotFormValues)
          setLoading(false)
        })
        .catch(() => {
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
        ecl_acquired_area: 0,
        plot_ty: '',
        plot_number: '',
        bata_no: '',
        opt_plot_ty: '',
        opt_plot: '',
        opt_bata: '',
        land_types: [
          { 
            landt_id: undefined as any, 
            area: undefined as any, 
            use_purpose: 'EXCAVATION',
            sub_types: [
              { sub_landt_id: undefined as any, area_to_acquire: undefined as any }
            ]
          }
        ]
      } as unknown as PlotFormValues)
      userEditedOptRef.current = false
    }
  }, [open, editPlotId, proposalId, form])

  // Watch fields
  const selectedPlotTy = form.watch('plot_ty')
  const selectedPlotNumber = form.watch('plot_number')
  const selectedBataNo = form.watch('bata_no')
  const selectedMouzaLgd = form.watch('mouza_lgd')
  const formStateLgd = form.watch('state_lgd')
  const totalRorArea = Number(form.watch('total_ror_area')) || 0
  const eclAcquiredArea = Number(form.watch('ecl_acquired_area')) || 0

  // Calculate available area to purchase
  const availableArea = Math.max(0, totalRorArea - eclAcquiredArea)

  // Real-time primary land type area calculations
  const landTypesWatch = form.watch('land_types')
  const currentAllocatedPrimary = (landTypesWatch || []).reduce((sum, lt) => sum + (Number(lt?.area) || 0), 0)
  const remainingUnallocatedPrimary = Math.max(0, availableArea - currentAllocatedPrimary)
  const isPrimaryAreaExceeded = currentAllocatedPrimary - availableArea > 0.00001
  const primaryExcessArea = currentAllocatedPrimary - availableArea

  // Dynamically derive Annexure Tag based on ECL Acquired Area
  useEffect(() => {
    if (eclAcquiredArea === 0) {
      form.setValue('acq_status', 'PROPOSED') // Annexure A: Fully Clear
    } else if (eclAcquiredArea > 0 && eclAcquiredArea < totalRorArea) {
      form.setValue('acq_status', 'PARTIALLY_PURCHASED') // Annexure C: Partially Purchased
    } else if (eclAcquiredArea >= totalRorArea && totalRorArea > 0) {
      form.setValue('acq_status', 'PURCHASED') // Annexure B: Fully Purchased
    }
  }, [eclAcquiredArea, totalRorArea, form])

  const isPlotNumberDirty = form.formState.dirtyFields.plot_number
  const isPlotTyDirty = form.formState.dirtyFields.plot_ty
  const isBataNoDirty = form.formState.dirtyFields.bata_no

  const userEditedOptRef = useRef(false)
  const derivedStateLgd = projectStateLgd || formStateLgd?.toString() || ''

  // Auto-set Optional Fields
  useEffect(() => {
    if (selectedPlotTy && selectedPlotNumber && derivedStateLgd) {
      const autoSet = autoSetOptionalPlotFields(derivedStateLgd, selectedPlotTy, selectedPlotNumber, selectedBataNo || '')
      if (autoSet) {
        const isPrimaryDirty = isPlotNumberDirty || isPlotTyDirty || isBataNoDirty
        const currentOptPlot = form.getValues('opt_plot')

        if (!userEditedOptRef.current && (isPrimaryDirty || !currentOptPlot)) {
          form.setValue('opt_plot_ty', autoSet.opt_plot_ty, { shouldValidate: true })
          form.setValue('opt_plot', autoSet.opt_plot, { shouldValidate: true })
          form.setValue('opt_bata', autoSet.opt_bata, { shouldValidate: true })
        }
      }
    }
  }, [selectedPlotTy, selectedPlotNumber, selectedBataNo, derivedStateLgd, form, isPlotNumberDirty, isPlotTyDirty, isBataNoDirty])

  useEffect(() => {
    if (landTypesWatch) {
      const totalAcquireArea = landTypesWatch.reduce((acc, lt) => {
        const subSum = (lt?.sub_types || []).reduce((s, st) => s + (Number(st.area_to_acquire) || 0), 0)
        return acc + (subSum || Number(lt?.area) || 0)
      }, 0)
      if (totalAcquireArea > 0 || form.getValues('to_be_acquired_area') !== undefined) {
        form.setValue('to_be_acquired_area', totalAcquireArea, { shouldValidate: false })
      }
    }
  }, [landTypesWatch, form])

  // Real-time duplicate check
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
            if (data.acquired_area) {
              form.setValue('ecl_acquired_area', Number(data.acquired_area))
            }
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
  }, [selectedPlotTy, selectedPlotNumber, selectedBataNo, selectedMouzaLgd, derivedStateLgd, proposalId, editPlotId, form])

  const availableOptTypes = PLOT_TYPES.filter(pt => {
    if (derivedStateLgd === '19') return pt.value === '2'
    if (derivedStateLgd === '20') return pt.value === '3'
    return true
  })

  useEffect(() => {
    if (availableOptTypes.length === 1 && form.getValues('opt_plot_ty') !== availableOptTypes[0].value) {
      form.setValue('opt_plot_ty', availableOptTypes[0].value, { shouldValidate: true })
    }
  }, [availableOptTypes, form])

  // Step 1 Validation Guard using Step1PlotSchema
  const handleNext = async () => {
    if (currentStep === 1) {
      const values = form.getValues()
      const step1Result = Step1PlotSchema.safeParse(values)

      if (step1Result.success && !duplicateError) {
        setCurrentStep(2)
      } else {
        await form.trigger(['mouza_lgd', 'plot_ty', 'plot_number', 'total_ror_area'])
        if (!step1Result.success) {
          const firstErr = step1Result.error.issues[0]?.message || 'Please complete all required fields in Step 1.'
          toast.error(firstErr)
        } else if (duplicateError) {
          toast.error(duplicateError)
        }
      }
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const onSubmit = async (values: any) => {
    if (duplicateError) {
      toast.error(duplicateError)
      return
    }

    setLoading(true)

    const plotNo = generatePlotNo({
      stateLgd: derivedStateLgd,
      mouzaLgd: values.mouza_lgd,
      plotTy: values.plot_ty,
      plotNumber: values.plot_number,
      bataNo: values.bata_no
    })
    values.plot_no = plotNo

    values.to_be_acquired_area = values.land_types.reduce((acc: number, lt: any) => {
      const subSum = (lt.sub_types || []).reduce((s: number, st: any) => s + Number(st.area_to_acquire || 0), 0)
      return acc + (subSum || Number(lt.area || 0))
    }, 0)

    try {
      let res;
      if (editPlotId) {
        res = await fetch(`/api/proposals/${proposalId}/plots/${editPlotId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      } else {
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

      toast.success(editPlotId ? 'Plot updated successfully!' : 'Plot added to schedule successfully!')
      onSuccess()

      if (!editPlotId) {
        setCurrentStep(1)
        form.reset({
          ...form.getValues(),
          plot_number: '',
          bata_no: '',
          opt_plot: '',
          opt_bata: '',
          total_ror_area: undefined as any,
          ecl_acquired_area: 0,
          land_types: [
            { 
              landt_id: undefined as any, 
              area: undefined as any, 
              use_purpose: 'EXCAVATION',
              sub_types: [
                { sub_landt_id: undefined as any, area_to_acquire: undefined as any }
              ]
            }
          ]
        } as unknown as PlotFormValues)
      } else {
        onOpenChange(false)
      }

      qc.invalidateQueries({ queryKey: ['proposal_plots', proposalId] })

    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle RHF form invalid submit attempt (ONLY for Step 2 final submit)
  const onInvalid = (errors: any) => {
    if (currentStep === 1) return; // Ignore on step 1
    console.error('Validation errors on submit:', JSON.stringify(errors, null, 2))
    const messages: string[] = []

    if (errors.mouza_lgd) messages.push(errors.mouza_lgd.message || 'Mouza LGD is required.')
    if (errors.plot_ty) messages.push(errors.plot_ty.message || 'Plot Type is required.')
    if (errors.plot_number) messages.push(errors.plot_number.message || 'Plot Number is required.')
    if (errors.total_ror_area) messages.push(errors.total_ror_area.message || 'Total ROR Area is required.')
    if (errors.to_be_acquired_area) messages.push(errors.to_be_acquired_area.message || 'Total Area to Acquire is invalid.')

    if (errors.land_types?.root?.message) {
      messages.push(errors.land_types.root.message)
    } else if (errors.land_types?.message) {
      messages.push(errors.land_types.message)
    } else if (Array.isArray(errors.land_types)) {
      errors.land_types.forEach((ltErr: any, idx: number) => {
        if (ltErr?.landt_id) messages.push(`Row ${idx + 1}: Primary Land Type is required.`)
        if (ltErr?.area) messages.push(`Row ${idx + 1}: ROR Area is required.`)
        if (ltErr?.sub_types?.root?.message) messages.push(`Row ${idx + 1}: ${ltErr.sub_types.root.message}`)
        if (Array.isArray(ltErr?.sub_types)) {
          ltErr.sub_types.forEach((stErr: any, sIdx: number) => {
            if (stErr?.sub_landt_id) messages.push(`Row ${idx + 1} Sub-type ${sIdx + 1}: Sub-Type is required.`)
            if (stErr?.area_to_acquire) messages.push(`Row ${idx + 1} Sub-type ${sIdx + 1}: Area to acquire is required.`)
          })
        }
      })
    }

    const finalMsg = messages.length > 0 ? messages[0] : 'Validation failed. Please fill all required fields.'
    toast.error(finalMsg)
  }

  // Root land_types error message
  const rootLandTypesError = (form.formState.errors.land_types as any)?.root?.message || (form.formState.errors.land_types as any)?.message

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] overflow-y-auto max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                {editPlotId ? 'Edit Plot Schedule Entry' : 'Add Plot Schedule Entry'}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                {currentStep === 1 
                  ? 'Step 1 of 2: Enter Mouza, Plot Numbers & Area Details.' 
                  : 'Step 2 of 2: Enter Primary Land Types & Purpose Breakdown.'}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5">
              Step {currentStep} of 2
            </Badge>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (currentStep === 1) {
                handleNext()
              } else {
                form.handleSubmit(onSubmit, onInvalid)(e)
              }
            }} 
            className="p-6 flex flex-col gap-4"
          >

            {/* STEP 1: Identification & Plot Record */}
            <div className={currentStep === 1 ? 'space-y-4 animate-in fade-in-50 duration-200' : 'hidden'}>
              {/* Mouza LGD */}
              <div className="w-full">
                <FormField
                  control={form.control as any}
                  name="mouza_lgd"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[11px] uppercase font-semibold text-muted-foreground">Mouza LGD *</FormLabel>
                      <FormControl>
                        <MasterAutocomplete 
                          master="mouza"
                          dependsOn={{ mouza_lgd: projectMouzas.length > 0 ? projectMouzas.join(',') : '-1' }}
                          value={field.value}
                          onChange={((val: any, optionData: any) => {
                            field.onChange(val)
                            if (optionData?.state_lgd) {
                              form.setValue('state_lgd', Number(optionData.state_lgd), { shouldValidate: true })
                            } else {
                              form.setValue('state_lgd', undefined, { shouldValidate: true })
                            }
                          }) as any}
                          placeholder="Search Mouza..."
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] text-destructive font-medium" />
                      <input type="hidden" {...form.register('state_lgd')} />
                    </FormItem>
                  )}
                />
              </div>

              {/* INLINE ROW 1: Primary Plot Group & Previous Survey Plot */}
              <div className="grid grid-cols-2 gap-3">
                {/* Primary Plot */}
                <div className="col-span-1">
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[11px] uppercase font-semibold text-muted-foreground">Primary Plot *</FormLabel>
                    <InputGroup>
                      <InputGroupAddon align="inline-start" className="p-0 border-r-0 relative">
                        <FormField
                          control={form.control as any}
                          name="plot_ty"
                          render={({ field }) => (
                            <InputGroupSelect {...field} className="w-20 border-r border-input bg-muted/20 pl-1.5 pr-5 text-xs">
                              <option value="">Type</option>
                              {PLOT_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label.split(' - ')[1]}</option>)}
                            </InputGroupSelect>
                          )}
                        />
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      </InputGroupAddon>
                      
                      <FormField
                        control={form.control as any}
                        name="plot_number"
                        render={({ field }) => (
                          <InputGroupInput placeholder="No *" className="px-2 text-xs" {...field} />
                        )}
                      />

                      <InputGroupAddon align="inline-end" className="p-0 border-l-0">
                        <FormField
                          control={form.control as any}
                          name="bata_no"
                          render={({ field }) => (
                            <InputGroupInput placeholder="Bata" className="w-14 px-1.5 border-l border-input bg-muted/20 text-xs" {...field} />
                          )}
                        />
                      </InputGroupAddon>
                    </InputGroup>

                    {(form.formState.errors.plot_ty || form.formState.errors.plot_number || duplicateError) && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-destructive mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        {duplicateError || form.formState.errors.plot_ty?.message || form.formState.errors.plot_number?.message}
                      </div>
                    )}
                  </FormItem>
                </div>

                {/* Previous Survey Plot */}
                <div className="col-span-1">
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[11px] uppercase font-semibold text-muted-foreground">Previous Plot (Opt)</FormLabel>
                    <InputGroup>
                      <InputGroupAddon align="inline-start" className="p-0 border-r-0 relative">
                        <FormField
                          control={form.control as any}
                          name="opt_plot_ty"
                          render={({ field }) => (
                            <InputGroupSelect 
                              {...field} 
                              className="w-20 border-r border-input bg-muted/20 pl-1.5 pr-5 text-xs"
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
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      </InputGroupAddon>
                      
                      <FormField
                        control={form.control as any}
                        name="opt_plot"
                        render={({ field }) => (
                          <InputGroupInput 
                            placeholder="No" 
                            className="px-2 text-xs" 
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
                              className="w-14 px-1.5 border-l border-input bg-muted/20 text-xs" 
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

              {/* INLINE ROW 2: Total ROR Area & ECL Purchased Area (READ-ONLY) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total ROR Area */}
                <FormField
                  control={form.control as any}
                  name="total_ror_area"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[11px] uppercase font-semibold text-muted-foreground">Total ROR Area (Acres) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0001" 
                          placeholder="0.0000" 
                          className="h-9 text-xs"
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val)) field.onChange(val.toFixed(4))
                            field.onBlur()
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] text-destructive font-medium" />
                    </FormItem>
                  )}
                />

                {/* ECL Purchased Area (NOT EDITABLE / READ-ONLY) */}
                <FormField
                  control={form.control as any}
                  name="ecl_acquired_area"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                        <Building className="w-3 h-3 text-primary" /> ECL Purchased Area (Readonly)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0001" 
                          readOnly 
                          disabled
                          placeholder="0.0000" 
                          className="h-9 text-xs bg-muted/50 cursor-not-allowed font-mono font-semibold"
                          {...field} 
                          value={(field.value !== undefined ? Number(field.value) : 0).toFixed(4)}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] text-destructive font-medium" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* STEP 2: Land Areas, Summary & Land Type Breakdown */}
            <div className={currentStep === 2 ? 'space-y-3 animate-in fade-in-50 duration-200' : 'hidden'}>
              {/* ALERT MSG SUMMARY BANNER */}
              <Alert className="py-2.5 px-3 border-primary/30 bg-primary/5 dark:bg-primary/10">
                <Info className="w-4 h-4 text-primary" />
                <AlertDescription className="text-xs font-mono flex items-center justify-between gap-2 text-foreground">
                  <span>
                    <strong>Total ROR Area:</strong> {totalRorArea.toFixed(4)} ac
                  </span>
                  <span>
                    <strong>ECL Purchased Area:</strong> {eclAcquiredArea.toFixed(4)} ac
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    <strong>Available to Acquire:</strong> {availableArea.toFixed(4)} ac
                  </span>
                </AlertDescription>
              </Alert>

              {/* REALTIME PRIMARY LAND TYPES OVER-AREA WARNING BANNER */}
              {isPrimaryAreaExceeded && (
                <Alert variant="destructive" className="py-2 px-3 animate-in fade-in-50">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs font-semibold">
                    Sum of Primary Land Type Areas ({currentAllocatedPrimary.toFixed(4)} ac) exceeds Available to Acquire ({availableArea.toFixed(4)} ac) by {primaryExcessArea.toFixed(4)} ac!
                  </AlertDescription>
                </Alert>
              )}

              {/* ROOT LAND TYPES ERROR BANNER FROM RHF */}
              {rootLandTypesError && !isPrimaryAreaExceeded && (
                <Alert variant="destructive" className="py-2 px-3">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs font-semibold">
                    {rootLandTypesError}
                  </AlertDescription>
                </Alert>
              )}

              {/* COMPACT LAND TYPES SECTION */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">As per ROR record</h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ 
                      landt_id: '' as any, 
                      area: remainingUnallocatedPrimary > 0 ? Number(remainingUnallocatedPrimary.toFixed(4)) : '' as any, 
                      use_purpose: 'EXCAVATION',
                      sub_types: [
                        { sub_landt_id: '' as any, area_to_acquire: '' as any }
                      ]
                    })}
                    className="h-7 text-xs px-2"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Land Type
                  </Button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {landTypeFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 bg-card border rounded-lg p-2.5 relative group hover:border-primary/20 transition-colors">
                      {landTypeFields.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => remove(index)} 
                          className="absolute -top-1.5 -right-1.5 bg-muted hover:bg-destructive text-muted-foreground hover:text-destructive-foreground rounded-full p-0.5 shadow-sm opacity-80 hover:opacity-100 transition-all z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      {/* Primary Land Type - Simple Dropdown UI */}
                      <div className="col-span-4">
                        <FormField
                          control={form.control as any}
                          name={`land_types.${index}.landt_id`}
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Primary Type *</FormLabel>
                              <FormControl>
                                <MasterSelect 
                                  master="landtype"
                                  dependsOn={{ p_id: 'null' }}
                                  value={field.value}
                                  onChange={(val) => {
                                    field.onChange(val)
                                    form.trigger(`land_types.${index}.landt_id`)
                                  }}
                                  placeholder="Select Primary..."
                                />
                              </FormControl>
                              <FormMessage className="text-[10px] text-destructive font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* ROR Area */}
                      <div className="col-span-4">
                        <FormField
                          control={form.control as any}
                          name={`land_types.${index}.area`}
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Area (Acres) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.0001" 
                                  placeholder="0.0000" 
                                  className="h-8 text-xs px-2"
                                  {...field} 
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    field.onChange(e.target.value)
                                    form.trigger(`land_types.${index}`)
                                    form.trigger('land_types')
                                  }}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value)
                                    if (!isNaN(val)) field.onChange(val.toFixed(4))
                                    field.onBlur()
                                    form.trigger(`land_types.${index}`)
                                    form.trigger('land_types')
                                  }}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px] text-destructive font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Purpose Selection */}
                      <div className="col-span-4">
                        <FormField
                          control={form.control as any}
                          name={`land_types.${index}.use_purpose`}
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Use Purpose</FormLabel>
                              <FormControl>
                                <select
                                  value={field.value || 'EXCAVATION'}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                  {USE_PURPOSES.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Nested Sub-Types FieldArray */}
                      <SubTypeList nestIndex={index} control={form.control} form={form} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stepper Footer Controls */}
            <DialogFooter className="pt-3 border-t flex justify-between items-center sm:justify-between">
              <div>
                {currentStep === 2 && (
                  <Button type="button" variant="outline" size="sm" onClick={handleBack} disabled={loading}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>

                {currentStep === 1 ? (
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleNext()
                    }}
                  >
                    Next Step <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {editPlotId ? 'Update Plot' : 'Save Plot & Finish'}
                  </Button>
                )}
              </div>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
