import { IProposalRepository, ProposalDTO, PlotScheduleDTO, PlotScheduleLandTypeDTO } from '@/domain/entities/proposal';
import { db } from '@/lib/db';
import { Proposal, ProposalId, ScheduleCode, AcquisitionMode, ProposalState, Checklist } from '@/domain/entities/proposal';
import { Area } from '@/domain/value-objects/Area';
import { UserScopeService } from '@/core/authorization/services/UserScopeService';

export class PrismaAcqProposalRepository implements IProposalRepository {
  constructor() {}

  // --- DDD Interface ---

  async findById(id: string): Promise<Proposal | null> {
    const prop = await db.acq_proposal.findUnique({
      where: { proposal_id: id },
      include: {
        plot_schedule: true
      }
    });

    if (!prop) return null;

    let modeVal = 'cba_act';
    if (Number(prop.acq_mode_id) === 2) modeVal = 'rfctlarr';
    if (Number(prop.acq_mode_id) === 3) modeVal = 'direct_purchase';

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
      plotIds: plots,
      createdAt: prop.proposal_dt,
      updatedAt: prop.proposal_dt
    });
  }

  async save(proposal: Proposal): Promise<void> {
    const data = {
      id: proposal.id,
      scheduleCode: proposal.scheduleCode.value,
      proposalTitle: proposal.proposalTitle,
      state: proposal.state.value,
      totalArea: proposal.totalArea.toNumber(),
      notificationDate: proposal.notificationDate,
      collieryCode: proposal.collieryCode,
      areaOffice: proposal.areaOffice,
      projectId: proposal.projectId,
      proposedBy: proposal.proposedBy,
      acquisitionMode: proposal.acquisitionMode.value
    };

    let acqModeId = BigInt(1); // cba_act
    if (data.acquisitionMode === 'rfctlarr') acqModeId = BigInt(2);
    if (data.acquisitionMode === 'direct_purchase') acqModeId = BigInt(3);

    // Ensure mine_cd and area_cd satisfy foreign key constraints
    let validMineCd = data.collieryCode;
    const existingMine = await db.mine_master.findUnique({ where: { mine_cd: validMineCd } });
    if (!existingMine) {
      const fallbackMine = await db.mine_master.findFirst();
      if (fallbackMine) validMineCd = fallbackMine.mine_cd;
    }

    let validAreaCd = data.areaOffice;
    const existingArea = await db.area_master.findUnique({ where: { area_cd: validAreaCd } });
    if (!existingArea) {
      const fallbackArea = await db.area_master.findFirst();
      if (fallbackArea) validAreaCd = fallbackArea.area_cd;
    }

    await db.acq_proposal.upsert({
      where: { proposal_id: data.id },
      update: {
        proposal_no: data.scheduleCode,
        purpose_justification: data.proposalTitle,
        pr_scheme_ref_no: (data as any).adjacentColliery || (data as any).pr_scheme_ref_no,
        current_stage_cd: data.state,
        overall_status: data.state,
        tot_acq_area: data.totalArea,
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
        current_stage_cd: data.state,
        overall_status: data.state,
        tot_acq_area: data.totalArea,
        entry_by: data.proposedBy
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
            area: lt.area,
            area_to_acquire: lt.area_to_acquire
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

  async getAllProposals(scope?: any): Promise<any[]> {
    let where: any = {};
    if (scope && scope.level && scope.level !== 'HQ') {
      const scopedWhere = UserScopeService.scopeToWhere(scope, 'area_cd', 'mine_cd');
      const areaIds: string[] = scope.level === 'AREA' ? (scope.areaIds || []) : Object.keys(scope.unitsByArea || {});
      const mineIds: string[] = scope.level === 'UNIT' ? Object.values(scope.unitsByArea || {}).flat() as string[] : [];

      const adjacentOrConditions: any[] = [];
      if (areaIds.length > 0) {
        adjacentOrConditions.push({ pr_scheme_ref_no: { in: areaIds } });
        const areas = await db.area_master.findMany({ where: { area_cd: { in: areaIds } } });
        for (const a of areas) {
          adjacentOrConditions.push({ pr_scheme_ref_no: { contains: a.area_en, mode: 'insensitive' } });
          adjacentOrConditions.push({ pr_scheme_ref_no: a.area_cd });
        }
      }
      if (mineIds.length > 0) {
        adjacentOrConditions.push({ pr_scheme_ref_no: { in: mineIds } });
      }

      if (adjacentOrConditions.length > 0) {
        where = {
          OR: [
            scopedWhere,
            ...adjacentOrConditions
          ]
        };
      } else {
        where = scopedWhere;
      }
    } else if (scope && (scope.area_cd || scope.mine_cd)) {
      where = {
        OR: [
          scope,
          { pr_scheme_ref_no: scope.area_cd || scope.mine_cd }
        ]
      };
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
                landtype_master: true
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
      schedule_land_type_id: t.schedule_land_type_id.toString(),
      schedule_id: t.schedule_id.toString(),
      landt_id: Number(t.landt_id),
      area: Number(t.area),
      area_to_acquire: Number(t.area_to_acquire)
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
            area: lt.area ?? (null as any),
            area_to_acquire: lt.area_to_acquire ?? (null as any)
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
          to_be_acquired_area: plotData.to_be_acquired_area ?? (null as any),
          acq_status: plotData.acq_status,
          entry_by: plotData.entry_by
        }
      });

      for (const lt of landTypesData) {
        await tx.plot_schedule_land_type.create({
          data: {
            schedule_id: updatedPlot.schedule_id,
            landt_id: BigInt(lt.landt_id),
            area: lt.area ?? (null as any),
            area_to_acquire: lt.area_to_acquire ?? (null as any)
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
