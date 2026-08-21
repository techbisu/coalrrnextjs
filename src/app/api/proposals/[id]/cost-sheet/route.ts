import { NextRequest, NextResponse } from 'next/server'
import { acqProposalRepository, updateProposalCostSheetUseCase } from '@/infrastructure/di/Container'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proposal = await acqProposalRepository.getProposalById(id)

    if (!proposal) {
      return NextResponse.json({ error: `Proposal '${id}' not found` }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      proposal_id: id,
      cost_sheet: {
        total_land_cost_est: proposal.total_land_cost_est ?? 0,
        total_rehab_cost_est: proposal.total_rehab_cost_est ?? 0,
        total_employment_cost_est: proposal.total_employment_cost_est ?? 0,
        registration_cost_est: proposal.registration_cost_est ?? 0,
        mutation_cost_est: proposal.mutation_cost_est ?? 0,
        other_costs_est: proposal.other_costs_est ?? 0,
        grand_total_cost_est: proposal.grand_total_cost_est ?? 0,
        rate_tenancy_land_with_emp: proposal.rate_tenancy_land_with_emp ?? 0,
        rate_tenancy_land_no_emp: proposal.rate_tenancy_land_no_emp ?? 0,
        rate_govt_land: proposal.rate_govt_land ?? 0,
        rate_forest_land: proposal.rate_forest_land ?? 0,
        employment_proposed_count: proposal.employment_proposed_count ?? 0,
      }
    })
  } catch (error: any) {
    console.error('Error fetching proposal cost sheet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposal cost sheet' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const result = await updateProposalCostSheetUseCase.execute(id, body)

    if (!result.isSuccess) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update cost sheet' },
        { status: 400 }
      )
    }

    const updatedProp = result.value
    return NextResponse.json({
      success: true,
      proposal_id: id,
      cost_sheet: {
        total_land_cost_est: updatedProp.total_land_cost_est ?? 0,
        total_rehab_cost_est: updatedProp.total_rehab_cost_est ?? 0,
        total_employment_cost_est: updatedProp.total_employment_cost_est ?? 0,
        registration_cost_est: updatedProp.registration_cost_est ?? 0,
        mutation_cost_est: updatedProp.mutation_cost_est ?? 0,
        other_costs_est: updatedProp.other_costs_est ?? 0,
        grand_total_cost_est: updatedProp.grand_total_cost_est ?? 0,
        rate_tenancy_land_with_emp: updatedProp.rate_tenancy_land_with_emp ?? 0,
        rate_tenancy_land_no_emp: updatedProp.rate_tenancy_land_no_emp ?? 0,
        rate_govt_land: updatedProp.rate_govt_land ?? 0,
        rate_forest_land: updatedProp.rate_forest_land ?? 0,
        employment_proposed_count: updatedProp.employment_proposed_count ?? 0,
      }
    })
  } catch (error: any) {
    console.error('Error updating proposal cost sheet:', error)
    return NextResponse.json(
      { error: 'Failed to update proposal cost sheet' },
      { status: 500 }
    )
  }
}
