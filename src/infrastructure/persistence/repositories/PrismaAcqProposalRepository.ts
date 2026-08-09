import { IProposalRepository, ProposalDTO, PlotScheduleDTO, PlotScheduleLandTypeDTO } from '@/domain/entities/proposal';
import { db } from '@/lib/db';
import { Proposal, ProposalId, ScheduleCode, AcquisitionMode, ProposalState, Checklist } from '@/domain/entities/proposal';
import { Area } from '@/domain/value-objects/Area';
import { UserScopeService } from '@/core/authorization/services/UserScopeService';

export class PrismaAcqProposalRepository implements IProposalRepository {
  constructor() {}

  // --- DDD Interface ---

  async findById(id: string, tx?: any): Promise<Proposal | null> {
    const client = tx || db;
    const prop = await client.acq_proposal.findUnique({
      where: { proposal_id: id },
      include: {
        plot_schedule: true
      }
    });

    if (!prop) return null;

    let modeVal = 'cba_act';
    if (Number(prop.acq_mode_id) === 2 || Number(prop.acq_mode_id) === 5) modeVal = 'rfctlarr';
    if (Number(prop.acq_mode_id) === 3 || Number(prop.acq_mode_id) === 6) modeVal = 'direct_purchase';

    const plots = prop.plot_schedule.map(p => p.plot_no);

    return Proposal.reconstitute({
      id: prop.proposal_id.toString(),
      scheduleCode: prop.proposal_no,
      projectId: prop.proj_cd,
      acquisitionMode: modeVal,
      state: prop.current_stage_cd,
      proposalTitle: prop.purpose_justification,
      description: prop.purpose_justification,
      proposedBy: prop.entry_by || 'system',
      proposedByRole: 'system',
      areaOffice: prop.area_cd,
      collieryCode: prop.mine_cd,
      adjacentColliery: '',
      totalAreaAcres: (prop.tot_acq_area || 0).toString(),
      notificationDate: prop.proposal_dt,
      modeSpecificChecklist: '{}',
      proposalType: prop.proposal_type || 'STANDARD_LAP',
      rateTenancyWithEmp: Number(prop.rate_tenancy_land_with_emp || 0),
      rateTenancyNoEmp: Number(prop.rate_tenancy_land_no_emp || 0),
      rateGovtLand: Number(prop.rate_govt_land || 0),
      rateForestLand: Number(prop.rate_forest_land || 0),
      employmentProposedCount: prop.employment_proposed_count || 0,
      employmentSystem: prop.employment_system || 'PACKAGE_DEAL',
      hasDebottarLand: prop.has_debottar_land ?? false,
      hasTribalLand: prop.has_tribal_land ?? false,
      hasDisputedLand: prop.is_disputed_land ?? false,
      hasFormalNegotiation: prop.has_formal_negotiation ?? false,
      plotIds: plots,
      createdAt: prop.proposal_dt,
      updatedAt: prop.proposal_dt
    });
  }

