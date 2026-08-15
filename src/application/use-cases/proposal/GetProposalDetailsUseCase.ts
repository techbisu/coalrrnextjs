/**
 * Get Proposal Details Use Case - Data retrieval for the UI.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository'
import { NotFoundException } from '@/core/errors'
import { formatPlotHumanReadable } from '@/shared/utils/plot.utils'
import { db } from '@/lib/db'

export interface GetProposalDetailsRequest {
  proposalId: string
}

// Complex DTO for the UI
export interface GetProposalDetailsResponse {
  id: string
  schedule_code: string
  project_id: string
  projectName: string
  projectBudgetCeiling: string
  projectLandLimit: string
  projectEmploymentQuota: string
  project_state_lgd: string
  projectMouzas: string[]
  acq_mode_id: number
  state: string
  proposal_title: string
  description: string
  proposed_by: string
  proposed_by_role: string
  area_office: string
  mine_cd: string
  adjacent_colliery: string
  total_area_acres: string
  notification_date: string | null
  mode_specific_checklist: string
  rate_tenancy_with_emp?: string
  rate_tenancy_no_emp?: string
  rate_govt_land?: string
  rate_forest_land?: string
  plots_locked: boolean
  items: Array<{
    id: string
    plot_id: string
    plot_number: string
    mouza: string
    land_type: string
    area_acres: string
    annexure_tag: string
    is_active: boolean
  }>
  entry_ts: string
}

export class GetProposalDetailsUseCase implements IUseCase<GetProposalDetailsRequest, GetProposalDetailsResponse> {
  // Injecting the concrete Prisma repository because this use case is read-heavy 
  // and requires specific joins for UI aggregation, which is fine in CQRS.
  constructor(
    private readonly proposalRepository: PrismaAcqProposalRepository
  ) {}

  async execute(request: GetProposalDetailsRequest): Promise<Result<GetProposalDetailsResponse>> {
    const data = await this.proposalRepository.getProposalDetailsWithPlots(request.proposalId)
    
    if (!data) {
      return Fail('Proposal')
    }

    let adjacentCollieryName = data.pr_scheme_ref_no || ''
    if (adjacentCollieryName) {
      const areaMatch = await db.area.findFirst({
        where: { OR: [{ area_cd: adjacentCollieryName }, { area_en: adjacentCollieryName }] }
      })
      if (areaMatch) {
        adjacentCollieryName = areaMatch.area_en
      }
    }

    let totalArea = 0;
    const items = (data.plot_schedule || []).map((it: any) => {
      const landTypes = it.plot_schedule_land_type || [];
      const primaryLt = landTypes[0]?.landtype?.land_type || 'Tenancy';
      const subLt = landTypes[0]?.sub_landtype?.land_type;
      const purpose = landTypes[0]?.use_purpose;
      
      let landType = primaryLt;
      if (subLt) landType += ` (${subLt})`;
      if (purpose) landType += ` · ${purpose}`;

      let tag = 'A';
      if (it.acq_status === 'PURCHASED') {
        tag = 'B';
      } else if (it.acq_status === 'PARTIALLY_PURCHASED') {
        tag = 'C';
      } else {
        tag = 'A'; // Default clear land
      }

      // Deduct Annexure B (Purchased / Dropped) plots from total acquired acreage calculation
      if (tag !== 'B' && it.acq_status !== 'CANCELLED') {
        totalArea += Number(it.to_be_acquired_area) || 0;
      }

      const formattedPlot = formatPlotHumanReadable({
        plotTy: it.plot_ty,
        plotNumber: it.plot_number,
        bataNo: it.bata_no,
        fallbackPlotNo: it.plot_no,
        stateLgd: data.project?.state_lgd,
        mouzaLgd: it.mouza_lgd
      });

      const formattedOptPlot = (it.opt_plot || it.opt_plot_number) ? formatPlotHumanReadable({
        plotTy: it.opt_plot_ty,
        plotNumber: it.opt_plot || it.opt_plot_number,
        bataNo: it.opt_bata,
        fallbackPlotNo: it.opt_plot || it.opt_plot_number,
        stateLgd: data.project?.state_lgd,
        mouzaLgd: it.mouza_lgd
      }) : undefined;

      const breakdownMap = new Map<string, any>();
      landTypes.forEach((lt: any) => {
        const primaryName = lt.landtype?.land_type || 'Tenancy';
        const key = `${lt.landt_id}_${lt.area}_${lt.use_purpose || ''}`;
        
        if (!breakdownMap.has(key)) {
          breakdownMap.set(key, {
            primary_name: primaryName,
            primary_area: Number(lt.area || 0),
            use_purpose: lt.use_purpose || undefined,
            sub_types: []
          });
        }
        
        if (lt.sub_landtype) {
          breakdownMap.get(key).sub_types.push({
            sub_name: lt.sub_landtype.land_type,
            area_to_acquire: Number(lt.area_to_acquire || 0)
          });
        }
      });

      return {
        id: it.schedule_id.toString(),
        plot_id: it.schedule_id.toString(),
        plot_number: formattedPlot,
        opt_plot_number: formattedOptPlot,
        mouza: it.mouza?.mouza_en || 'Unknown',
        jl_no: it.jl_no || it.mouza?.jl_no || undefined,
        total_ror_area: Number(it.total_ror_area || 0),
        to_be_acquired_area: Number(it.to_be_acquired_area || 0),
        land_type: landType,
        land_types_breakdown: Array.from(breakdownMap.values()),
        area_acres: Number(it.to_be_acquired_area || 0).toString(),
        annexure_tag: tag,
        is_active: it.acq_status !== 'CANCELLED'
      };
    });

    const response: GetProposalDetailsResponse = {
      id: data.proposal_id.toString(),
      schedule_code: data.proposal_no,
      project_id: data.proj_cd,
      projectName: data.project ? `${data.project.projNm}${data.project.eclProjCd ? ` (${data.project.eclProjCd})` : ''}` : `Project ${data.proj_cd}`,
      projectBudgetCeiling: (data.project?.total_budget_ceiling || 0).toString(),
      projectLandLimit: (data.project?.total_land_limit_acres || 0).toString(),
      projectEmploymentQuota: (data.project?.total_employment_quota || 0).toString(),
      project_state_lgd: (data.project as any)?.state_lgd?.toString() || data.area?.state_lgd?.toString() || '',
      projectMouzas: data.project?.approvals
        ? Array.from(new Set(
            data.project.approvals.flatMap((a: any) => 
              a.locations?.map((l: any) => l.mouzaLgd?.toString()) || []
            ).filter(Boolean)
          ))
        : [],
      acq_mode_id: Number(data.acq_mode_id),
      state: data.overall_status,
      proposal_title: data.proposal_no,
      description: data.purpose_justification || '',
      proposed_by: data.entry_by || '',
      proposed_by_role: 'Initiator',
      area_office: data.area?.area_en || data.area_cd,
      mine_cd: (() => {
        const rawMine = data.mine?.mine_en || data.mine_cd;
        const rawArea = data.area?.area_en || data.area_cd;
        if (!rawMine || rawMine === 'UNK') return '';
        if (rawMine === rawArea) return ''; // don't repeat
        
        // If the area is "BANKOLA AREA" and mine is "BANKOLA AO", hide the mine since it's redundant
        const baseAreaName = rawArea.replace(/\s+AREA$/i, '');
        if (rawMine.replace(/\s+(AO|AREA)$/i, '') === baseAreaName) return '';
        
        return rawMine;
      })(),
      adjacent_colliery: adjacentCollieryName,
      total_area_acres: totalArea.toString(),
      notification_date: null, // No notification_dt column exists yet, so it's always unpublished
      mode_specific_checklist: '{"items":[]}',
      rate_tenancy_with_emp: data.rate_tenancy_land_with_emp?.toString() || '0',
      rate_tenancy_no_emp: data.rate_tenancy_land_no_emp?.toString() || '0',
      rate_govt_land: data.rate_govt_land?.toString() || '0',
      rate_forest_land: data.rate_forest_land?.toString() || '0',
      plots_locked: (data as any).plots_locked ?? false,
      items: items,
      entry_ts: new Date(data.proposal_dt).toISOString(),
    }

    return Ok(response)
  }
}
