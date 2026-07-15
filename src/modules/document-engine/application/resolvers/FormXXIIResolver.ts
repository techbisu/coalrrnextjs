import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'

export class FormXXIIResolver implements IDocumentResolver {
  async resolve(businessId: string, context?: Record<string, any>): Promise<DocumentResolverResult> {
    // 1. Fetch the Proposal (land_schedule) and its Project
    const proposal = await db.land_schedule.findUnique({
      where: { id: businessId },
      include: {
        project: true
      }
    })

    if (!proposal) {
      throw new Error(`Proposal with ID ${businessId} not found`)
    }

    // 2. Fetch the Plot details (items)
    const items = await db.land_schedule_item.findMany({
      where: { schedule_id: businessId },
      include: {
        plot: {
          include: {
            mouza: true
          }
        }
      }
    })

    // 3. Calculate limit deviations
    const projectLimitAcres = parseFloat(proposal.project.total_land_limit_acres.toString());
    const projectBudget = parseFloat(proposal.project.total_budget_ceiling?.toString() || "0");
    const projectJobs = proposal.project.total_employment_quota || 0;

    const proposalArea = parseFloat(proposal.total_area_acres.toString());
    const deviationAcres = proposalArea - projectLimitAcres;
    
    // Aggregating plot land types for Question 6
    let tenancyLand = 0, govtLand = 0, pattaLand = 0, forestLand = 0;
    items.forEach(i => {
      const area = parseFloat(i.plot.area_acres.toString());
      if (i.plot.land_type === 'TENANCY') tenancyLand += area;
      else if (i.plot.land_type === 'GOVT') govtLand += area;
      else if (i.plot.land_type === 'PATTA') pattaLand += area;
      else if (i.plot.land_type === 'FOREST') forestLand += area;
      else tenancyLand += area; // fallback
    });
    
    const estimatedBudget = proposalArea * 1000000;
    const deviationBudget = estimatedBudget - projectBudget;
    
    const estimatedJobs = Math.floor(proposalArea / 2);
    const deviationJobs = estimatedJobs - projectJobs;

    // 4. Extract plots info for the template
    const plotsDetails = items.map(item => `${item.plot.plot_number} (${item.plot.mouza.mouza_en})`).join(', ')

    // Extract dynamic form data from Workspace input
    const formData = context?.form_data || {};

    // 5. Build mapping for DOCX placeholders
    return {
      fields: {
        "ProjectName": proposal.project.name,
        "SchemeApprovalRef": formData.SchemeApprovalRef || '',
        "DgmsPermissionStatus": formData.DgmsPermissionStatus || '',
        "EnvForestClearance": formData.EnvForestClearance || '',
        "StateEnvConsent": formData.StateEnvConsent || '',
        
        "SchemeTenancy": formData.SchemeTenancy || '0',
        "SchemeGovt": formData.SchemeGovt || '0',
        "SchemePatta": formData.SchemePatta || '0',
        "SchemeForest": formData.SchemeForest || '0',
        "SchemeTotal": projectLimitAcres.toFixed(4),
        
        "PropTenancy": tenancyLand.toFixed(4),
        "PropGovt": govtLand.toFixed(4),
        "PropPatta": pattaLand.toFixed(4),
        "PropForest": forestLand.toFixed(4),
        "PropTotal": proposalArea.toFixed(4),
        
        "DevTenancy": (tenancyLand - parseFloat(formData.SchemeTenancy || '0')).toFixed(4),
        "DevGovt": (govtLand - parseFloat(formData.SchemeGovt || '0')).toFixed(4),
        "DevPatta": (pattaLand - parseFloat(formData.SchemePatta || '0')).toFixed(4),
        "DevForest": (forestLand - parseFloat(formData.SchemeForest || '0')).toFixed(4),
        "DevTotal": deviationAcres > 0 ? deviationAcres.toFixed(4) : "0.0000",
        
        "SchemeExcavating": formData.SchemeExcavating || '0',
        "SchemeSafetyZone": formData.SchemeSafetyZone || '0',
        "SchemeObDump": formData.SchemeObDump || '0',
        "SchemeInfrastructure": formData.SchemeInfrastructure || '0',
        "SchemeDiversion": formData.SchemeDiversion || '0',
        "SchemeRehabilitation": formData.SchemeRehabilitation || '0',
        "SchemeOther": formData.SchemeOther || '0',
        "SchemeUseTotal": formData.SchemeUseTotal || projectLimitAcres.toFixed(4),
        
        "PropExcavating": formData.PropExcavating || '0',
        "PropSafetyZone": formData.PropSafetyZone || '0',
        "PropObDump": formData.PropObDump || '0',
        "PropInfrastructure": formData.PropInfrastructure || '0',
        "PropDiversion": formData.PropDiversion || '0',
        "PropRehabilitation": formData.PropRehabilitation || '0',
        "PropOther": formData.PropOther || '0',
        "PropUseTotal": proposalArea.toFixed(4),
        
        "Justification": formData.Justification || '',
        
        "ModeCba": proposal.acquisition_mode === 'cba_act' ? proposalArea.toFixed(4) : '0',
        "ModeRfctlarr": proposal.acquisition_mode === 'rfctlarr' ? proposalArea.toFixed(4) : '0',
        "ModeDirectPurchase": proposal.acquisition_mode === 'direct_purchase' ? proposalArea.toFixed(4) : '0',
        "ModeGovtTransfer": formData.ModeGovtTransfer || '0',
        "ModeForestDiversion": formData.ModeForestDiversion || '0',
        
        "CompensationRate": formData.CompensationRate || '',
        "RequiredCapital": estimatedBudget.toFixed(2),
        
        "JobsAreaAcres": (tenancyLand + pattaLand).toFixed(4),
        "JobsTotal": estimatedJobs.toString(),
        
        "MeetingsHeld": formData.MeetingsHeld || '',
        "LandownersReady": formData.LandownersReady || '',
        "PattaActions": formData.PattaActions || '',
        "DebottarType": formData.DebottarType || '',
        "PhysicalStatus": formData.PhysicalStatus || '',
        "VillageStatus": formData.VillageStatus || '',
        
        "SurpassedProvisions": "YES - Limit Breached",
        "RelaxationRequired": formData.RelaxationRequired || '',
        
        "CurrentDate": new Date().toLocaleDateString('en-IN')
      },
      tables: {}
    }
  }
}
