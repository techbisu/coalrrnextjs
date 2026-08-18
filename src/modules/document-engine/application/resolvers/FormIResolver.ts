import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
import { getDisplayPlotNo } from '@/shared/utils/plot.utils'

/**
 * FormIResolver — Citizen Land/Employment Intake (Form-I)
 *
 * Form-I captures the landowner's personal declaration, bank details,
 * land plot ownerships, and consent for compensation.
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
          form_i_claim_plot: true,
        },
      })

      if (!claim) {
        return {
          fields: {
            ClaimCode: applicationId,
            LandOwnerName: 'N/A',
            ApplicationDate: new Date().toLocaleDateString('en-IN'),
          },
          tables: {
            LandParcels: [],
          },
        }
      }

      // Query Land Loser Master profile if available for full demographics & address details
      const masterProfile = claim.citizen_id_hash
        ? await db.land_loser_master.findUnique({
            where: { citizen_id_hash: claim.citizen_id_hash },
          })
        : null

      const c = claim as any
      const ownerName = c.claimant_name || masterProfile?.full_name || 'N/A'
      const fatherName = c.father_husband_name || masterProfile?.father_husband_name || 'N/A'
      const presentAddr = c.present_address || masterProfile?.present_address || 'N/A'
      const permAddr = c.permanent_address || masterProfile?.permanent_address || 'N/A'
      const fullAddr = presentAddr === permAddr ? presentAddr : `Present: ${presentAddr} | Permanent: ${permAddr}`
      
      const epicNo = c.epic_no || masterProfile?.epic_no || 'N/A'
      
      // Mask Aadhaar: format as XXXX-XXXX-LAST4 (e.g. XXXX-XXXX-50EE)
      const rawAadhaar = masterProfile?.citizen_id_hash || c.citizen_id_hash || ''
      const aadhaarNo = rawAadhaar && rawAadhaar.length >= 4
        ? `XXXX-XXXX-${rawAadhaar.slice(-4).toUpperCase()}`
        : 'N/A'

      const occupation = c.occupation || masterProfile?.occupation || 'N/A'
      const gender = c.gender || masterProfile?.gender || 'N/A'
      const nationality = c.nationality || masterProfile?.nationality || 'Indian'
      const religion = c.religion || masterProfile?.religion || 'N/A'
      const caste = c.caste_category || masterProfile?.caste_category || 'N/A'

      const bankName = c.bank_name || masterProfile?.bank_name || 'N/A'
      const bankBranch = c.bank_branch || masterProfile?.bank_branch || 'N/A'
      const bankAcc = c.bank_account_number || masterProfile?.bank_account_number || 'N/A'
      const ifsc = c.bank_ifsc || masterProfile?.bank_ifsc || 'N/A'
      const photoDocId = c.photo_doc_id || masterProfile?.photo_doc_id || ''

      const decls: any[] = Array.isArray(c.statutory_declarations) ? (c.statutory_declarations as any[]) : []
      const getDecl = (qNo: number) => decls.find((d: any) => d.q_no === qNo)

      // Q9 to Q15 Declarations
      const q9Answer = (c.prior_compensation_received !== null && c.prior_compensation_received !== undefined)
        ? (c.prior_compensation_received ? 'YES' : 'NO')
        : (getDecl(9)?.answer_boolean ? 'YES' : 'NO')
      const q9Details = c.prior_compensation_details || getDecl(9)?.details || 'N/A'

      const q11Answer = (c.prior_employment_linked !== null && c.prior_employment_linked !== undefined)
        ? (c.prior_employment_linked ? 'YES' : 'NO')
        : (getDecl(11)?.answer_boolean ? 'YES' : 'NO')
      const q11Details = c.prior_employment_details || getDecl(11)?.details || 'N/A'

      const q12Answer = (c.is_free_from_disputes !== null && c.is_free_from_disputes !== undefined)
        ? (c.is_free_from_disputes ? 'YES' : 'NO')
        : (getDecl(12)?.answer_boolean !== false ? 'YES' : 'NO')
      const q12Details = c.dispute_details || getDecl(12)?.details || 'N/A'

      const q13Answer = (c.is_free_from_encumbrances !== null && c.is_free_from_encumbrances !== undefined)
        ? (c.is_free_from_encumbrances ? 'YES' : 'NO')
        : (getDecl(13)?.answer_boolean !== false ? 'YES' : 'NO')
      const q13Details = c.encumbrance_details || getDecl(13)?.details || 'N/A'

      const q14Answer = (c.can_handover_possession !== null && c.can_handover_possession !== undefined)
        ? (c.can_handover_possession ? 'YES' : 'NO')
        : (getDecl(14)?.answer_boolean !== false ? 'YES' : 'NO')
      const q14Details = c.possession_reason || getDecl(14)?.details || 'N/A'

      const q15Answer = (c.opted_monetary_in_lieu_of_employment !== null && c.opted_monetary_in_lieu_of_employment !== undefined)
        ? (c.opted_monetary_in_lieu_of_employment ? 'YES' : 'NO')
        : (getDecl(15)?.answer_boolean ? 'YES' : 'NO')
      const q15Details = c.monetary_opt_reason || getDecl(15)?.details || 'N/A'

      const plotsList = claim.form_i_claim_plot || []

      const resolvedParcels = await Promise.all(
        plotsList.map(async (p: any) => {
          const plotSchedId = p.plot_schedule_id || p.plot_no
          const plot = plotSchedId
            ? await db.plot_schedule.findFirst({
                where: {
                  OR: [
                    ...(!isNaN(Number(plotSchedId)) ? [{ schedule_id: BigInt(plotSchedId) }] : []),
                    { plot_no: plotSchedId },
                    { plot_number: plotSchedId },
                  ],
                },
                include: { mouza: true },
              })
            : null

          const pl = plot as any
          const mouzaName = pl?.mouza?.mouza_en || (pl?.jl_no ? `JL-${pl.jl_no}` : 'N/A')
          const rawPlotNo = p.plot_no || pl?.plot_no || pl?.plot_number || 'N/A'
          const displayPlotNo = getDisplayPlotNo(rawPlotNo, pl?.mouza?.state_lgd, pl?.mouza?.mouza_lgd)
          const ownShareArea = p.own_share_acres ? String(p.own_share_acres) : (pl?.own_share_acres ? String(pl.own_share_acres) : '0.0000')
          const totalArea = p.total_ror_area ? String(p.total_ror_area) : (pl?.to_be_acquired_area ? String(pl.to_be_acquired_area) : ownShareArea)
          const mode = p.acquisition_mode_offered || 'CBA_ACT'
          const isDirect = mode === 'DIRECT_PURCHASE'
          const isCBA = mode === 'CBA_ACT' || mode === 'LA_ACT'

          return {
            MouzaName: mouzaName,
            PlotNo: displayPlotNo,
            TotalArea: totalArea,
            KhatianNo: p.khatian_no || 'N/A',
            OwnShareArea: ownShareArea,
            LegalInstrument: p.link_deed_no ? `Deed ${p.link_deed_no}` : 'N/A',
            OwnershipDate: p.ownership_date ? new Date(p.ownership_date).toLocaleDateString('en-IN') : 'N/A',
            PreviousOwnerName: p.transferor_name || 'N/A',
            PreviousOwnerFatherName: 'N/A',
            PreviouslyTransferredArea: '0.0000',
            SaleDeedArea: isDirect ? ownShareArea : '0.0000',
            CBAArea: isCBA ? ownShareArea : '0.0000',
            OfferedArea: ownShareArea,
            DirectPurchaseNoticeNo: isDirect ? 'ECL/LA/NOTICE' : 'N/A',
            CBANoticeNo: isCBA ? 'ECL/LA/NOTICE' : 'N/A',
          }
        })
      )

      const primaryParcel = resolvedParcels.length > 0
        ? resolvedParcels[0]
        : {
            MouzaName: 'N/A',
            PlotNo: 'N/A',
            TotalArea: '0.0000',
            KhatianNo: 'N/A',
            OwnShareArea: '0.0000',
            LegalInstrument: 'N/A',
            OwnershipDate: 'N/A',
            PreviousOwnerName: 'N/A',
            PreviousOwnerFatherName: 'N/A',
            PreviouslyTransferredArea: '0.0000',
            SaleDeedArea: '0.0000',
            CBAArea: '0.0000',
            OfferedArea: '0.0000',
            DirectPurchaseNoticeNo: 'N/A',
            CBANoticeNo: 'N/A',
          }

      return {
        fields: {
          ClaimCode: claim.claim_code,
          claim_code: claim.claim_code,

          // Land Owner Name
          LandOwnerName: ownerName,
          LandownerName: ownerName,
          ClaimantName: ownerName,
          claimant_name: ownerName,
          ApplicantName: ownerName,
          full_name: ownerName,

          // Father / Husband Name
          FatherOrHusbandName: fatherName,
          FatherName: fatherName,
          father_husband_name: fatherName,
          Father_Husband_Name: fatherName,
          FatherHusbandName: fatherName,

          // Address
          PresentAddress: presentAddr,
          present_address: presentAddr,
          AddressPresent: presentAddr,
          PermanentAddress: permAddr,
          permanent_address: permAddr,
          AddressPermanent: permAddr,
          FullAddress: fullAddr,
          Address: fullAddr,
          address: fullAddr,

          // Voter (EPIC) & Aadhaar Number (Masked Last 4 Digits)
          EpicNumber: epicNo,
          EpicNo: epicNo,
          epic_no: epicNo,
          VoterId: epicNo,
          VoterNumber: epicNo,
          VoterEpic: epicNo,
          AadhaarNumber: aadhaarNo,
          AadharNumber: aadhaarNo,
          AadhaarNo: aadhaarNo,
          AadharNo: aadhaarNo,
          citizen_id_hash: aadhaarNo,

          // Demographics
          Occupation: occupation,
          occupation: occupation,
          Gender: gender,
          gender: gender,
          Nationality: nationality,
          nationality: nationality,
          Religion: religion,
          religion: religion,
          CommunityCategory: caste,
          CasteCategory: caste,
          caste_category: caste,
          Caste: caste,

          // Top-level Table Placeholders in Form-I-Template.docx
          MouzaName: primaryParcel.MouzaName,
          PlotNo: primaryParcel.PlotNo,
          TotalArea: primaryParcel.TotalArea,
          KhatianNo: primaryParcel.KhatianNo,
          OwnShareArea: primaryParcel.OwnShareArea,
          LegalInstrument: primaryParcel.LegalInstrument,
          OwnershipDate: primaryParcel.OwnershipDate,
          PreviousOwnerName: primaryParcel.PreviousOwnerName,
          PreviousOwnerFatherName: primaryParcel.PreviousOwnerFatherName,
          PreviouslyTransferredArea: primaryParcel.PreviouslyTransferredArea,
          SaleDeedArea: primaryParcel.SaleDeedArea,
          CBAArea: primaryParcel.CBAArea,
          OfferedArea: primaryParcel.OfferedArea,
          DirectPurchaseNoticeNo: primaryParcel.DirectPurchaseNoticeNo,
          CBANoticeNo: primaryParcel.CBANoticeNo,

          // Question 9: Prior Compensation
          CompensationReceived: q9Answer,
          Q9_Answer: q9Answer,
          CompensationDetails: q9Details,
          Q9_Details: q9Details,

          // Question 10: Bank Details
          BankName: bankName,
          bank_name: bankName,
          BranchName: bankBranch,
          bank_branch: bankBranch,
          BankAccountNumber: bankAcc,
          bank_account_number: bankAcc,
          IFSCCode: ifsc,
          bank_ifsc: ifsc,

          // Question 11: Prior Employment Linked
          PreviousEmploymentClaim: q11Answer,
          Q11_Answer: q11Answer,
          EmploymentClaimDetails: q11Details,
          Q11_Details: q11Details,

          // Question 12: Disputes Free
          LandDisputeStatus: q12Answer,
          Q12_Answer: q12Answer,
          DisputeDetails: q12Details,
          Q12_Details: q12Details,

          // Question 13: Encumbrances Free
          EncumbranceFree: q13Answer,
          Q13_Answer: q13Answer,
          EncumbranceDetails: q13Details,
          Q13_Details: q13Details,

          // Question 14: Handover Possession
          PeacefulPossession: q14Answer,
          Q14_Answer: q14Answer,
          PossessionRemarks: q14Details,
          Q14_Details: q14Details,

          // Question 15: One Time Monetary Compensation
          OneTimeCompensationAccepted: q15Answer,
          Q15_Answer: q15Answer,
          CompensationRemarks: q15Details,
          Q15_Details: q15Details,

          ApplicationDate: claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
          ApplicantPhoto: photoDocId ? `/api/files/download/${photoDocId}` : '',
          ApplicantSignature: ownerName,
        },
        tables: {
          LandParcels: resolvedParcels.length > 0 ? resolvedParcels : [primaryParcel],
        },
      }
    } catch (err) {
      console.error('Error resolving FormIResolver:', err)
      return {
        fields: {
          ClaimCode: applicationId,
          LandOwnerName: 'N/A',
          ApplicationDate: new Date().toLocaleDateString('en-IN'),
        },
        tables: {
          LandParcels: [],
        },
      }
    }
  }
}
