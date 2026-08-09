import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { IDocumentQueryService } from '../queries/IDocumentQueryService'
import { buildLandCategoryMap } from '@/core/compliance/utils/landCategoryMap'

function getFormVal(formData: any, ...keys: string[]): string {
  for (const k of keys) {
    if (formData && formData[k] !== undefined && formData[k] !== null && formData[k] !== '') {
      return String(formData[k]);
    }
  }
  return '';
}

// FormXXIIResolver updated: 2026-08-05T16:55:50Z
export class FormXXIIResolver implements IDocumentResolver {
  constructor(private queryService?: IDocumentQueryService) {}

  async resolve(businessId: string, context?: Record<string, any>): Promise<DocumentResolverResult> {
    if (!this.queryService) throw new Error('QueryService not injected')
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);

    // 1. Fetch the Proposal (acq_proposal) if businessId is UUID
    let proposal: any = null;
    if (isUuid) {
      proposal = await this.queryService.getProposal(businessId)
    }

    let isProjectSimulation = false;
    let project: any = null;
    
    if (proposal && proposal.proj_cd) {
      const p = await this.queryService.getProject(proposal.proj_cd)
      if (p) {
        project = {
          name: p.projNm,
          total_land_limit_acres: p.totalApprovedArea || 0,
          total_budget_ceiling: (Number(p.landBudget || 0) + Number(p.rrBudget || 0)).toString(),
          total_employment_quota: p.totalEmpSanctioned || 0,
          
          // Type-wise approved baseline from master.project
          approved_tenancy_area: Number(p.approved_tenancy_area || 0),
          approved_govt_area: Number(p.approved_govt_area || 0),
          approved_patta_area: Number(p.approved_patta_area || 0),
          approved_forest_area: Number(p.approved_forest_area || 0),
          
          // Use-wise approved baseline from master.project
          approved_excavation_area: Number(p.approved_excavation_area || 0),
          approved_safety_zone_area: Number(p.approved_safety_zone_area || 0),
          approved_ob_dump_area: Number(p.approved_ob_dump_area || 0),
          approved_infra_area: Number(p.approved_infra_area || 0),
          approved_diversion_area: Number(p.approved_diversion_area || 0),
          approved_rehab_area: Number(p.approved_rehab_area || 0),
          aaproved_others_area: Number((p as any).aaproved_others_area || 0),
        };
      }
    }

    if (!proposal) {
      // Check if businessId is a project ID (projCd)
      const proj = await this.queryService.getProject(businessId)
      if (proj) {
        isProjectSimulation = true;
        project = {
          name: proj.projNm,
          total_land_limit_acres: proj.totalApprovedArea || 0,
          total_budget_ceiling: (Number(proj.landBudget || 0) + Number(proj.rrBudget || 0)).toString(),
          total_employment_quota: proj.totalEmpSanctioned || 0,
          
          // Type-wise approved baseline from master.project
          approved_tenancy_area: Number(proj.approved_tenancy_area || 0),
          approved_govt_area: Number(proj.approved_govt_area || 0),
          approved_patta_area: Number(proj.approved_patta_area || 0),
          approved_forest_area: Number(proj.approved_forest_area || 0),
          
          // Use-wise approved baseline from master.project
          approved_excavation_area: Number(proj.approved_excavation_area || 0),
          approved_safety_zone_area: Number(proj.approved_safety_zone_area || 0),
          approved_ob_dump_area: Number(proj.approved_ob_dump_area || 0),
          approved_infra_area: Number(proj.approved_infra_area || 0),
          approved_diversion_area: Number(proj.approved_diversion_area || 0),
          approved_rehab_area: Number(proj.approved_rehab_area || 0),
          aaproved_others_area: Number((proj as any).aaproved_others_area || 0),
        };
        proposal = {
          proposal_id: businessId,
          proj_cd: businessId,
          tot_acq_area: Number(proj.totalApprovedArea || 0),
          acquisition_mode: 'cba_act'
        } as any;
      } else {
        throw new Error(`Proposal or Project with ID ${businessId} not found`)
      }
    }

