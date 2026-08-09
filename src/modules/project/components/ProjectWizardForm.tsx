'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProjectSchema, ProjectInput } from '@/shared/schemas/project.schema'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { 
  AreaSelect, 
  MineSelect, 
  DistrictSelect, 
  BlockSelect, 
  MouzaSelect 
} from '@/shared/components/coalrr/selects'
import { useMasterLookup } from '@/shared/hooks/useMasterLookup'
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2, Layers, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

export function ProjectWizardForm({
  mode = 'create',
  initialValues,
  projectId,
  onSuccess,
  onCancel,
}: {
  mode?: 'create' | 'edit'
  initialValues?: Partial<ProjectInput>
  projectId?: string
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const t = useAppTranslation('project')
  const [step, setStep] = React.useState<number>(1)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  const form = useForm<ProjectInput>({
    resolver: zodResolver(ProjectSchema) as any,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    values: initialValues ? {
      proj_cd: initialValues.proj_cd || '',
      ecl_proj_cd: initialValues.ecl_proj_cd || '',
      proj_nm: initialValues.proj_nm || '',
      area_cd: initialValues.area_cd || '',
      mine_cd: initialValues.mine_cd || '',
      state_lgd: initialValues.state_lgd || '',
      proj_status: initialValues.proj_status || 'ACTIVE',
      is_combo_project: initialValues.is_combo_project || false,
      linked_mine_codes: initialValues.linked_mine_codes || [],
      district_lgd: initialValues.district_lgd || '',
      block_lgds: initialValues.block_lgds || [],
      mouza_lgds: initialValues.mouza_lgds || [],
      approved_tenancy_area: initialValues.approved_tenancy_area || 0,
      approved_govt_area: initialValues.approved_govt_area || 0,
      approved_patta_area: initialValues.approved_patta_area || 0,
      approved_forest_area: initialValues.approved_forest_area || 0,
      approved_excavation_area: initialValues.approved_excavation_area || 0,
      approved_safety_zone_area: initialValues.approved_safety_zone_area || 0,
      approved_ob_dump_area: initialValues.approved_ob_dump_area || 0,
      approved_infra_area: initialValues.approved_infra_area || 0,
      approved_diversion_area: initialValues.approved_diversion_area || 0,
      approved_rehab_area: initialValues.approved_rehab_area || 0,
      land_budget: initialValues.land_budget || 0,
      rr_budget: initialValues.rr_budget || 0,
      sanctioned_employment_count: initialValues.sanctioned_employment_count || 0,
    } : undefined,
    defaultValues: {
      proj_cd: initialValues?.proj_cd || '',
      ecl_proj_cd: initialValues?.ecl_proj_cd || '',
      proj_nm: initialValues?.proj_nm || '',
      area_cd: initialValues?.area_cd || '',
      mine_cd: initialValues?.mine_cd || '',
      state_lgd: initialValues?.state_lgd || '',
      proj_status: initialValues?.proj_status || 'ACTIVE',
      is_combo_project: initialValues?.is_combo_project || false,
      linked_mine_codes: initialValues?.linked_mine_codes || [],
      district_lgd: initialValues?.district_lgd || '',
      block_lgds: initialValues?.block_lgds || [],
      mouza_lgds: initialValues?.mouza_lgds || [],
      approved_tenancy_area: initialValues?.approved_tenancy_area || 0,
      approved_govt_area: initialValues?.approved_govt_area || 0,
      approved_patta_area: initialValues?.approved_patta_area || 0,
      approved_forest_area: initialValues?.approved_forest_area || 0,
      approved_excavation_area: initialValues?.approved_excavation_area || 0,
      approved_safety_zone_area: initialValues?.approved_safety_zone_area || 0,
      approved_ob_dump_area: initialValues?.approved_ob_dump_area || 0,
      approved_infra_area: initialValues?.approved_infra_area || 0,
      approved_diversion_area: initialValues?.approved_diversion_area || 0,
      approved_rehab_area: initialValues?.approved_rehab_area || 0,
      land_budget: initialValues?.land_budget || 0,
      rr_budget: initialValues?.rr_budget || 0,
      sanctioned_employment_count: initialValues?.sanctioned_employment_count || 0,
    },
  })

  const { register, handleSubmit, watch, setValue, control, trigger, formState: { errors } } = form

  const selectedArea = watch('area_cd')
  const selectedMine = watch('mine_cd')
  const selectedState = watch('state_lgd')
  const selectedDistrict = watch('district_lgd')
  const selectedBlocks = watch('block_lgds')
  const projNm = watch('proj_nm')
  const isCombo = watch('is_combo_project')

  // Watch Type-Wise Land Areas
  const tenancyArea = Number(watch('approved_tenancy_area') || 0)
  const govtArea = Number(watch('approved_govt_area') || 0)
  const forestArea = Number(watch('approved_forest_area') || 0)
  const pattaArea = Number(watch('approved_patta_area') || 0)
  
  // Total Type-Wise Area Sum
  const totalTypeWiseArea = tenancyArea + govtArea + forestArea + pattaArea

  // Watch Use-Wise Operational Areas
  const excavationArea = Number(watch('approved_excavation_area') || 0)
  const safetyArea = Number(watch('approved_safety_zone_area') || 0)
  const obDumpArea = Number(watch('approved_ob_dump_area') || 0)
  const infraArea = Number(watch('approved_infra_area') || 0)
  const diversionArea = Number(watch('approved_diversion_area') || 0)
  const rehabArea = Number(watch('approved_rehab_area') || 0)

  // Total Use-Wise Area Sum
  const totalUseWiseArea = excavationArea + safetyArea + obDumpArea + infraArea + diversionArea + rehabArea

  // Sync total_land_limit_acres
  React.useEffect(() => {
    setValue('total_land_limit_acres', totalTypeWiseArea)
  }, [totalTypeWiseArea, setValue])

  // Lookup area master options to extract state_lgd and short_nm
  const { data: areaLookupData } = useMasterLookup({ masterName: 'area_master' })

  // Auto-detect state_lgd when Area changes
  React.useEffect(() => {
    if (selectedArea && areaLookupData?.options) {
      const foundArea = areaLookupData.options.find((opt: any) => opt.value === selectedArea)
      if (foundArea?.data?.state_lgd) {
        setValue('state_lgd', String(foundArea.data.state_lgd))
      }
    }
  }, [selectedArea, areaLookupData, setValue])

  // Auto-generate code previews
  const areaShortNm = React.useMemo(() => {
    if (!selectedArea) return 'AREA'
    const found = areaLookupData?.options?.find((opt: any) => opt.value === selectedArea)
    const short = found?.data?.short_nm
    return (short && String(short).trim() !== '') ? String(short).trim() : selectedArea
  }, [selectedArea, areaLookupData])

  const generatedProjCdPreview = React.useMemo(() => {
    const st = selectedState || '19'
    const ar = selectedArea || 'AREA'
    const mn = selectedMine || 'MINE'
    return `${st}${ar}${mn}0001`
  }, [selectedState, selectedArea, selectedMine])

  const generatedEclProjCdPreview = React.useMemo(() => {
    const mn = selectedMine || 'MINE'
    return `ECL/${areaShortNm}/${mn}/0001`
  }, [areaShortNm, selectedMine])

  // Keep ecl_proj_cd updated in form value
  React.useEffect(() => {
    setValue('ecl_proj_cd', generatedEclProjCdPreview)
    setValue('proj_cd', generatedProjCdPreview)
  }, [generatedEclProjCdPreview, generatedProjCdPreview, setValue])

  // Handle Step Navigation with Validation
  const handleNextStep = async () => {
    if (step === 1) {
      const valid = await trigger(['proj_nm', 'area_cd', 'mine_cd'])
      if (!valid) {
        toast.error('Please fill required fields (Project Name, Area, Mine)')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (totalTypeWiseArea <= 0) {
        toast.error('Please enter at least one type-wise approved land limit (Tenancy, Govt, or Forest)')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (totalUseWiseArea > totalTypeWiseArea) {
        toast.error(`Use-wise operational land sum (${totalUseWiseArea.toFixed(2)} ac) cannot exceed Total Approved PR Land limit (${totalTypeWiseArea.toFixed(2)} ac)`)
        return
      }
      setStep(4)
    }
  }

  const onSubmit = async (data: ProjectInput) => {
    if (totalUseWiseArea > totalTypeWiseArea) {
      toast.error(`Use-wise operational land sum (${totalUseWiseArea.toFixed(2)} ac) cannot exceed Total Approved PR Land limit (${totalTypeWiseArea.toFixed(2)} ac)`)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        approved_tenancy_area: Number.isNaN(Number(data.approved_tenancy_area)) ? 0 : Number(data.approved_tenancy_area),
        approved_govt_area: Number.isNaN(Number(data.approved_govt_area)) ? 0 : Number(data.approved_govt_area),
        approved_patta_area: Number.isNaN(Number(data.approved_patta_area)) ? 0 : Number(data.approved_patta_area),
        approved_forest_area: Number.isNaN(Number(data.approved_forest_area)) ? 0 : Number(data.approved_forest_area),
        approved_excavation_area: Number.isNaN(Number(data.approved_excavation_area)) ? 0 : Number(data.approved_excavation_area),
        approved_safety_zone_area: Number.isNaN(Number(data.approved_safety_zone_area)) ? 0 : Number(data.approved_safety_zone_area),
        approved_ob_dump_area: Number.isNaN(Number(data.approved_ob_dump_area)) ? 0 : Number(data.approved_ob_dump_area),
        approved_infra_area: Number.isNaN(Number(data.approved_infra_area)) ? 0 : Number(data.approved_infra_area),
        approved_diversion_area: Number.isNaN(Number(data.approved_diversion_area)) ? 0 : Number(data.approved_diversion_area),
        approved_rehab_area: Number.isNaN(Number(data.approved_rehab_area)) ? 0 : Number(data.approved_rehab_area),
        land_budget: Number.isNaN(Number(data.land_budget)) ? 0 : Number(data.land_budget),
        rr_budget: Number.isNaN(Number(data.rr_budget)) ? 0 : Number(data.rr_budget),
        sanctioned_employment_count: Number.isNaN(Number(data.sanctioned_employment_count)) ? 0 : Number(data.sanctioned_employment_count),
        total_land_limit_acres: totalTypeWiseArea,
        proj_cd: data.proj_cd && data.proj_cd.trim() !== '' ? data.proj_cd : generatedProjCdPreview,
        ecl_proj_cd: data.ecl_proj_cd && data.ecl_proj_cd.trim() !== '' ? data.ecl_proj_cd : generatedEclProjCdPreview,
      }

      const url = mode === 'edit' && projectId ? `/api/projects/${projectId}` : '/api/projects'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? `Failed to ${mode} project baseline`)

      toast.success(`Project Baseline ${mode === 'edit' ? 'Updated' : 'Created'}`, {
        description: `Project PR Report baseline for "${data.proj_nm}" ${mode === 'edit' ? 'updated' : 'registered'} successfully.`,
      })
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message || 'Error creating project baseline')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (step < 4) {
            handleNextStep()
          }
        }
      }}
      className="space-y-4"
    >
      {/* Stepper Progress Header */}
      <div className="flex items-center justify-between border-b pb-3 text-xs font-medium text-muted-foreground">
        <div className={`flex items-center gap-1 ${step >= 1 ? 'font-bold text-amber-600' : ''}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800">1</span>
          Area & Mine
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <div className={`flex items-center gap-1 ${step >= 2 ? 'font-bold text-amber-600' : ''}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800">2</span>
          Type-Wise Baseline
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <div className={`flex items-center gap-1 ${step >= 3 ? 'font-bold text-amber-600' : ''}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800">3</span>
          Use-Wise Baseline
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <div className={`flex items-center gap-1 ${step >= 4 ? 'font-bold text-amber-600' : ''}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800">4</span>
          Financials & Quota
        </div>
      </div>

      {/* STEP 1: Basic & Location Master Selection */}
      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Area Master Dropdown */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-foreground">Area Master Dropdown *</Label>
            <Controller
              name="area_cd"
              control={control}
              render={({ field }) => (
                <AreaSelect
                  ignoreScope
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val)
                    setValue('mine_cd', '')
                  }}
                  placeholder="Select Area..."
                  className="w-full text-xs"
                />
              )}
            />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.area_cd?.message}</div>
          </div>

          {/* Mine Master Dropdown (Dependent on Area) */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-foreground">Mine / Colliery Dropdown *</Label>
            <Controller
              name="mine_cd"
              control={control}
              render={({ field }) => (
                <MineSelect
                  areaCd={selectedArea}
                  ignoreScope
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Mine..."
                  disabled={!selectedArea}
                  className="w-full text-xs"
                />
              )}
            />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.mine_cd?.message}</div>
          </div>

          {/* Project Name */}
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs font-medium text-foreground">Project Name *</Label>
            <Input {...register('proj_nm')} placeholder="e.g. Bhubaneswari OCP Phase-III 3.0 MTY" />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.proj_nm?.message}</div>
          </div>

          {/* ECL Project Code (Readonly Mode) */}
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">ECL Project Reference Code (Readonly)</Label>
            <Input 
              value={generatedEclProjCdPreview} 
              readOnly 
              disabled 
              className="bg-muted font-mono font-bold text-xs text-foreground cursor-not-allowed" 
            />
          </div>

          {/* Cascading Revenue Location Section (District -> Multi-Select Block -> Multi-Select Mouza) */}
          <div className="sm:col-span-2 rounded-lg border p-3 bg-muted/20 space-y-3 border-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <MapPin className="h-3.5 w-3.5 text-amber-600" /> Revenue Administrative Location (State Auto-Detected)
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* District Dropdown (Filtered by State LGD) */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">District Dropdown *</Label>
                <Controller
                  name="district_lgd"
                  control={control}
                  render={({ field }) => (
                    <DistrictSelect
                      stateLgd={selectedState}
                      value={field.value ? String(field.value) : undefined}
                      onChange={(val) => {
                        field.onChange(val)
                        setValue('block_lgds', [])
                        setValue('mouza_lgds', [])
                      }}
                      placeholder={selectedArea ? "Select District..." : "Select Area first..."}
                      disabled={!selectedArea}
                      className="w-full text-xs"
                    />
                  )}
                />
              </div>

              {/* Block Multi-Select Dropdown (Filtered by District LGD) */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Block Dropdown (Multi-Select)</Label>
                <Controller
                  name="block_lgds"
                  control={control}
                  render={({ field }) => (
                    <BlockSelect
                      districtLgd={selectedDistrict}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        setValue('mouza_lgds', [])
                      }}
                      placeholder={selectedDistrict ? "Select Blocks..." : "Select District first..."}
                      isMulti
                      disabled={!selectedDistrict}
                      className="w-full text-xs"
                    />
                  )}
                />
              </div>

              {/* Mouza Multi-Select Dropdown (Filtered by District LGD) */}
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-medium text-foreground">Mapped Mouzas (Multi-Select Mouza Master)</Label>
                <Controller
                  name="mouza_lgds"
                  control={control}
                  render={({ field }) => (
                    <MouzaSelect
                      districtLgd={selectedDistrict}
                      blockLgd={selectedBlocks}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={selectedBlocks && selectedBlocks.length > 0 ? "Select Mouzas (Villages)..." : "Select District/Blocks first..."}
                      isMulti
                      disabled={!selectedBlocks || selectedBlocks.length === 0}
                      className="w-full text-xs"
                    />
                  )}
                />
                <p className="text-[10px] text-muted-foreground">Select revenue villages/mouzas under which plot schedules for this project are located.</p>
              </div>
            </div>
          </div>

          {/* Combo Mine Toggle */}
          <div className="sm:col-span-2 rounded-md border p-3 bg-card space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isCombo}
                onChange={(e) => setValue('is_combo_project', e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <strong>Combined / Combo Mines Project</strong> (Spans multiple colliery units under 1 PR Report)
              </span>
            </label>

            {isCombo && (
              <div className="pt-2 border-t space-y-1">
                <Label className="text-xs font-medium text-foreground">Linked Colliery Units (Select adjacent mines in this combo project)</Label>
                <Controller
                  name="linked_mine_codes"
                  control={control}
                  render={({ field }) => (
                    <MineSelect
                      areaCd={selectedArea}
                      ignoreScope
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select Linked Mines..."
                      isMulti
                      className="w-full text-xs"
                    />
                  )}
                />
                <p className="text-[10px] text-muted-foreground">Plot schedules and baseline limits will be merged across all selected colliery units.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Type-Wise Approved PR Baseline (Acres) */}
      {step === 2 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h4 className="text-xs font-semibold text-foreground">Table 6: Type-Wise Approved PR Land Baseline (Acres)</h4>
            <p className="text-[11px] text-muted-foreground">Enter statutory land category limits as approved in the Project Report.</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Tenancy Land Limit (Acres)</Label>
            <Input type="number" step="0.0001" {...register('approved_tenancy_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_tenancy_area?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Government Land Limit (Acres)</Label>
            <Input type="number" step="0.0001" {...register('approved_govt_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_govt_area?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Forest Land Limit (Acres)</Label>
            <Input type="number" step="0.0001" {...register('approved_forest_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_forest_area?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Patta Land Limit (Acres)</Label>
            <Input type="number" step="0.0001" {...register('approved_patta_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_patta_area?.message}</div>
          </div>

          {/* Type-Wise Total Summary Card */}
          <div className="sm:col-span-2 rounded-lg border bg-amber-50/50 p-3 border-amber-200/80 dark:bg-amber-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs">
              <MapPin className="h-4 w-4 text-amber-600" />
              <span><strong>Total Approved PR Land Area:</strong></span>
            </div>
            <div className="font-mono text-base font-bold text-amber-900 dark:text-amber-200">
              {totalTypeWiseArea.toFixed(4)} Acres
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Use-Wise Approved PR Baseline (Acres) */}
      {step === 3 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Informational Summary Badge of Total Land Area from Step 2 */}
          <div className="sm:col-span-2 rounded-lg border p-3 bg-muted/40 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Approved PR Land Limit (from Step 2)</span>
              <div className="font-mono text-sm font-extrabold text-foreground">{totalTypeWiseArea.toFixed(4)} Acres</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Use-Wise Operational Sum</span>
              <div className={`font-mono text-sm font-extrabold ${totalUseWiseArea > totalTypeWiseArea ? 'text-destructive' : 'text-emerald-600'}`}>
                {totalUseWiseArea.toFixed(4)} Acres
              </div>
            </div>
          </div>

          {/* Warning banner if operational sum exceeds total approved land limit */}
          {totalUseWiseArea > totalTypeWiseArea && (
            <div className="sm:col-span-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>Limit Exceeded:</strong> Use-wise operational land sum ({totalUseWiseArea.toFixed(4)} ac) exceeds Total Approved PR Land limit ({totalTypeWiseArea.toFixed(4)} ac). Please adjust operational areas under the total land limit.
              </span>
            </div>
          )}

          <div className="sm:col-span-2">
            <h4 className="text-xs font-semibold text-foreground">Table 7: Use-Wise Approved PR Land Baseline (Acres)</h4>
            <p className="text-[11px] text-muted-foreground">Enter mine operational land usage limits from approved PR Report (Sum must be ≤ {totalTypeWiseArea.toFixed(2)} ac).</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Excavating Area (Quarry) [Acres]</Label>
            <Input type="number" step="0.0001" {...register('approved_excavation_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_excavation_area?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Safety Zone / Barrier [Acres]</Label>
            <Input type="number" step="0.0001" {...register('approved_safety_zone_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_safety_zone_area?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Overburden (OB) Dump [Acres]</Label>
            <Input type="number" step="0.0001" {...register('approved_ob_dump_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_ob_dump_area?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Infrastructure & Colony [Acres]</Label>
            <Input type="number" step="0.0001" {...register('approved_infra_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_infra_area?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Diversions (Road/River/HT) [Acres]</Label>
            <Input type="number" step="0.0001" {...register('approved_diversion_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_diversion_area?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Rehabilitation Site for PAFs [Acres]</Label>
            <Input type="number" step="0.0001" {...register('approved_rehab_area', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.approved_rehab_area?.message}</div>
          </div>
        </div>
      )}

      {/* STEP 4: Financial & Employment Quotas */}
      {step === 4 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h4 className="text-xs font-semibold text-foreground">Financial & Employment Sanctioned Limits</h4>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Total Land Acquisition Budget [₹]</Label>
            <Input type="number" {...register('land_budget', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.land_budget?.message}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Total R&R Rehabilitation Budget [₹]</Label>
            <Input type="number" {...register('rr_budget', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.rr_budget?.message}</div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Sanctioned Employment Quota (Jobs)</Label>
            <Input type="number" {...register('sanctioned_employment_count', { valueAsNumber: true })} />
            <div className="min-h-[1.25rem] text-[11px] text-destructive">{errors.sanctioned_employment_count?.message}</div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-3 border-t">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}

        {step < 4 ? (
          <Button type="button" onClick={(e) => { e.preventDefault(); handleNextStep(); }}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting || totalUseWiseArea > totalTypeWiseArea} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            {mode === 'edit' ? 'Save Changes' : 'Register Project Baseline'}
          </Button>
        )}
      </div>
    </form>
  )
}
