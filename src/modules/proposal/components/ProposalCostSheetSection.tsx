'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from 'sonner'
import {
  Calculator,
  IndianRupee,
  Save,
  RefreshCw,
  Sparkles,
  FileCheck2,
  Building2,
  TreePine,
  Landmark,
  Users,
  ShieldAlert,
  Info
} from 'lucide-react'

export interface ProposalCostSheetSectionProps {
  proposalId: string
  readOnly?: boolean
}

const formatRupee = (val: number) => {
  if (isNaN(val) || val === null || val === undefined) return '₹ 0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val)
}

const formatLakhsCrores = (val: number) => {
  if (isNaN(val) || val <= 0) return '0.00'
  if (val >= 10000000) {
    return `${(val / 10000000).toFixed(2)} Cr`
  } else if (val >= 100000) {
    return `${(val / 100000).toFixed(2)} Lakhs`
  }
  return val.toLocaleString('en-IN')
}

export function ProposalCostSheetSection({ proposalId, readOnly = false }: ProposalCostSheetSectionProps) {
  const queryClient = useQueryClient()

  // Fetch Cost Sheet Data
  const { data: costSheetData, isLoading: isLoadingCost, isError: isErrorCost } = useQuery({
    queryKey: ['proposal-cost-sheet', proposalId],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${proposalId}/cost-sheet`)
      if (!res.ok) throw new Error('Failed to load cost sheet')
      const json = await res.json()
      return json.cost_sheet
    },
    enabled: !!proposalId
  })

  // Fetch Mouza Abstract Data for live acreage readout
  const { data: abstractData } = useQuery({
    queryKey: ['mouza-abstract', proposalId],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${proposalId}/mouza-abstract`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!proposalId
  })

  // Form State
  const [form, setForm] = React.useState({
    total_land_cost_est: 0,
    registration_cost_est: 0,
    mutation_cost_est: 0,
    total_rehab_cost_est: 0,
    total_employment_cost_est: 0,
    other_costs_est: 0,
    rate_tenancy_land_with_emp: 0,
    rate_tenancy_land_no_emp: 0,
    rate_govt_land: 0,
    rate_forest_land: 0,
  })

  // Sync form state when backend data loads
  React.useEffect(() => {
    if (costSheetData) {
      setForm({
        total_land_cost_est: costSheetData.total_land_cost_est || 0,
        registration_cost_est: costSheetData.registration_cost_est || 0,
        mutation_cost_est: costSheetData.mutation_cost_est || 0,
        total_rehab_cost_est: costSheetData.total_rehab_cost_est || 0,
        total_employment_cost_est: costSheetData.total_employment_cost_est || 0,
        other_costs_est: costSheetData.other_costs_est || 0,
        rate_tenancy_land_with_emp: costSheetData.rate_tenancy_land_with_emp || 0,
        rate_tenancy_land_no_emp: costSheetData.rate_tenancy_land_no_emp || 0,
        rate_govt_land: costSheetData.rate_govt_land || 0,
        rate_forest_land: costSheetData.rate_forest_land || 0,
      })
    }
  }, [costSheetData])

  // Calculated Grand Total
  const grandTotal = React.useMemo(() => {
    return (
      (form.total_land_cost_est || 0) +
      (form.registration_cost_est || 0) +
      (form.mutation_cost_est || 0) +
      (form.total_rehab_cost_est || 0) +
      (form.total_employment_cost_est || 0) +
      (form.other_costs_est || 0)
    )
  }, [form])

  // Mutation to Save Cost Sheet
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        grand_total_cost_est: grandTotal
      }
      const res = await fetch(`/api/proposals/${proposalId}/cost-sheet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save cost sheet')
      return data
    },
    onSuccess: () => {
      toast.success('Cost calculation sheet saved successfully')
      queryClient.invalidateQueries({ queryKey: ['proposal-cost-sheet', proposalId] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save cost calculation sheet')
    }
  })

  // Auto-Calculate Normative Figures from Mouza Abstract Acreages
  const handleAutoCalculateNormative = () => {
    const areas = abstractData?.grand_totals?.land_type_areas || {}
    const tenancyAc = areas['Tenancy / Rayati'] || areas['Tenancy'] || 0
    const govtAc = areas['Govt'] || areas['Govt Land'] || 0
    const forestAc = areas['Forest'] || areas['Forest Land'] || 0

    // Baseline rates fallback if not set
    const tenancyRate = form.rate_tenancy_land_with_emp || 1500000 // default 15L/Ac
    const govtRate = form.rate_govt_land || 500000                // default 5L/Ac
    const forestRate = form.rate_forest_land || 1200000            // default 12L/Ac

    const estimatedLandCost = (tenancyAc * tenancyRate) + (govtAc * govtRate) + (forestAc * forestRate)
    const estimatedRegCost = Math.round(estimatedLandCost * 0.06) // 6% stamp duty & registration
    const estimatedMutationCost = Math.round(estimatedLandCost * 0.01) // 1% mutation & record processing

    // Normative R&R Provision (₹ 2L per tenancy acre)
    const estimatedRehabCost = Math.round(tenancyAc * 200000)

    // Normative Employment Liability (1 job per 2 Ac)
    const estimatedNominees = Math.floor(tenancyAc / 2.0)
    const estimatedEmpCost = estimatedNominees * 5000000 // 50L provision per nominee

    // Normative Solatium & Contingencies (10% of land cost)
    const estimatedOtherCost = Math.round(estimatedLandCost * 0.10)

    setForm(prev => ({
      ...prev,
      rate_tenancy_land_with_emp: tenancyRate,
      rate_govt_land: govtRate,
      rate_forest_land: forestRate,
      total_land_cost_est: Math.round(estimatedLandCost),
      registration_cost_est: estimatedRegCost,
      mutation_cost_est: estimatedMutationCost,
      total_rehab_cost_est: estimatedRehabCost,
      total_employment_cost_est: estimatedEmpCost,
      other_costs_est: estimatedOtherCost
    }))

    toast.info('Normative cost estimate generated based on plot acreages & baseline rates')
  }

  if (isLoadingCost) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Loading Land Acquisition Cost Calculation Sheet...</p>
      </div>
    )
  }

  if (isErrorCost) {
    return (
      <div className="p-6 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 text-xs">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-4 w-4 text-rose-600" />
          <span>Error loading cost sheet</span>
        </div>
        <p className="mt-1 text-muted-foreground">Unable to fetch cost calculation data for proposal '{proposalId}'.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border/60 bg-gradient-to-r from-emerald-900/10 via-background to-background shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 dark:bg-emerald-950 dark:text-emerald-300">
                  CIL / ECL Land SOP § 4
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  Proposal: {proposalId}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground mt-1">
                <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Land Acquisition Financial Cost Calculation Sheet
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Normative financial estimation for land acquisition, registration, mutation, R&R, employment liability, and statutory contingencies.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoCalculateNormative}
                  className="text-xs gap-1.5 border-emerald-300 hover:bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  Auto-Calculate Normative
                </Button>
              )}
              {!readOnly && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  {saveMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save Cost Sheet
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Baseline Rates & Mouza Readout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Baseline Rates Input Panel */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="py-3 bg-muted/30 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-emerald-600" />
              1. Land Category Baseline Rates (₹ / Acre)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  Tenancy Rate (With Employment)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    disabled={readOnly}
                    value={form.rate_tenancy_land_with_emp || ''}
                    onChange={(e) => setForm({ ...form, rate_tenancy_land_with_emp: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 1500000"
                    className="h-8 pl-7 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{formatLakhsCrores(form.rate_tenancy_land_with_emp)} / Ac</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                  Tenancy Rate (Monetary / No Emp)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    disabled={readOnly}
                    value={form.rate_tenancy_land_no_emp || ''}
                    onChange={(e) => setForm({ ...form, rate_tenancy_land_no_emp: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 3000000"
                    className="h-8 pl-7 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{formatLakhsCrores(form.rate_tenancy_land_no_emp)} / Ac</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Landmark className="h-3.5 w-3.5 text-teal-600" />
                  Govt Land Rate (Transfer Fee)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    disabled={readOnly}
                    value={form.rate_govt_land || ''}
                    onChange={(e) => setForm({ ...form, rate_govt_land: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 500000"
                    className="h-8 pl-7 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{formatLakhsCrores(form.rate_govt_land)} / Ac</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <TreePine className="h-3.5 w-3.5 text-emerald-700" />
                  Forest Land Rate (NPV & CA)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    disabled={readOnly}
                    value={form.rate_forest_land || ''}
                    onChange={(e) => setForm({ ...form, rate_forest_land: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 1200000"
                    className="h-8 pl-7 text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{formatLakhsCrores(form.rate_forest_land)} / Ac</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acreage Readout Card */}
        <Card className="border-border/60 shadow-sm bg-muted/20">
          <CardHeader className="py-3 bg-muted/30 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              Mouza Plot Schedule Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-1.5 border-b">
              <span className="text-muted-foreground">Total Proposal Mouzas:</span>
              <span className="font-semibold text-foreground">{abstractData?.grand_totals?.total_mouzas || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b">
              <span className="text-muted-foreground">Total Acquired Plots:</span>
              <span className="font-semibold text-foreground">{abstractData?.grand_totals?.total_plots || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b">
              <span className="text-muted-foreground">Net Acquired Acreage:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {abstractData?.grand_totals?.total_area_acres?.toFixed(4) || '0.0000'} Acres
              </span>
            </div>

            <div className="pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">Category Acreage Breakdown:</span>
              <div className="space-y-1">
                {Object.entries(abstractData?.grand_totals?.land_type_areas || {}).map(([cat, area]: any) => (
                  <div key={cat} className="flex justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">{cat}:</span>
                    <span className="font-semibold">{Number(area).toFixed(4)} Ac</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Calculation Sheet Breakdown Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="py-3 bg-muted/40 border-b">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            2. Detailed Financial Cost Calculation Sheet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground border-b text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Sl No.</th>
                  <th className="py-2.5 px-4">Financial Cost Head / Line Item</th>
                  <th className="py-2.5 px-4">Normative / Estimation Basis</th>
                  <th className="py-2.5 px-4 text-right">Estimated Amount (₹)</th>
                  <th className="py-2.5 px-4 text-right">Rupee Representation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* 1. Land Cost */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">01</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                      Land Acquisition Cost (total_land_cost_est)
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Base land valuation across Rayati, Govt, and Forest categories.
                    </p>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono">
                    Sum (Category Area × Rate per Acre)
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      disabled={readOnly}
                      value={form.total_land_cost_est || ''}
                      onChange={(e) => setForm({ ...form, total_land_cost_est: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-44 ml-auto text-right font-mono text-xs font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatRupee(form.total_land_cost_est)}
                  </td>
                </tr>

                {/* 2. Registration Cost */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">02</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-teal-600" />
                      Registration & Stamp Duty Cost (registration_cost_est)
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      State Government stamp duty, deed registration & court fee provision.
                    </p>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono">
                    Approx. 6% of base land acquisition cost
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      disabled={readOnly}
                      value={form.registration_cost_est || ''}
                      onChange={(e) => setForm({ ...form, registration_cost_est: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-44 ml-auto text-right font-mono text-xs font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-teal-600 dark:text-teal-400">
                    {formatRupee(form.registration_cost_est)}
                  </td>
                </tr>

                {/* 3. Mutation Cost */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">03</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-amber-600" />
                      Mutation Fee & Record Processing (mutation_cost_est)
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Revenue record mutation, demarcation, & BL&LRO processing fee.
                    </p>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono">
                    Approx. 1% of land cost or statutory per-plot mutation fee
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      disabled={readOnly}
                      value={form.mutation_cost_est || ''}
                      onChange={(e) => setForm({ ...form, mutation_cost_est: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-44 ml-auto text-right font-mono text-xs font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                    {formatRupee(form.mutation_cost_est)}
                  </td>
                </tr>

                {/* 4. R&R Cost */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">04</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-indigo-600" />
                      R&R / Rehabilitation Package (total_rehab_cost_est)
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Resettlement grant, shifting allowance, house structure provision, & PAF package.
                    </p>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono">
                    Normative provision (₹ 2.00 Lakhs / Tenancy Acre)
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      disabled={readOnly}
                      value={form.total_rehab_cost_est || ''}
                      onChange={(e) => setForm({ ...form, total_rehab_cost_est: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-44 ml-auto text-right font-mono text-xs font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatRupee(form.total_rehab_cost_est)}
                  </td>
                </tr>

                {/* 5. Employment Liability */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">05</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-violet-600" />
                      Employment Package Financial Liability (total_employment_cost_est)
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Financial reserve for direct employment nominees or monetary compensation in lieu.
                    </p>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono">
                    Floor(Tenancy Ac / 2.00) × Package Rate
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      disabled={readOnly}
                      value={form.total_employment_cost_est || ''}
                      onChange={(e) => setForm({ ...form, total_employment_cost_est: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-44 ml-auto text-right font-mono text-xs font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-violet-600 dark:text-violet-400">
                    {formatRupee(form.total_employment_cost_est)}
                  </td>
                </tr>

                {/* 6. Other Statutory Costs */}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">06</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                      Other Statutory Fees & Contingency (other_costs_est)
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Solatium premium, statutory interest, administrative charges to State Govt, & contingencies.
                    </p>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono">
                    Approx. 10% of land acquisition cost
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      disabled={readOnly}
                      value={form.other_costs_est || ''}
                      onChange={(e) => setForm({ ...form, other_costs_est: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-44 ml-auto text-right font-mono text-xs font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                    {formatRupee(form.other_costs_est)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Prominent Grand Total Financial Summary Banner */}
      <div className="rounded-xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 p-5 text-emerald-50 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-bold text-xs">
                GRAND TOTAL ESTIMATION
              </Badge>
              <span className="text-xs text-emerald-300/80 font-mono">
                Sum of Line Items 01 through 06
              </span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Total Acquisition Financial Commitment:
            </h3>
          </div>

          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300 drop-shadow-sm">
              {formatRupee(grandTotal)}
            </p>
            <p className="text-xs text-emerald-200/80 font-semibold font-mono mt-0.5">
              ({formatLakhsCrores(grandTotal)})
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