    // 2. Fetch the Plot details (items) using correct relation `acq_proposal`
    const [items, landCategoryMap] = await Promise.all([
      this.queryService.getPlots(businessId, isUuid, true),
      buildLandCategoryMap()
    ])

    // Aggregate use_purpose and land_type areas from plot_schedule_land_type
    let propExcavating = 0, propSafetyZone = 0, propObDump = 0, propInfrastructure = 0;
    let propDiversion = 0, propRehabilitation = 0, propOther = 0;
    let tenancyLand = 0, govtLand = 0, pattaLand = 0, forestLand = 0;

    items.forEach(plot => {
      (plot.plot_schedule_land_type || []).forEach(lt => {
        const areaToAcq = parseFloat(lt.area_to_acquire?.toString() || lt.area?.toString() || '0');
        const purpose = ((lt as any).use_purpose || '').toUpperCase();
        const ltName = ((lt as any).landtype_master?.land_type || '').toUpperCase();
        const lId = Number(lt.landt_id);

        if (purpose === 'EXCAVATION' || purpose === 'EXCAVATING') propExcavating += areaToAcq;
        else if (purpose === 'SAFETY_ZONE') propSafetyZone += areaToAcq;
        else if (purpose === 'OB_DUMP') propObDump += areaToAcq;
        else if (purpose === 'INFRASTRUCTURE') propInfrastructure += areaToAcq;
        else if (purpose === 'DIVERSION') propDiversion += areaToAcq;
        else if (purpose === 'REHABILITATION') propRehabilitation += areaToAcq;
        else propOther += areaToAcq;

        // Use dynamic landtype_master map — no hardcoded IDs
        const category = landCategoryMap.get(Number(lt.landt_id)) || 'TENANCY';
        if (category === 'GOVT') govtLand += areaToAcq;
        else if (category === 'FOREST') forestLand += areaToAcq;
        else if (category === 'PATTA') pattaLand += areaToAcq;
        else tenancyLand += areaToAcq;
      });
    });

    // Calculate actual total proposal area from plots schedule & land types
    const plotSumArea = items.reduce((sum, plot) => sum + parseFloat(plot.to_be_acquired_area?.toString() || '0'), 0);
    const sumLandTypes = tenancyLand + govtLand + pattaLand + forestLand;
    const proposalArea = sumLandTypes > 0 ? sumLandTypes : (plotSumArea > 0 ? plotSumArea : parseFloat(proposal?.tot_acq_area?.toString() || '0'));
    const propUseTotal = (propExcavating + propSafetyZone + propObDump + propInfrastructure + propDiversion + propRehabilitation + propOther) || proposalArea;

    // 3. Extract baseline approved values from master.project
    const projectLimitAcres = parseFloat(project?.total_land_limit_acres?.toString() || '0');

    // Extract dynamic form data from Workspace input
    const formData = context?.form_data || {};

    // Acquisition mode — strictly resolved per master.acqu_mode table:
    // 1=CBA (A&D) Act, 2=RFCTLARR Act, 3=LTS Govt Land, 4=Lease Govt Land, 5=Diversion of Forest Land, 6=Direct Purchase
    const formAcqMode = String(getFormVal(formData, 'acquisition_mode', 'acq_mode', 'acquisitionMode', 'acquisition_type', 'acq_type', 'AcquisitionMode', 'Mode') || '').toLowerCase();
    const acqModeId = Number(proposal?.acq_mode_id || 0);
    const modeStr = (formAcqMode || String(proposal?.acquisition_mode || proposal?.acqu_mode?.aquisition_method || '')).toLowerCase();

