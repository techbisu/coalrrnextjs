import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
import { getDisplayPlotNo } from '@/shared/utils/plot.utils'

/**
 * FormIResolver — Citizen Land/Employment Intake (Form-I)
 *
 * Form-I captures the landowner's personal declaration, bank details,
 * land parcel ownerships, and consent for compensation.
 *
 * Template: D:\COALRR\coalrrnextjs\src\lib\engines\docx\templates\Form-I-Template.docx
 */
export class FormIResolver implements IDocumentResolver {
  async resolve(
    applicationId: string,
    context?: Record<string, any>
  ): Promise<DocumentResolverResult> {
    try {
      const claim = await db.form_i_claim.findFirst({
        where: {
          OR: [
            { id: applicationId },
            { claim_code: applicationId },
          ],
        },
        include: {
          land_loser: true,
        },
      })

      if (!claim) {
        return {
          fields: {
            ClaimCode: applicationId,
            LandOwnerName: 'Land Loser',
            ApplicationDate: new Date().toLocaleDateString('en-IN'),
          },
          tables: {
            LandParcels: [],
          },
        }
      }

      // Query plot_schedule to join plot_no and mouza
      const plot = await db.plot_schedule.findFirst({
        where: {
          OR: [
            ...(!isNaN(Number(claim.plot_id)) ? [{ schedule_id: BigInt(claim.plot_id) }] : []),
            { plot_no: claim.plot_id },
            { plot_number: claim.plot_id },
          ],
        },
        include: {
          mouza: true,
        },
      })

      const mouzaName = plot?.mouza?.mouza_en || (plot?.jl_no ? `JL-${plot.jl_no} Mouza` : 'Approved Mouza')
      const rawPlotNo = plot?.plot_no || plot?.plot_number || claim.plot_id
      const displayPlotNo = getDisplayPlotNo(rawPlotNo, plot?.mouza?.state_lgd, plot?.mouza?.mouza_lgd)
      const ownShareArea = claim.own_share_acres ? String(claim.own_share_acres) : '0.0000'
      const totalArea = plot?.to_be_acquired_area ? String(plot.to_be_acquired_area) : ownShareArea

      const mode = claim.acquisition_mode_offered || 'CBA_ACT'
      const isDirect = mode === 'DIRECT_PURCHASE'
      const isCBA = mode === 'CBA_ACT' || mode === 'LA_ACT'

      const decls: any[] = Array.isArray(claim.statutory_declarations) ? (claim.statutory_declarations as any[]) : []
      const getDecl = (qNo: number) => decls.find((d: any) => d.q_no === qNo)

      return {
        fields: {
          ClaimCode: claim.claim_code,
          LandOwnerName: claim.claimant_name,
          FatherOrHusbandName: claim.father_husband_name || 'N/A',
          PresentAddress: claim.present_address || 'N/A',
          PermanentAddress: claim.permanent_address || 'N/A',
          EpicNumber: claim.epic_no || 'N/A',
          AadhaarNumber: claim.citizen_id_hash || 'LOCKED',
          Occupation: claim.occupation || 'Agriculture',
          Gender: claim.gender || 'Male',
          Nationality: claim.nationality || 'Indian',
          Religion: claim.religion || 'Hindu',
          CommunityCategory: claim.caste_category || 'GENERAL',

          CompensationReceived: getDecl(9)?.answer_boolean ? 'YES' : 'NO',
          CompensationDetails: getDecl(9)?.details || 'N/A',
          BankName: claim.bank_name || 'State Bank of India',
          BranchName: claim.bank_branch || 'ECL Main Branch',
          BankAccountNumber: claim.bank_account_number || 'N/A',
          IFSCCode: claim.bank_ifsc || 'N/A',
          PreviousEmploymentClaim: getDecl(11)?.answer_boolean ? 'YES' : 'NO',
          EmploymentClaimDetails: getDecl(11)?.details || 'N/A',
          LandDisputeStatus: getDecl(12)?.answer_boolean !== false ? 'YES' : 'NO',
          DisputeDetails: getDecl(12)?.details || 'N/A',
          EncumbranceFree: getDecl(13)?.answer_boolean !== false ? 'YES' : 'NO',
          EncumbranceDetails: getDecl(13)?.details || 'N/A',
          PeacefulPossession: getDecl(14)?.answer_boolean !== false ? 'YES' : 'NO',
          PossessionRemarks: getDecl(14)?.details || 'N/A',
          OneTimeCompensationAccepted: getDecl(15)?.answer_boolean ? 'YES' : 'NO',
          CompensationRemarks: getDecl(15)?.details || 'N/A',
          ApplicationDate: claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
          ApplicantPhoto: claim.photo_doc_id ? `/api/files/download/${claim.photo_doc_id}` : '',
          ApplicantSignature: claim.claimant_name,
        },
        tables: {
          LandParcels: Array.isArray(claim.plot_entries) && claim.plot_entries.length > 0
            ? claim.plot_entries.map((p: any) => ({
                MouzaName: p.mouza_name || mouzaName,
                PlotNo: getDisplayPlotNo(p.plot_no || p.plot_number || displayPlotNo),
                TotalArea: p.total_ror_area || p.own_share_acres || totalArea,
                KhatianNo: p.khatian_no || claim.khatian_no || 'Kh-102',
                OwnShareArea: String(p.own_share_acres || ownShareArea),
                LegalInstrument: claim.link_deed_no ? `Link Deed ${claim.link_deed_no}` : 'Inherited / Ancestral Deed',
                OwnershipDate: claim.ownership_date ? new Date(claim.ownership_date).toLocaleDateString('en-IN') : 'N/A',
                PreviousOwnerName: claim.transferor_name || 'Ancestral',
                PreviousOwnerFatherName: 'N/A',
                PreviouslyTransferredArea: '0.0000',
                SaleDeedArea: isDirect ? String(p.own_share_acres || ownShareArea) : '0.0000',
                CBAArea: isCBA ? String(p.own_share_acres || ownShareArea) : '0.0000',
                OfferedArea: String(p.own_share_acres || ownShareArea),
                DirectPurchaseNoticeNo: isDirect ? 'ECL/LA/2026/NOT-01' : 'N/A',
                CBANoticeNo: isCBA ? 'ECL/LA/2026/NOT-01' : 'N/A',
              }))
            : [
                {
                  MouzaName: mouzaName,
                  PlotNo: displayPlotNo,
                  TotalArea: totalArea,
                  KhatianNo: claim.khatian_no || 'Kh-102',
                  OwnShareArea: ownShareArea,
                  LegalInstrument: claim.link_deed_no ? `Link Deed ${claim.link_deed_no}` : 'Inherited / Ancestral Deed',
                  OwnershipDate: claim.ownership_date ? new Date(claim.ownership_date).toLocaleDateString('en-IN') : 'N/A',
                  PreviousOwnerName: claim.transferor_name || 'Ancestral',
                  PreviousOwnerFatherName: 'N/A',
                  PreviouslyTransferredArea: '0.0000',
                  SaleDeedArea: isDirect ? ownShareArea : '0.0000',
                  CBAArea: isCBA ? ownShareArea : '0.0000',
                  OfferedArea: ownShareArea,
                  DirectPurchaseNoticeNo: isDirect ? 'ECL/LA/2026/NOT-01' : 'N/A',
                  CBANoticeNo: isCBA ? 'ECL/LA/2026/NOT-01' : 'N/A',
                },
              ],
        },
      }
    } catch (err) {
      console.error('Error resolving FormIResolver:', err)
      return {
        fields: {
          ClaimCode: applicationId,
          LandOwnerName: 'Land Loser',
          ApplicationDate: new Date().toLocaleDateString('en-IN'),
        },
        tables: {
          LandParcels: [],
        },
      }
    }
  }
}
