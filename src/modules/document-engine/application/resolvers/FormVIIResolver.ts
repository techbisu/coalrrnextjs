import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { IDocumentQueryService } from '../queries/IDocumentQueryService'

/**
 * FormVIIResolver — Reconciliation Certificate
 *
 * Form-VII certifies that the proposed plots have no prior acquisition overlap
 * with any adjacent colliery sharing a common leasehold boundary.
 *
 * Data sources:
 *  - acq_proposal       → proposal header (acquiring colliery, area, purpose)
 *  - plot_schedule      → individual plot rows (Annexure A/B/C tagging, areas)
 *  - mouza_master       → Mouza name for each plot
 *  - mine_master        → Acquiring colliery name
 *  - area_master        → Acquiring Area name
 *
 * Signing authorities are defined in document_template_signature (seeded separately).
 */
export class FormVIIResolver implements IDocumentResolver {
  constructor(private queryService?: IDocumentQueryService) {}

  async resolve(
    applicationId: string,
    context?: Record<string, any>
  ): Promise<DocumentResolverResult> {
    if (!this.queryService) throw new Error('QueryService not injected')
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId);

    // ── 1. Load proposal ──────────────────────────────────────────────────
    let proposal: any = null;
    if (isUuid) {
      proposal = await this.queryService.getProposal(applicationId)
    }

    if (!proposal) {
      proposal = await this.queryService.getProposalByProjectOrNumber(applicationId)
    }

    if (!proposal) {
      // Check project table
      const proj = await this.queryService.getProject(applicationId)
      if (proj) {
        const firstMineCd = proj.project_mines?.[0]?.mine_cd
        const mMaster = firstMineCd ? await this.queryService.getMineMaster(firstMineCd) : null
        const aMaster = mMaster?.area_cd ? await this.queryService.getAreaMaster(mMaster.area_cd) : null

        proposal = {
          proposal_id: applicationId,
          proposal_no: applicationId,
          proposal_dt: new Date(),
          mine_cd: firstMineCd || 'N/A',
          area_cd: mMaster?.area_cd || 'N/A',
          proj_cd: proj.projCd,
          purpose_justification: proj.projNm || 'Acquisition Proposal',
          mine_master: mMaster || { mine_en: proj.projNm },
          area_master: aMaster || null,
        };
      } else {
        throw new Error(`Proposal or Project with ID ${applicationId} not found — cannot resolve Form-VII`);
      }
    }

    // ── 2. Load mine_master and area_master details if missing ─────────────
    let mineName = proposal.mine_master?.mine_en || '';
    let areaName = proposal.area_master?.area_en || '';

    if (!mineName && proposal.mine_cd) {
      const m = await this.queryService.getMineMaster(proposal.mine_cd)
      if (m) mineName = m.mine_en || m.mine_cd;
    }

    if (!areaName && proposal.area_cd) {
      const a = await this.queryService.getAreaMaster(proposal.area_cd)
      if (a) areaName = a.area_en || a.area_cd;
    }

    // Explicit fallback for raw numeric codes if master names are identical to code or missing
    if (!mineName || mineName === proposal.mine_cd) {
      if (proposal.mine_cd === '4103') mineName = 'BANKOLA AO';
    }
    if (!areaName || areaName === proposal.area_cd) {
      if (proposal.area_cd === '4151') areaName = 'JHANJRA AREA';
    }

    let plots: any[] = await this.queryService.getPlots(applicationId, isUuid, true)

    if (plots.length === 0 && proposal.plot_schedule && proposal.plot_schedule.length > 0) {
      plots = proposal.plot_schedule;
    }

    if (plots.length === 0 && proposal.mine_cd) {
      plots = await this.queryService.getPlots(applicationId, isUuid, true, proposal.mine_cd)
    }

    if (plots.length === 0 && context?.plots && Array.isArray(context.plots)) {
      plots = context.plots;
    }

    const getMouzaName = (p: any) =>
      p?.mouza_master?.mouza_en || p?.mouza_master?.mouza_loc_vern || (p?.mouza_master as any)?.mouza_nm || p?.mouza_name || '';