    let acqMode = 'cba_act';
    if (acqModeId === 6 || modeStr.includes('direct') || modeStr.includes('purchase')) {
      acqMode = 'direct_purchase';
    } else if (acqModeId === 2 || modeStr.includes('rfctlarr')) {
      acqMode = 'rfctlarr';
    } else if (acqModeId === 3 || acqModeId === 4 || modeStr.includes('govt') || modeStr.includes('transfer') || modeStr.includes('lts')) {
      acqMode = 'govt_transfer';
    } else if (acqModeId === 5 || modeStr.includes('forest') || modeStr.includes('diversion')) {
      acqMode = 'forest_diversion';
    } else if (acqModeId === 1 || modeStr.includes('cba')) {
      acqMode = 'cba_act';
    }

    const schemeTenancyVal = project?.approved_tenancy_area ?? parseFloat(formData.SchemeTenancy || '0');
    const schemeGovtVal = project?.approved_govt_area ?? parseFloat(formData.SchemeGovt || '0');
    const schemePattaVal = project?.approved_patta_area ?? parseFloat(formData.SchemePatta || '0');
    const schemeForestVal = project?.approved_forest_area ?? parseFloat(formData.SchemeForest || '0');
    const schemeTypeSum = schemeTenancyVal + schemeGovtVal + schemePattaVal + schemeForestVal;
    const schemeTotalVal = schemeTypeSum > 0 ? schemeTypeSum : projectLimitAcres;

    const schemeExcavatingVal = project?.approved_excavation_area ?? parseFloat(formData.SchemeExcavating || '0');
    const schemeSafetyZoneVal = project?.approved_safety_zone_area ?? parseFloat(formData.SchemeSafetyZone || '0');
    const schemeObDumpVal = project?.approved_ob_dump_area ?? parseFloat(formData.SchemeObDump || '0');
    const schemeInfraVal = project?.approved_infra_area ?? parseFloat(formData.SchemeInfrastructure || '0');
    const schemeDiversionVal = project?.approved_diversion_area ?? parseFloat(formData.SchemeDiversion || '0');
    const schemeRehabVal = project?.approved_rehab_area ?? parseFloat(formData.SchemeRehabilitation || '0');
    const schemeOtherVal = project?.aaproved_others_area ?? parseFloat(formData.SchemeOther || '0');
    const schemeUseTypeSum = schemeExcavatingVal + schemeSafetyZoneVal + schemeObDumpVal + schemeInfraVal + schemeDiversionVal + schemeRehabVal + schemeOtherVal;
    const schemeUseTotalVal = schemeUseTypeSum > 0 ? schemeUseTypeSum : schemeTotalVal;

    // Deviations calculation
    const deviationAcres = isProjectSimulation ? (parseFloat(context?.form_data?.ProposedArea || "100")) : (proposalArea - schemeTotalVal);
    const projectBudget = parseFloat(project?.total_budget_ceiling?.toString() || '0');
    const calculatedLandCost = (Number(proposal?.total_land_cost_est || 0) + Number(proposal?.total_rehab_cost_est || 0) + Number(proposal?.total_employment_cost_est || 0));
    const estimatedBudget = calculatedLandCost;
    // employment_proposed_count is the real DB column
    const estimatedJobs = Number(proposal?.employment_proposed_count || 0) > 0
      ? Number(proposal.employment_proposed_count)
      : Math.floor((tenancyLand + pattaLand) / 2);

    const hasLimitBreach = deviationAcres > 0 || estimatedBudget > projectBudget;
    const surpassedProvisionsText = hasLimitBreach
      ? `YES - Limit Breached (${deviationAcres > 0 ? `+${deviationAcres.toFixed(4)} Acres` : 'Budget/Quota Exceeded'})`
      : "NO - Within Approved Limits";