  async save(proposal: Proposal, tx?: any): Promise<void> {
    const client = tx || db;
    const data = proposal.toPersistence();

    let acqModeId = BigInt(1); // cba_act
    if (data.acquisitionMode === 'rfctlarr') acqModeId = BigInt(2);
    if (data.acquisitionMode === 'direct_purchase') acqModeId = BigInt(6);

    // Ensure mine_cd and area_cd satisfy foreign key constraints
    let validMineCd = data.collieryCode;
    const existingMine = await client.mine_master.findUnique({ where: { mine_cd: validMineCd } });
    if (!existingMine) {
      const fallbackMine = await client.mine_master.findFirst();
      if (fallbackMine) validMineCd = fallbackMine.mine_cd;
    }

    let validAreaCd = data.areaOffice;
    const existingArea = await client.area_master.findUnique({ where: { area_cd: validAreaCd } });
    if (!existingArea) {
      const fallbackArea = await client.area_master.findFirst();
      if (fallbackArea) validAreaCd = fallbackArea.area_cd;
    }

    await client.acq_proposal.upsert({
      where: { proposal_id: data.id },
      update: {
        proposal_no: data.scheduleCode,
        purpose_justification: data.proposalTitle,
        pr_scheme_ref_no: (data as any).adjacentColliery || (data as any).pr_scheme_ref_no,
        current_stage_cd: data.state.slice(0, 30),
        overall_status: data.state.slice(0, 20),
        tot_acq_area: Number(data.totalAreaAcres),
        proposal_type: data.proposalType,
        rate_tenancy_land_with_emp: data.rateTenancyWithEmp,
        rate_tenancy_land_no_emp: data.rateTenancyNoEmp,
        rate_govt_land: data.rateGovtLand,
        rate_forest_land: data.rateForestLand,
        employment_proposed_count: data.employmentProposedCount,
        employment_system: data.employmentSystem,
        has_debottar_land: data.hasDebottarLand,
        has_tribal_land: data.hasTribalLand,
        is_disputed_land: data.hasDisputedLand,
        has_formal_negotiation: data.hasFormalNegotiation,
      },
      create: {
        proposal_id: data.id,
        proposal_no: data.scheduleCode,
        proposal_dt: data.notificationDate || new Date(),
        mine_cd: validMineCd,
        area_cd: validAreaCd,
        proj_cd: data.projectId,
        acq_mode_id: acqModeId,
        purpose_justification: data.proposalTitle,
        pr_scheme_ref_no: (data as any).adjacentColliery || (data as any).pr_scheme_ref_no,
        is_within_pr_limit: true,
        requires_board_approval: true,
        current_stage_cd: data.state.slice(0, 30),
        overall_status: data.state.slice(0, 20),
        tot_acq_area: Number(data.totalAreaAcres),
        entry_by: data.proposedBy,
        proposal_type: data.proposalType,
        rate_tenancy_land_with_emp: data.rateTenancyWithEmp,
        rate_tenancy_land_no_emp: data.rateTenancyNoEmp,
        rate_govt_land: data.rateGovtLand,
        rate_forest_land: data.rateForestLand,
        employment_proposed_count: data.employmentProposedCount,
        employment_system: data.employmentSystem,
        has_debottar_land: data.hasDebottarLand,
        has_tribal_land: data.hasTribalLand,
        is_disputed_land: data.hasDisputedLand,
        has_formal_negotiation: data.hasFormalNegotiation,
      }
    });
  }

  async isPlotInActiveProposal(plotId: string, excludeProposalId?: string): Promise<boolean> {
    const duplicates = await db.plot_schedule.count({
      where: {
        plot_no: plotId,
        ...(excludeProposalId ? { proposal_id: { not: excludeProposalId } } : {}),
        acq_status: {
          notIn: ['CANCELLED', 'WITHDRAWN', 'CLOSED']
        }
      }
    });
    return duplicates > 0;
  }

  async addPlotToProposal(proposalId: string, plotId: string, annexureTag: string): Promise<void> {
    await db.plot_schedule.upsert({
      where: {
        proposal_id_plot_no: {
          proposal_id: proposalId,
          plot_no: plotId
        }
      },
      update: {
        remarks: JSON.stringify({ annexure: annexureTag })
      },
      create: {
        proposal_id: proposalId,
        plot_no: plotId,
        mouza_lgd: BigInt(0),
        to_be_acquired_area: 0,
        acq_status: 'PROPOSED',
        remarks: JSON.stringify({ annexure: annexureTag }),
        entry_by: 'system'
      }
    });
  }

  async updatePlotAnnexure(proposalId: string, plotId: string, annexureTag: string): Promise<void> {
    await db.plot_schedule.update({
      where: {
        proposal_id_plot_no: {
          proposal_id: proposalId,
          plot_no: plotId
        }
      },
      data: {
        remarks: JSON.stringify({ annexure: annexureTag })
      }
    });
  }