    const formatPlotNumber = (raw?: string | null): string => {
      if (!raw) return '';
      const trimmed = String(raw).trim();
      if (!trimmed) return '';
      // If already prefixed with LR, RS, CS, BS, etc.
      if (/^(LR|RS|CS|BS)/i.test(trimmed)) return trimmed.toUpperCase();
      // If long LGD/composite ID (e.g., 1928190521112)
      if (/^\d{9,}$/.test(trimmed)) {
        const plotPart = trimmed.slice(-4).replace(/^0+/, '') || trimmed.slice(-3);
        return `LR ${plotPart}`;
      }
      return `LR ${trimmed}`;
    };

    const getPlotNoStr = (p: any) => {
      const raw = p.plot_number || p.plot_no || p.plotNo || p.plot_id || '';
      return formatPlotNumber(raw);
    };

    // ── 3. Separate Annexure groups ───────────────────────────────────────
    let annexureA = plots.filter(
      (p) => !p.acq_status || p.acq_status === 'PROPOSED' || p.acq_status === 'A' || p.acq_status === 'CLEAR'
    );
    const annexureB = plots.filter(
      (p) => p.acq_status === 'PURCHASED' || p.acq_status === 'B'
    );
    const annexureC = plots.filter(
      (p) => p.acq_status === 'PARTIALLY_PURCHASED' || p.acq_status === 'C' || p.acq_status === 'PARTIAL'
    );

    // Fallback: if acq_status is not explicitly tagged, treat all non-B/C plots as Annexure A
    if (annexureA.length === 0 && annexureB.length === 0 && annexureC.length === 0) {
      annexureA = plots;
    }

    const totalProposedArea = annexureA.reduce(
      (sum, p) => sum + Number(p.to_be_acquired_area ?? 0), 0
    );
    const totalPurchasedArea = annexureB.reduce(
      (sum, p) => sum + Number(p.total_poss_area ?? p.to_be_acquired_area ?? 0), 0
    );
    const totalPartialArea = annexureC.reduce(
      (sum, p) => sum + Number(p.to_be_acquired_area ?? 0), 0
    );
    const grandTotalArea = totalProposedArea + totalPartialArea;

    // Primary Mouza (most common among clear plots)
    const primaryMouza =
      getMouzaName(annexureA[0]) ||
      getMouzaName(plots[0]) ||
      context?.mouzaName ||
      context?.form_data?.PrimaryMouzaName ||
      '';

    // All unique Mouzas
    const allMouzas = [...new Set(plots.map((p) => getMouzaName(p)).filter(Boolean))];

    // Formatted Plot numbers by Annexure (e.g. LR 112, LR 113)
    const plotNosA = annexureA.map((p) => getPlotNoStr(p)).filter(Boolean).join(', ');
    const plotNosB = annexureB.map((p) => getPlotNoStr(p)).filter(Boolean).join(', ');
    const plotNosC = annexureC.map((p) => getPlotNoStr(p)).filter(Boolean).join(', ');
    const allPlotNos = plots.map((p) => getPlotNoStr(p)).filter(Boolean).join(', ');

    // Adjacent colliery — SOP requires selecting the adjacent colliery sharing the common leasehold boundary.
    // Pulled from workspace form input or extraData context.
    const formData = context?.form_data || {};
    const adjCollieryName: string =
      formData.AdjacentCollieryName ||
      formData.adj_colliery_name ||
      formData.adjacentCollieryName ||
      context?.adjacentCollieryName ||
      context?.adj_colliery_name ||
      '';
    const adjAreaName: string =
      formData.AdjacentAreaName ||
      formData.adj_area_name ||
      formData.adjacentAreaName ||
      context?.adjacentAreaName ||
      context?.adj_area_name ||
      '';

    const displayAdjColliery = adjCollieryName || '[Adjacent Colliery Name]';
    const displayAdjArea = adjAreaName || '[Adjacent Area Name]';
    const displayPlotNos = plotNosA || allPlotNos || formData.PlotNumbers || formData.PlotNo || '';
    const displayMouza = primaryMouza || formData.MouzaName || formData.PrimaryMouzaName || '';
    const displayAcqColliery = mineName || proposal.mine_master?.mine_en || proposal.mine_master?.mine_nm || proposal.mine_cd || '';
    const displayAcqArea = areaName || proposal.area_master?.area_en || proposal.area_master?.area_nm || proposal.area_cd || '';
    const displayPurpose = proposal.purpose_justification || 'Land Acquisition Proposal';