    // 5. Build Land Type-wise Compensation Rate breakdown
    let compRateStr = '';
    if (proposal) {
      const parts: string[] = [];
      if (Number(proposal.rate_tenancy_land_with_emp || 0) > 0) parts.push(`Tenancy (w/ Emp): ₹ ${Number(proposal.rate_tenancy_land_with_emp).toLocaleString('en-IN')}/Ac`);
      if (Number(proposal.rate_tenancy_land_no_emp || 0) > 0) parts.push(`Tenancy (w/o Emp): ₹ ${Number(proposal.rate_tenancy_land_no_emp).toLocaleString('en-IN')}/Ac`);
      if (Number(proposal.rate_govt_land || 0) > 0) parts.push(`Govt Land: ₹ ${Number(proposal.rate_govt_land).toLocaleString('en-IN')}/Ac`);
      if (Number(proposal.rate_forest_land || 0) > 0) parts.push(`Forest Land: ₹ ${Number(proposal.rate_forest_land).toLocaleString('en-IN')}/Ac`);

      // Fallback: check direct rate fields or calculate from total land cost estimate
      if (parts.length === 0) {
        const directRate = Number(proposal.compensation_rate || proposal.rate_tenancy_land || proposal.land_rate || proposal.rate_per_acre || 0);
        if (directRate > 0) {
          parts.push(`₹ ${directRate.toLocaleString('en-IN')}/Ac`);
        } else if (Number(proposal.total_land_cost_est || 0) > 0 && (tenancyLand + pattaLand) > 0) {
          const avgRate = Math.round(Number(proposal.total_land_cost_est) / (tenancyLand + pattaLand));
          parts.push(`₹ ${avgRate.toLocaleString('en-IN')}/Ac (Est. Avg)`);
        }
      }
      if (parts.length > 0) compRateStr = parts.join('; ');
    }

