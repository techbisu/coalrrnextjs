import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'

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
  async resolve(
    applicationId: string,
    context?: Record<string, any>
  ): Promise<DocumentResolverResult> {

    // ── 1. Load proposal ──────────────────────────────────────────────────
    const proposal = await db.acq_proposal.findUnique({
      where: { proposal_id: applicationId },
      include: {
        mine_master: true,
        area_master: true,
      },
    })

    if (!proposal) {
      throw new Error(`Proposal ${applicationId} not found — cannot resolve Form-VII`)
    }

    // ── 2. Load plots with their Mouza names ──────────────────────────────
    const plots = await db.plot_schedule.findMany({
      where: {
        proposal_id: applicationId,
        del_ts: null,
      },
      include: {
        mouza_master: true,
      },
      orderBy: { schedule_id: 'asc' },
    })

    // ── 3. Separate Annexure groups ───────────────────────────────────────
    const annexureA = plots.filter(p => p.acq_status === 'PROPOSED')
    const annexureB = plots.filter(p => p.acq_status === 'PURCHASED')
    const annexureC = plots.filter(p => p.acq_status === 'PARTIALLY_PURCHASED')

    const totalProposedArea = annexureA.reduce(
      (sum, p) => sum + Number(p.to_be_acquired_area ?? 0), 0
    )
    const totalPurchasedArea = annexureB.reduce(
      (sum, p) => sum + Number(p.to_be_acquired_area ?? 0), 0
    )
    const totalPartialArea = annexureC.reduce(
      (sum, p) => sum + Number(p.to_be_acquired_area ?? 0), 0
    )
    const grandTotalArea = totalProposedArea + totalPartialArea

    // Primary Mouza (most common among clear plots)
    const primaryMouza = annexureA[0]?.mouza_master?.mouza_nm
      ?? plots[0]?.mouza_master?.mouza_nm
      ?? context?.mouzaName
      ?? ''

    // All unique Mouzas
    const allMouzas = [...new Set(plots.map(p => p.mouza_master?.mouza_nm).filter(Boolean))]

    // Plot numbers by Annexure
    const plotNosA = annexureA.map(p => p.plot_number ?? p.plot_no).join(', ')
    const plotNosB = annexureB.map(p => p.plot_number ?? p.plot_no).join(', ')
    const plotNosC = annexureC.map(p => p.plot_number ?? p.plot_no).join(', ')
    const allPlotNos = plots.map(p => p.plot_number ?? p.plot_no).join(', ')

    // Adjacent colliery — passed via extraData/context at workspace launch
    const adjCollieryName: string = context?.adjacentCollieryName ?? context?.adj_colliery_name ?? ''
    const adjAreaName: string    = context?.adjacentAreaName    ?? context?.adj_area_name    ?? ''

    // ── 4. Build reconciliation table (one row per plot) ──────────────────
    const ReconciliationTable = plots.map((p, idx) => ({
      SNo:            (idx + 1).toString(),
      PlotNo:         p.plot_number ?? p.plot_no ?? '',
      MouzaName:      p.mouza_master?.mouza_nm ?? '',
      JLNo:           p.jl_no ?? '',
      TotalRORArea:   Number(p.total_ror_area ?? 0).toFixed(4),
      ProposedArea:   Number(p.to_be_acquired_area ?? 0).toFixed(4),
      PurchasedArea:  Number(p.total_poss_area ?? 0).toFixed(4),
      AnnexureTag:    p.acq_status === 'PURCHASED' ? 'B' : p.acq_status === 'PARTIALLY_PURCHASED' ? 'C' : 'A',
      Status:         p.acq_status === 'PURCHASED'
                        ? 'Previously Purchased — Dropped'
                        : p.acq_status === 'PARTIALLY_PURCHASED'
                        ? 'Partially Purchased'
                        : 'Clear to Acquire',
      Remarks:        p.remarks ?? '',
    }))

    // ── 5. Return fields + tables ─────────────────────────────────────────
    return {
      fields: {
        // Header
        ProposalNo:              proposal.proposal_no,
        ProposalDate:            proposal.proposal_dt
                                   ? new Date(proposal.proposal_dt).toLocaleDateString('en-IN')
                                   : '',
        CertificateDate:         new Date().toLocaleDateString('en-IN'),

        // Acquiring side
        AcquiringCollieryName:   proposal.mine_master?.mine_nm ?? proposal.mine_cd,
        AcquiringAreaName:       proposal.area_master?.area_nm ?? proposal.area_cd,
        AcquisitionPurpose:      proposal.purpose_justification ?? '',

        // Adjacent side (supplied at workspace launch via extraData)
        AdjacentCollieryName:    adjCollieryName,
        AdjacentAreaName:        adjAreaName,

        // Mouza / Plot summary
        PrimaryMouzaName:        primaryMouza,
        AllMouzaNames:           allMouzas.join(', '),
        AllPlotNumbers:          allPlotNos,
        PlotNumbersAnnexureA:    plotNosA || 'None',
        PlotNumbersAnnexureB:    plotNosB || 'None',
        PlotNumbersAnnexureC:    plotNosC || 'None',
        TotalPlots:              plots.length.toString(),

        // Area summary
        TotalAcquiredArea:       grandTotalArea.toFixed(4),
        TotalProposedArea:       totalProposedArea.toFixed(4),
        TotalPurchasedArea:      totalPurchasedArea.toFixed(4),
        TotalPartialArea:        totalPartialArea.toFixed(4),

        // Scheme reference
        SchemeRefNo:             proposal.pr_scheme_ref_no ?? '',

        // Certification text
        CertificationStatement:
          `It is hereby certified that the plots listed in Annexure A (${plotNosA || 'Nil'}) ` +
          `of Mouza ${primaryMouza}, proposed for acquisition by ${proposal.mine_master?.mine_nm ?? proposal.mine_cd}, ` +
          `have been verified against the acquisition register of ${adjCollieryName || 'the adjacent colliery'} ` +
          `and are confirmed to have no prior acquisition overlap.`,
      },

      tables: {
        ReconciliationTable,
      },
    }
  }
}