  async removePlotFromProposal(proposalId: string, plotId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      const plot = await tx.plot_schedule.findUnique({
        where: {
          proposal_id_plot_no: {
            proposal_id: proposalId,
            plot_no: plotId
          }
        }
      });
      if (plot) {
        await tx.plot_schedule_land_type.deleteMany({
          where: { schedule_id: plot.schedule_id }
        });
        await tx.plot_schedule.delete({
          where: { schedule_id: plot.schedule_id }
        });
      }
    });
  }


  // --- DTO Procedural Interface (Hybrid for now) ---

  async createProposal(data: {
    proposal: ProposalDTO;
    plots: PlotScheduleDTO[];
    landTypes: PlotScheduleLandTypeDTO[];
  }): Promise<string> {
    let validMineCd = data.proposal.mine_cd;
    const existingMine = await db.mine_master.findUnique({ where: { mine_cd: validMineCd } });
    if (!existingMine) {
      const fallbackMine = await db.mine_master.findFirst();
      if (fallbackMine) validMineCd = fallbackMine.mine_cd;
    }

    let validAreaCd = data.proposal.area_cd;
    const existingArea = await db.area_master.findUnique({ where: { area_cd: validAreaCd } });
    if (!existingArea) {
      const fallbackArea = await db.area_master.findFirst();
      if (fallbackArea) validAreaCd = fallbackArea.area_cd;
    }

    const result = await db.$transaction(async (tx) => {
      const createdProposal = await tx.acq_proposal.create({
        data: {
          proposal_no: data.proposal.proposal_no,
          proposal_dt: data.proposal.proposal_dt,
          mine_cd: validMineCd,
          area_cd: validAreaCd,
          proj_cd: data.proposal.proj_cd,
          acq_mode_id: BigInt(data.proposal.acq_mode_id),
          purpose_justification: data.proposal.purpose_justification,
          pr_scheme_ref_no: data.proposal.pr_scheme_ref_no,
          is_within_pr_limit: data.proposal.is_within_pr_limit,
          cmd_admin_approval_ref: data.proposal.cmd_admin_approval_ref,
          requires_board_approval: data.proposal.requires_board_approval,
          total_land_cost_est: data.proposal.total_land_cost_est,
          total_rehab_cost_est: data.proposal.total_rehab_cost_est,
          total_employment_cost_est: data.proposal.total_employment_cost_est,
          proposal_type: data.proposal.proposal_type ?? 'STANDARD_LAP',
          rate_tenancy_land_with_emp: data.proposal.rate_tenancy_land_with_emp ?? 0,
          rate_tenancy_land_no_emp: data.proposal.rate_tenancy_land_no_emp ?? 0,
          rate_govt_land: data.proposal.rate_govt_land ?? 0,
          rate_forest_land: data.proposal.rate_forest_land ?? 0,
          employment_proposed_count: data.proposal.employment_proposed_count ?? 0,
          employment_system: data.proposal.employment_system ?? 'PACKAGE_DEAL',
          has_debottar_land: data.proposal.has_debottar_land ?? false,
          has_tribal_land: data.proposal.has_tribal_land ?? false,
          is_disputed_land: (data.proposal as any).is_disputed_land ?? false,
          has_formal_negotiation: data.proposal.has_formal_negotiation ?? false,
          current_stage_cd: data.proposal.current_stage_cd,
          overall_status: data.proposal.overall_status,
          entry_by: data.proposal.entry_by
        }
      });

      const proposalId = createdProposal.proposal_id.toString();

      const scheduleMap = new Map<string, string>(); 
      
      for (const plot of data.plots) {
        const createdPlot = await tx.plot_schedule.create({
          data: {
            proposal_id: createdProposal.proposal_id,
            plot_no: plot.plot_no,
            plot_ty: plot.plot_ty,
            plot_number: plot.plot_number,
            bata_no: plot.bata_no,
            opt_plot_ty: plot.opt_plot_ty,
            opt_plot: plot.opt_plot,
            opt_bata: plot.opt_bata,
            mouza_lgd: BigInt(plot.mouza_lgd),
            total_ror_area: plot.total_ror_area,
            to_be_acquired_area: plot.to_be_acquired_area,
            acq_status: plot.acq_status,
            entry_by: plot.entry_by,
            district_lgd: plot.district_lgd ? BigInt(plot.district_lgd) : undefined,
            state_lgd: plot.state_lgd ? BigInt(plot.state_lgd) : undefined,
            block_lgd: plot.block_lgd ? BigInt(plot.block_lgd) : undefined,
            ps_lgd: plot.ps_lgd ? BigInt(plot.ps_lgd) : undefined,
          }
        });
        scheduleMap.set(plot.plot_no, createdPlot.schedule_id.toString());
      }

      for (const lt of data.landTypes) {
        const actualScheduleId = scheduleMap.get(lt.schedule_id) || lt.schedule_id;
        
        await tx.plot_schedule_land_type.create({
          data: {
            schedule_id: BigInt(actualScheduleId),
            landt_id: BigInt(lt.landt_id),
            sub_landt_id: lt.sub_landt_id ? BigInt(lt.sub_landt_id) : null,
            area: lt.area,
            area_to_acquire: lt.area_to_acquire,
            use_purpose: (lt as any).use_purpose || 'EXCAVATION'
          }
        });
      }

      return proposalId;
    });

    return result;
  }

  async getProposalById(proposalId: string): Promise<ProposalDTO | null> {
    const prop = await db.acq_proposal.findUnique({
      where: { proposal_id: proposalId }
    });
    if (!prop) return null;
    
    return {
      proposal_id: prop.proposal_id,
      proposal_no: prop.proposal_no,
      proposal_dt: prop.proposal_dt,
      mine_cd: prop.mine_cd,
      area_cd: prop.area_cd,
      proj_cd: prop.proj_cd,
      acq_mode_id: Number(prop.acq_mode_id),
      purpose_justification: prop.purpose_justification,
      pr_scheme_ref_no: prop.pr_scheme_ref_no ?? undefined,
      is_within_pr_limit: prop.is_within_pr_limit,
      cmd_admin_approval_ref: prop.cmd_admin_approval_ref ?? undefined,
      requires_board_approval: prop.requires_board_approval,
      current_stage_cd: prop.current_stage_cd,
      overall_status: prop.overall_status,
      entry_by: prop.entry_by
    };
  }

  async getAllProposals(scope?: any, userContext?: { userId?: string; userName?: string }): Promise<any[]> {
    let where: any = {};
    const orConditions: any[] = [];

    if (scope && scope.level && scope.level !== 'HQ') {
      const scopedWhere = UserScopeService.scopeToWhere(scope, 'area_cd', 'mine_cd');
      orConditions.push(scopedWhere);

      const areaIds: string[] = scope.level === 'AREA' ? (scope.areaIds || []) : Object.keys(scope.unitsByArea || {});
      const mineIds: string[] = scope.level === 'UNIT' ? Object.values(scope.unitsByArea || {}).flat() as string[] : [];

      if (areaIds.length > 0) {
        orConditions.push({ area_cd: { in: areaIds } });
        orConditions.push({ pr_scheme_ref_no: { in: areaIds } });
        const areas = await db.area_master.findMany({ where: { area_cd: { in: areaIds } } });
        for (const a of areas) {
          orConditions.push({ pr_scheme_ref_no: { contains: a.area_en, mode: 'insensitive' } });
        }
      }
      if (mineIds.length > 0) {
        orConditions.push({ mine_cd: { in: mineIds } });
        orConditions.push({ pr_scheme_ref_no: { in: mineIds } });
      }
    } else if (scope && (scope.area_cd || scope.mine_cd)) {
      orConditions.push(scope);
      if (scope.area_cd) orConditions.push({ area_cd: scope.area_cd });
      if (scope.mine_cd) orConditions.push({ mine_cd: scope.mine_cd });
    }

    if (userContext?.userId) {
      orConditions.push({ entry_by: userContext.userId });
    }
    if (userContext?.userName) {
      orConditions.push({ entry_by: userContext.userName });
    }

    if (orConditions.length > 0) {
      where = { OR: orConditions };
    }

    const props = await db.acq_proposal.findMany({
      where,
      orderBy: { proposal_dt: 'desc' },
      include: {
        project: true,
        plot_schedule: {
          include: {
            plot_schedule_land_type: {
              include: {
                landtype_master: true
              }
            }
          }
        }
      }
    });
    
    return props;
  }
  async getProposalDetailsWithPlots(proposalId: string): Promise<any> {
    const prop = await db.acq_proposal.findUnique({
      where: { proposal_id: proposalId },
      include: {
        area_master: true,
        mine_master: true,
        project: {
          include: {
            approvals: {
              include: {
                locations: true
              }
            }
          }
        },
        plot_schedule: {
          include: {
            mouza_master: true,
            plot_schedule_land_type: {
              include: {
                landtype_master: true,
                sub_landtype: true
              }
            }
          }
        }
      }
    });
    return prop;
  }

  async getPlotsByProposalId(proposalId: string): Promise<PlotScheduleDTO[]> {
    const plots = await db.plot_schedule.findMany({
      where: { proposal_id: proposalId }
    });
    
    return plots.map(p => ({
      schedule_id: p.schedule_id.toString(),
      proposal_id: p.proposal_id,
      plot_no: p.plot_no,
      mouza_lgd: Number(p.mouza_lgd),
      to_be_acquired_area: Number(p.to_be_acquired_area),
      total_ror_area: Number((p as any).total_ror_area || 0),
      acq_status: p.acq_status,
      entry_by: p.entry_by || ''
    }));
  }

  async getLandTypesByScheduleId(scheduleId: string): Promise<PlotScheduleLandTypeDTO[]> {
    const types = await db.plot_schedule_land_type.findMany({
      where: { schedule_id: BigInt(scheduleId) }
    });
    
    return types.map(t => ({
      schedule_land_type_id: Number(t.schedule_land_type_id),
      schedule_id: t.schedule_id.toString(),
      landt_id: Number(t.landt_id),
      sub_landt_id: t.sub_landt_id ? Number(t.sub_landt_id) : undefined,
      area: Number(t.area),
      area_to_acquire: Number(t.area_to_acquire),
      use_purpose: t.use_purpose || undefined
    }));
  }

  async getLandTypeDetails(landtIds: (string | number)[]): Promise<any[]> {
    if (!landtIds || landtIds.length === 0) return [];
    
    const landTypes = await db.landtype_master.findMany({
      where: {
        landt_id: { in: landtIds.map(id => BigInt(id)) }
      }
    });
    
    return landTypes.map(lt => ({
      landt_id: lt.landt_id.toString(),
      land_type: lt.land_type,
      master_category: (lt as any).master_category || lt.land_type
    }));
  }

  async checkDuplicatePlots(plotNos: string[], mouzaLgd: number, excludeProposalId?: string): Promise<boolean> {
    const duplicates = await db.plot_schedule.count({
      where: {
        plot_no: { in: plotNos },
        mouza_lgd: BigInt(mouzaLgd),
        ...(excludeProposalId ? { proposal_id: { not: excludeProposalId } } : {}),
        acq_status: {
          notIn: ['CANCELLED', 'WITHDRAWN', 'CLOSED']
        }
      }
    });

    return duplicates > 0;
  }

  async addPlots(proposalId: string, plots: PlotScheduleDTO[], landTypes: PlotScheduleLandTypeDTO[]): Promise<void> {
    await db.$transaction(async (tx) => {
      const scheduleMap = new Map<string, string>();
      
      for (const plot of plots) {
        const createdPlot = await tx.plot_schedule.create({
          data: {
            proposal_id: proposalId,
            plot_no: plot.plot_no,
            plot_ty: plot.plot_ty,
            plot_number: plot.plot_number,
            bata_no: plot.bata_no,
            opt_plot_ty: plot.opt_plot_ty,
            opt_plot: plot.opt_plot,
            opt_bata: plot.opt_bata,
            mouza_lgd: BigInt(plot.mouza_lgd),
            jl_no: plot.jl_no || undefined,
            state_lgd: plot.state_lgd ? BigInt(plot.state_lgd) : undefined,
            district_lgd: plot.district_lgd ? BigInt(plot.district_lgd) : undefined,
            block_lgd: plot.block_lgd ? BigInt(plot.block_lgd) : undefined,
            ps_lgd: plot.ps_lgd ? BigInt(plot.ps_lgd) : undefined,
            total_ror_area: plot.total_ror_area ?? 0,
            to_be_acquired_area: plot.to_be_acquired_area ?? (null as any),
            acq_status: plot.acq_status,
            entry_by: plot.entry_by
          }
        });
        scheduleMap.set(plot.plot_no, createdPlot.schedule_id.toString());
      }

      for (const lt of landTypes) {
        const schedule_id = scheduleMap.get(lt.schedule_id); 
        if (!schedule_id) continue;
        
        await tx.plot_schedule_land_type.create({
          data: {
            schedule_id: BigInt(schedule_id),
            landt_id: BigInt(lt.landt_id),
            sub_landt_id: lt.sub_landt_id ? BigInt(lt.sub_landt_id) : undefined,
            area: lt.area ?? (null as any),
            area_to_acquire: lt.area_to_acquire ?? (null as any),
            use_purpose: lt.use_purpose || 'EXCAVATION'
          }
        });
      }
    });
  }

  async updatePlot(proposalId: string, plotNo: string, plotData: PlotScheduleDTO, landTypesData: PlotScheduleLandTypeDTO[]): Promise<void> {
    await db.$transaction(async (tx) => {
      const plot = await tx.plot_schedule.findUnique({
        where: { proposal_id_plot_no: { proposal_id: proposalId, plot_no: plotNo } }
      });

      if (!plot) throw new Error('Plot not found in this proposal.');

      await tx.plot_schedule_land_type.deleteMany({
        where: { schedule_id: plot.schedule_id }
      });

      const updatedPlot = await tx.plot_schedule.update({
        where: { schedule_id: plot.schedule_id },
        data: {
          plot_no: plotData.plot_no,
          plot_ty: plotData.plot_ty,
          plot_number: plotData.plot_number,
          bata_no: plotData.bata_no,
          opt_plot_ty: plotData.opt_plot_ty,
          opt_plot: plotData.opt_plot,
          opt_bata: plotData.opt_bata,
          mouza_lgd: BigInt(plotData.mouza_lgd),
          jl_no: plotData.jl_no || undefined,
          state_lgd: plotData.state_lgd ? BigInt(plotData.state_lgd) : undefined,
          district_lgd: plotData.district_lgd ? BigInt(plotData.district_lgd) : undefined,
          block_lgd: plotData.block_lgd ? BigInt(plotData.block_lgd) : undefined,
          ps_lgd: plotData.ps_lgd ? BigInt(plotData.ps_lgd) : undefined,
          total_ror_area: plotData.total_ror_area ?? 0,
          to_be_acquired_area: plotData.to_be_acquired_area ?? (null as any),
          acq_status: plotData.acq_status,
          entry_by: plotData.entry_by,
          updt_by: plotData.entry_by
        }
      });

      for (const lt of landTypesData) {
        await tx.plot_schedule_land_type.create({
          data: {
            schedule_id: updatedPlot.schedule_id,
            landt_id: BigInt(lt.landt_id),
            sub_landt_id: lt.sub_landt_id ? BigInt(lt.sub_landt_id) : undefined,
            area: lt.area ?? (null as any),
            area_to_acquire: lt.area_to_acquire ?? (null as any),
            use_purpose: lt.use_purpose || 'EXCAVATION'
          }
        });
      }
    });
  }

  async deletePlot(proposalId: string, plotNo: string): Promise<void> {
    await db.$transaction(async (tx) => {
      const plot = await tx.plot_schedule.findUnique({
        where: { proposal_id_plot_no: { proposal_id: proposalId, plot_no: plotNo } }
      });
      if (plot) {
        await tx.plot_schedule_land_type.deleteMany({
          where: { schedule_id: plot.schedule_id }
        });
        await tx.plot_schedule.delete({
          where: { schedule_id: plot.schedule_id }
        });
      }
    });
  }
}