    // ── 4. Build reconciliation table (one row per plot) ──────────────────
    const ReconciliationTable = plots.map((p, idx) => ({
      SNo: (idx + 1).toString(),
      PlotNo: getPlotNoStr(p),
      MouzaName: getMouzaName(p),
      JLNo: p.jl_no ?? '',
      TotalRORArea: Number(p.total_ror_area ?? 0).toFixed(4),
      ProposedArea: Number(p.to_be_acquired_area ?? 0).toFixed(4),
      PurchasedArea: Number(p.total_poss_area ?? 0).toFixed(4),
      AnnexureTag:
        p.acq_status === 'PURCHASED' || p.acq_status === 'B'
          ? 'B'
          : p.acq_status === 'PARTIALLY_PURCHASED' || p.acq_status === 'C'
          ? 'C'
          : 'A',
      Status:
        p.acq_status === 'PURCHASED' || p.acq_status === 'B'
          ? 'Previously Purchased — Dropped'
          : p.acq_status === 'PARTIALLY_PURCHASED' || p.acq_status === 'C'
          ? 'Partially Purchased'
          : 'Clear to Acquire',
      Remarks: p.remarks ?? '',
    }));

    // ── 5. Return fields + tables ─────────────────────────────────────────
    return {
      fields: {
        // Header
        ProposalNo: proposal.proposal_no || '',
        ProposalDate: proposal.proposal_dt
          ? new Date(proposal.proposal_dt).toLocaleDateString('en-IN')
          : new Date().toLocaleDateString('en-IN'),
        CertificateDate: new Date().toLocaleDateString('en-IN'),

        // Acquiring side
        AcquiringCollieryName: displayAcqColliery,
        CollieryName: displayAcqColliery,
        AcquiringColliery: displayAcqColliery,
        MineName: displayAcqColliery,
        
        AcquiringAreaName: displayAcqArea,
        AreaName: displayAcqArea,
        AcquiringArea: displayAcqArea,
        
        AcquisitionPurpose: displayPurpose,
        Purpose: displayPurpose,

        // Adjacent side
        AdjacentCollieryName: displayAdjColliery,
        AdjacentColliery: displayAdjColliery,
        AdjacentAreaName: displayAdjArea,
        AdjacentArea: displayAdjArea,

        // Mouza / Plot summary (supports both single plot & multi-plot list templates)
        PlotNo: displayPlotNos,
        PlotNos: displayPlotNos,
        PlotNumber: displayPlotNos,
        PlotNumbers: displayPlotNos,
        PrimaryMouzaName: displayMouza,
        MouzaName: displayMouza,
        Mouza: displayMouza,
        
        AllMouzaNames: allMouzas.length > 0 ? allMouzas.join(', ') : displayMouza,
        AllPlotNumbers: displayPlotNos,
        PlotNumbersAnnexureA: plotNosA || displayPlotNos,
        PlotNumbersAnnexureB: plotNosB || 'None',
        PlotNumbersAnnexureC: plotNosC || 'None',
        TotalPlots: plots.length.toString(),

        // Area summary
        TotalAcquiredArea: grandTotalArea.toFixed(4),
        TotalProposedArea: totalProposedArea.toFixed(4),
        TotalPurchasedArea: totalPurchasedArea.toFixed(4),
        TotalPartialArea: totalPartialArea.toFixed(4),

        // Scheme reference
        SchemeRefNo: proposal.pr_scheme_ref_no ?? '',

        // Signatures (Purchasing Colliery)
        PurchasingLandClerkSignature: '',
        PurchasingSurveyOfficerSignature: '',
        PurchasingProjectManagerSignature: '',
        PurchasingProjectAgentSignature: '',
        PurchasingAreaLandOfficerSignature: '',
        PurchasingAreaGeneralManagerSignature: '',

        // Signatures (Adjacent Colliery)
        AdjacentLandClerkSignature: '',
        AdjacentSurveyOfficerSignature: '',
        AdjacentProjectManagerSignature: '',
        AdjacentProjectAgentSignature: '',
        AdjacentAreaLandOfficerSignature: '',
        AdjacentAreaGeneralManagerSignature: '',

        // Certification text
        CertificationStatement:
          `It is hereby certified that the plots listed in Annexure A (${displayPlotNos}) ` +
          `of Mouza ${displayMouza}, proposed for acquisition by ${displayAcqColliery}, ` +
          `have been verified against the acquisition register of ${displayAdjColliery} ` +
          `and are confirmed to have no prior acquisition overlap.`,
      },

      tables: {
        ReconciliationTable,
      },
    };
  }
}