    // 6. Build mapping for DOCX placeholders
    return {
      fields: {
        "ProjectName": project?.name || '',
        "SchemeApprovalRef": getFormVal(formData, 'SchemeApprovalRef', 'scheme_approval_ref', 'schemeApprovalRef', 'scheme_ref', 'approval_ref', 'pr_scheme_ref_no') || proposal?.pr_scheme_ref_no || proposal?.cmd_admin_approval_ref || '',
        "DgmsPermissionStatus": getFormVal(formData, 'DgmsPermissionStatus', 'dgms_permission_status', 'dgmsPermissionStatus', 'dgms_permission') || (proposal as any)?.dgms_permission_status || '',
        "EnvForestClearance": getFormVal(formData, 'EnvForestClearance', 'env_forest_clearance', 'envForestClearance', 'env_clearance') || (proposal as any)?.env_forest_clearance_status || '',
        "StateEnvConsent": getFormVal(formData, 'StateEnvConsent', 'state_env_consent', 'stateEnvConsent', 'state_consent') || (proposal as any)?.state_env_consent_status || '',
        
        // Type-wise land break-up
        "SchemeTenancy": schemeTenancyVal.toFixed(4),
        "SchemeGovt": schemeGovtVal.toFixed(4),
        "SchemePatta": schemePattaVal.toFixed(4),
        "SchemeForest": schemeForestVal.toFixed(4),
        "SchemeTotal": schemeTotalVal.toFixed(4),
        
        "PropTenancy": tenancyLand.toFixed(4),
        "PropGovt": govtLand.toFixed(4),
        "PropPatta": pattaLand.toFixed(4),
        "PropForest": forestLand.toFixed(4),
        "PropTotal": proposalArea.toFixed(4),
        
        // Type-wise deviation (proposal - scheme; negative = within limit)
        "DevTenancy": (tenancyLand - schemeTenancyVal).toFixed(4),
        "DevGovt": (govtLand - schemeGovtVal).toFixed(4),
        "DevPatta": (pattaLand - schemePattaVal).toFixed(4),
        "DevForest": (forestLand - schemeForestVal).toFixed(4),
        "DevTotal": (proposalArea - schemeTotalVal).toFixed(4),
        "DevTypeTotal": (proposalArea - schemeTotalVal).toFixed(4),
        
        // Use-wise scheme
        "SchemeExcavating": schemeExcavatingVal.toFixed(4),
        "SchemeSafetyZone": schemeSafetyZoneVal.toFixed(4),
        "SchemeObDump": schemeObDumpVal.toFixed(4),
        "SchemeInfrastructure": schemeInfraVal.toFixed(4),
        "SchemeDiversion": schemeDiversionVal.toFixed(4),
        "SchemeRehabilitation": schemeRehabVal.toFixed(4),
        "SchemeOther": schemeOtherVal.toFixed(4),
        "SchemeUseTotal": schemeUseTotalVal.toFixed(4),
        
        // Use-wise proposal
        "PropExcavating": propExcavating.toFixed(4),
        "PropSafetyZone": propSafetyZone.toFixed(4),
        "PropObDump": propObDump.toFixed(4),
        "PropInfrastructure": propInfrastructure.toFixed(4),
        "PropDiversion": propDiversion.toFixed(4),
        "PropRehabilitation": propRehabilitation.toFixed(4),
        "PropOther": propOther.toFixed(4),
        "PropUseTotal": propUseTotal.toFixed(4),
        
        // Use-wise deviation (proposal - scheme) — comprehensive placeholder alias dictionary
        "DevExcavating": (propExcavating - schemeExcavatingVal).toFixed(4),
        "DevExcavation": (propExcavating - schemeExcavatingVal).toFixed(4),
        "DevExcavatingArea": (propExcavating - schemeExcavatingVal).toFixed(4),
        "DevExcavationArea": (propExcavating - schemeExcavatingVal).toFixed(4),
        "dev_excavating": (propExcavating - schemeExcavatingVal).toFixed(4),
        "dev_excavation": (propExcavating - schemeExcavatingVal).toFixed(4),

        "DevSafetyZone": (propSafetyZone - schemeSafetyZoneVal).toFixed(4),
        "DevSafety": (propSafetyZone - schemeSafetyZoneVal).toFixed(4),
        "DevSafetyZoneArea": (propSafetyZone - schemeSafetyZoneVal).toFixed(4),
        "dev_safety_zone": (propSafetyZone - schemeSafetyZoneVal).toFixed(4),
        "dev_safety": (propSafetyZone - schemeSafetyZoneVal).toFixed(4),

        "DevObDump": (propObDump - schemeObDumpVal).toFixed(4),
        "DevOb": (propObDump - schemeObDumpVal).toFixed(4),
        "DevObDumpArea": (propObDump - schemeObDumpVal).toFixed(4),
        "dev_ob_dump": (propObDump - schemeObDumpVal).toFixed(4),
        "dev_ob": (propObDump - schemeObDumpVal).toFixed(4),

        "DevInfrastructure": (propInfrastructure - schemeInfraVal).toFixed(4),
        "DevInfra": (propInfrastructure - schemeInfraVal).toFixed(4),
        "DevInfrastructureArea": (propInfrastructure - schemeInfraVal).toFixed(4),
        "dev_infrastructure": (propInfrastructure - schemeInfraVal).toFixed(4),
        "dev_infra": (propInfrastructure - schemeInfraVal).toFixed(4),

        "DevDiversion": (propDiversion - schemeDiversionVal).toFixed(4),
        "DevDiversionArea": (propDiversion - schemeDiversionVal).toFixed(4),
        "dev_diversion": (propDiversion - schemeDiversionVal).toFixed(4),

        "DevRehabilitation": (propRehabilitation - schemeRehabVal).toFixed(4),
        "DevRehab": (propRehabilitation - schemeRehabVal).toFixed(4),
        "DevRehabilitationArea": (propRehabilitation - schemeRehabVal).toFixed(4),
        "dev_rehabilitation": (propRehabilitation - schemeRehabVal).toFixed(4),
        "dev_rehab": (propRehabilitation - schemeRehabVal).toFixed(4),

        "DevOther": (propOther - schemeOtherVal).toFixed(4),
        "DevOtherPurpose": (propOther - schemeOtherVal).toFixed(4),
        "DevOtherArea": (propOther - schemeOtherVal).toFixed(4),
        "dev_other": (propOther - schemeOtherVal).toFixed(4),

        "DevUseTotal": (propUseTotal - schemeUseTotalVal).toFixed(4),
        "dev_total": (propUseTotal - schemeUseTotalVal).toFixed(4),
        "dev_use_total": (propUseTotal - schemeUseTotalVal).toFixed(4),
        
        "Justification": getFormVal(formData, 'Justification', 'justification', 'purpose_justification') || proposal?.purpose_justification || '',
        
        // Acquisition mode — tenancy+patta land goes to the matched mode column
        "ModeCba": acqMode === 'cba_act' ? (tenancyLand + pattaLand).toFixed(4) : (getFormVal(formData, 'ModeCba', 'mode_cba') || '0.0000'),
        "ModeRfctlarr": acqMode === 'rfctlarr' ? (tenancyLand + pattaLand).toFixed(4) : (getFormVal(formData, 'ModeRfctlarr', 'mode_rfctlarr') || '0.0000'),
        "ModeDirectPurchase": acqMode === 'direct_purchase' ? (tenancyLand + pattaLand).toFixed(4) : (getFormVal(formData, 'ModeDirectPurchase', 'mode_direct_purchase') || '0.0000'),
        "ModeGovtTransfer": govtLand.toFixed(4),
        "ModeForestDiversion": forestLand.toFixed(4),
        
        "CompensationRate": getFormVal(formData, 'CompensationRate', 'compensation_rate', 'compensationRate', 'rate', 'land_rate') || compRateStr || 'As per Prevalent CIL R&R Policy',
        "RequiredCapital": estimatedBudget > 0 ? estimatedBudget.toFixed(2) : '0.00',
        
        "JobsAreaAcres": (tenancyLand + pattaLand).toFixed(4),
        "JobsTotal": estimatedJobs.toString(),
        
        // Items 13-18 come from dynamic form submission or proposal fallbacks
        "MeetingsHeld": getFormVal(formData, 'MeetingsHeld', 'meetings_held', 'meetingsHeld', 'meetings_held_details') || (proposal as any)?.meetings_held_details || '',
        "LandownersReady": getFormVal(formData, 'LandownersReady', 'landowners_ready', 'landownersReady', 'landowners_consent_status') || (proposal as any)?.landowners_consent_status || '',
        "PattaActions": getFormVal(formData, 'PattaActions', 'patta_actions', 'pattaActions') || (proposal as any)?.patta_actions || '',
        "DebottarType": getFormVal(formData, 'DebottarType', 'debottar_type', 'debottarType') || (proposal as any)?.debottar_type || '',
        "PhysicalStatus": getFormVal(formData, 'PhysicalStatus', 'physical_status', 'physicalStatus') || (proposal as any)?.physical_status || '',
        "VillageStatus": getFormVal(formData, 'VillageStatus', 'village_status', 'villageStatus') || (proposal as any)?.village_status || '',
        
        // Item 19: whether provisions surpassed — computed from limit check
        "SurpassedProvisions": surpassedProvisionsText,
        // Item 20: whether relaxation of R&R policy required — from custom form input or default text
        "RelaxationRequired": getFormVal(formData, 'RelaxationRequired', 'relaxation_required', 'relaxationRequired', 'Relaxation', 'relaxation', 'relaxation_details', 'relaxationDetails', 'rr_relaxation', 'relaxation_sought') || "NO - Within Approved Limits",
        "Relaxation": getFormVal(formData, 'RelaxationRequired', 'relaxation_required', 'relaxationRequired', 'Relaxation', 'relaxation', 'relaxation_details', 'relaxationDetails', 'rr_relaxation', 'relaxation_sought') || "NO - Within Approved Limits",
        
        "CurrentDate": new Date().toLocaleDateString('en-IN')
      },
      tables: {}
    }
  }
}
