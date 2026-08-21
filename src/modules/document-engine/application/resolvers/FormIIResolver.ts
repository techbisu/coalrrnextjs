import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
import { getDisplayPlotNo } from '@/shared/utils/plot.utils'

/**
 * FormIIResolver — Statutory Form-II (Form 2) Claim Verification & Award Report
 *
 * Form-II is the verification and award recommendation report prepared by the Revenue/LA Officer,
 * incorporating landowner declarations, land parcel details, and Questions 3 to 13 verification fields.
 *
 * Template Code: FORM_II
 */
export class FormIIResolver implements IDocumentResolver {
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

      const c = (claim || {}) as any
      const ownerName = c.claimant_name || 'N/A'
      const fatherName = c.father_husband_name || 'N/A'
      const presentAddr = c.present_address || 'N/A'
      const permAddr = c.permanent_address || 'N/A'
      const fullAddr = presentAddr === permAddr ? presentAddr : `Present: ${presentAddr} | Permanent: ${permAddr}`
      const epicNo = c.epic_no || 'N/A'
      
      const rawAadhaar = c.citizen_id_hash || ''
      const aadhaarNo = rawAadhaar && rawAadhaar.length >= 4
        ? `XXXX-XXXX-${rawAadhaar.slice(-4).toUpperCase()}`
        : 'N/A'

      const bankName = c.bank_name || 'N/A'
      const bankBranch = c.bank_branch || 'N/A'
      const bankAcc = c.bank_account_number || 'N/A'
      const ifsc = c.bank_ifsc || 'N/A'

      // Context contains dynamic form input values for Questions 3 to 13 saved via DocumentWorkspace
      const ctx = (context && context.form_data) ? context.form_data : (context || {})

      const purposeOfPossession = ctx.PurposeOfPossession || ctx.Q3_PurposeOfPossession || ''
      const ownershipBeforeUse = ctx.OwnershipBeforeUse || ctx.Q4_OwnershipPriorToCompanyUse || ''
      const withinApprovedWorkingArea = ctx.WithinApprovedWorkingArea || ctx.Q5_LiesInApprovedProjectArea || ''
      
      const compVal = ctx.CompetentApprovalStatus || ctx.Q6_IncludedInApprovedSchedule || ''
      const refNo = ctx.CompetentApprovalRefNo ? String(ctx.CompetentApprovalRefNo).trim() : ''
      const rawDoc = ctx.CompetentApprovalDocId
      const fileName = typeof rawDoc === 'object' && rawDoc?.file_name ? String(rawDoc.file_name) : ''

      const compRefParts: string[] = []
      if (refNo) compRefParts.push(`Ref No: ${refNo}`)
      if (fileName) compRefParts.push(`Attached Copy: ${fileName}`)

      const competentApprovalStatus = compVal === 'Yes' 
        ? (compRefParts.length > 0 ? `Yes (${compRefParts.join(' | ')})` : 'Yes') 
        : (compVal === 'No' ? 'No' : '')

      const previouslyAcquiredStatus = ctx.PreviouslyAcquiredStatus || ctx.Q7_NeverAcquiredOrBelongsToECL || ''
      const erstwhileManagementStatus = ctx.ErstwhileManagementStatus || ctx.Q8_AcquiredBeforeNationalization || ''
      const preNationalizationDamageStatus = ctx.PreNationalizationDamageStatus || ctx.Q9_AffectedDamagedBeforeNationalization || ''
      const governmentLandStatus = ctx.GovernmentLandStatus || ctx.Q10_VestedInStateOrForestDept || ''
      const previousCompensationStatus = ctx.PreviousCompensationStatus || ctx.Q11_PriorCompensationOrBenefitProvided || ''
      const masterPlanStatus = ctx.MasterPlanStatus || ctx.Q12_IncludedInRaniganjMasterPlan || ''
      
      const revVal = ctx.RevenuePlanAttachment || ctx.Q13_RevenuePlanAttached || ''
      const rawRevDoc = ctx.RevenuePlanDocId
      const revFileName = typeof rawRevDoc === 'object' && rawRevDoc?.file_name ? String(rawRevDoc.file_name) : ''

      const revenuePlanAttachment = revVal === 'Yes'
        ? (revFileName ? `Yes (Attached Map: ${revFileName})` : 'Yes')
        : (revVal === 'No' ? 'No' : '')

      let resolvedUnitName = ctx.NameOfUnit || 'N/A'
      let resolvedMineName = ctx.NameOfColliery || 'N/A'
      let resolvedAreaName = ctx.AreaName || 'N/A'

      const allClaimPlots = claim?.form_i_claim_plot || []
      // Prefer strictly title_approval_status === 'APPROVED' plots, fallback to all claim plots if none approved yet
      const approvedClaimPlots = allClaimPlots.filter((p: any) => p.title_approval_status === 'APPROVED')
      const plotsList = approvedClaimPlots.length > 0 ? approvedClaimPlots : allClaimPlots

      const resolvedParcels = await Promise.all(
        plotsList.map(async (p: any, idx: number) => {
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
                include: {
                  mouza: true,
                  acq_proposal: {
                    include: {
                      area: true,
                      mine: true,
                      project: true,
                      acqu_mode: true,
                    },
                  },
                },
              })
            : null

          const pl = plot as any
          let resolvedProjectName = pl?.acq_proposal?.project?.projNm || 'N/A'

          if (resolvedProjectName === 'N/A' && pl?.acq_proposal?.proj_cd) {
            const projDb = await db.project.findFirst({
              where: { projCd: String(pl.acq_proposal.proj_cd) },
            })
            if (projDb?.projNm) {
              resolvedProjectName = projDb.projNm
            }
          }

          if (pl?.acq_proposal?.area?.area_en) {
            resolvedAreaName = pl.acq_proposal.area.area_en
          }
          if (pl?.acq_proposal?.mine?.mine_en) {
            resolvedMineName = pl.acq_proposal.mine.mine_en
          }

          let unitProjectStr = ''
          if (resolvedMineName !== 'N/A' && resolvedProjectName !== 'N/A') {
            unitProjectStr = `${resolvedMineName} / ${resolvedProjectName}`
          } else if (resolvedMineName !== 'N/A') {
            unitProjectStr = resolvedMineName
          } else if (resolvedProjectName !== 'N/A') {
            unitProjectStr = resolvedProjectName
          }

          if (unitProjectStr && resolvedAreaName !== 'N/A') {
            resolvedUnitName = `${unitProjectStr} & ${resolvedAreaName}`
          } else if (unitProjectStr) {
            resolvedUnitName = unitProjectStr
          } else if (resolvedAreaName !== 'N/A') {
            resolvedUnitName = resolvedAreaName
          } else {
            resolvedUnitName = 'N/A'
          }

          const mouzaName = pl?.mouza?.mouza_en || (pl?.jl_no ? `JL-${pl.jl_no}` : 'N/A')
          const jlNo = pl?.jl_no || 'N/A'
          const rawPlotNo = p.plot_no || pl?.plot_no || pl?.plot_number || 'N/A'
          const displayPlotNo = getDisplayPlotNo(rawPlotNo, pl?.mouza?.state_lgd, pl?.mouza?.mouza_lgd)
          
          // Form 1 Approved Area for Claimant Plot
          const ownShareArea = p.own_share_acres ? String(p.own_share_acres) : '0.0000'
          
          // Total Area from acquisition.plot_schedule to_be_acquired_area
          const plotSchedToBeAcquired = pl?.to_be_acquired_area != null ? String(pl.to_be_acquired_area) : null
          const totalArea = plotSchedToBeAcquired || (p.total_ror_area ? String(p.total_ror_area) : ownShareArea)
          
          // Acquisition Mode from acquisition.acq_proposal -> master.acqu_mode (aquisition_method)
          const rawAcqMethod = pl?.acq_proposal?.acqu_mode?.aquisition_method || p.acquisition_mode_offered || 'CBA_ACT'
          const upperAcqMethod = String(rawAcqMethod).toUpperCase()
          const isDirectPurchase = upperAcqMethod.includes('DIRECT') || upperAcqMethod.includes('PURCHASE')
          
          const directPurchaseArea = isDirectPurchase ? ownShareArea : 'N/A'
          const cbaArea = !isDirectPurchase ? ownShareArea : 'N/A'

          const sharePct = p.total_ror_area && Number(p.total_ror_area) > 0 
            ? `${((Number(p.own_share_acres) / Number(p.total_ror_area)) * 100).toFixed(2)}%`
            : '100%'

          return {
            SlNo: idx + 1,
            sl_no: idx + 1,
            ClaimantName: ownerName,
            LandOwnerName: ownerName,
            LandLoserName: ownerName,
            FatherOrHusbandName: fatherName,
            FullAddress: fullAddr,
            Mouza: mouzaName,
            MouzaName: mouzaName,
            mouza_name: mouzaName,
            JLNo: jlNo,
            jl_no: jlNo,
            PlotNo: displayPlotNo,
            plot_no: displayPlotNo,
            KhatianNo: p.khatian_no || 'N/A',
            khatian_no: p.khatian_no || 'N/A',
            TotalArea: totalArea,
            total_area: totalArea,
            ApprovedArea: ownShareArea,
            AreaOffered: ownShareArea,
            OwnShareArea: ownShareArea,
            own_share_area: ownShareArea,
            DirectPurchaseArea: directPurchaseArea,
            CBAArea: cbaArea,
            TotalPossessionArea: ownShareArea,
            SharePercentage: sharePct,
            LegalInstrument: p.link_deed_no ? `Deed ${p.link_deed_no}` : 'N/A',
            LinkDeedNo: p.link_deed_no || 'N/A',
            OwnershipDate: p.ownership_date ? new Date(p.ownership_date).toLocaleDateString('en-IN') : 'N/A',
            DateOfUse: p.ownership_date ? new Date(p.ownership_date).toLocaleDateString('en-IN') : 'N/A',
            TransferorName: p.transferor_name || 'N/A',
            AcquisitionMode: rawAcqMethod,
            VerificationStatus: p.title_approval_status || 'VERIFIED',
            TitleStatus: p.title_approval_status || 'VERIFIED',
          }
        })
      )

      const primaryParcel = resolvedParcels.length > 0
        ? resolvedParcels[0]
        : {
            SlNo: 1,
            sl_no: 1,
            ClaimantName: ownerName,
            LandOwnerName: ownerName,
            LandLoserName: ownerName,
            FatherOrHusbandName: fatherName,
            FullAddress: fullAddr,
            Mouza: 'N/A',
            MouzaName: 'N/A',
            mouza_name: 'N/A',
            JLNo: 'N/A',
            jl_no: 'N/A',
            PlotNo: 'N/A',
            plot_no: 'N/A',
            KhatianNo: 'N/A',
            khatian_no: 'N/A',
            TotalArea: '0.0000',
            total_area: '0.0000',
            ApprovedArea: '0.0000',
            AreaOffered: '0.0000',
            OwnShareArea: '0.0000',
            own_share_area: '0.0000',
            DirectPurchaseArea: '0.0000',
            CBAArea: '0.0000',
            TotalPossessionArea: '0.0000',
            SharePercentage: '0%',
            LegalInstrument: 'N/A',
            LinkDeedNo: 'N/A',
            OwnershipDate: 'N/A',
            DateOfUse: 'N/A',
            TransferorName: 'N/A',
            AcquisitionMode: 'CBA_ACT',
            VerificationStatus: 'UNVERIFIED',
            TitleStatus: 'UNVERIFIED',
          }

      const tableData = resolvedParcels.length > 0 ? resolvedParcels : [primaryParcel]

      // Aggregate all plots for single-row DOCX template tags
      const allMouzas = [...new Set(resolvedParcels.map(p => p.Mouza).filter(m => m && m !== 'N/A'))].join(', ') || primaryParcel.Mouza
      const allPlotNos = resolvedParcels.map(p => p.PlotNo).filter(p => p && p !== 'N/A').join(', ') || primaryParcel.PlotNo
      const allKhatians = [...new Set(resolvedParcels.map(p => p.KhatianNo).filter(k => k && k !== 'N/A'))].join(', ') || primaryParcel.KhatianNo

      const sumTotalArea = resolvedParcels.reduce((acc, p) => acc + (Number(p.TotalArea) || 0), 0)
      const sumApprovedArea = resolvedParcels.reduce((acc, p) => acc + (Number(p.ApprovedArea) || 0), 0)

      const sumDirectPurchase = resolvedParcels.reduce((acc, p) => {
        const v = Number(p.DirectPurchaseArea)
        return acc + (isNaN(v) ? 0 : v)
      }, 0)
      const sumCBA = resolvedParcels.reduce((acc, p) => {
        const v = Number(p.CBAArea)
        return acc + (isNaN(v) ? 0 : v)
      }, 0)

      const combinedTotalArea = sumTotalArea > 0 ? sumTotalArea.toFixed(4) : primaryParcel.TotalArea
      const combinedApprovedArea = sumApprovedArea > 0 ? sumApprovedArea.toFixed(4) : primaryParcel.ApprovedArea
      const combinedDirectPurchaseArea = sumDirectPurchase > 0 ? sumDirectPurchase.toFixed(4) : (resolvedParcels.some(p => p.DirectPurchaseArea === 'N/A') && sumDirectPurchase === 0 ? 'N/A' : '0.0000')
      const combinedCBAArea = sumCBA > 0 ? sumCBA.toFixed(4) : (resolvedParcels.some(p => p.CBAArea === 'N/A') && sumCBA === 0 ? 'N/A' : '0.0000')

      return {
        fields: {
          ClaimCode: c.claim_code || applicationId,
          Form2ReportNo: `FORM-II/${c.claim_code || applicationId}/${new Date().getFullYear()}`,

          // Statutory Question 1 & Question 2 Auto-Resolved Data
          NameOfUnit: resolvedUnitName,
          UnitName: resolvedUnitName,
          AreaName: resolvedAreaName,

          NameOfColliery: resolvedMineName,
          CollieryName: resolvedMineName,
          MineName: resolvedMineName,

          // Land Owner & Demographics
          LandOwnerName: ownerName,
          LandLoserName: ownerName,
          ClaimantName: ownerName,
          FatherOrHusbandName: fatherName,
          PresentAddress: presentAddr,
          PermanentAddress: permAddr,
          FullAddress: fullAddr,
          EpicNumber: epicNo,
          AadhaarNumber: aadhaarNo,

          // Bank Account Info
          BankName: bankName,
          BranchName: bankBranch,
          BankAccountNumber: bankAcc,
          IFSCCode: ifsc,

          // Aggregated Multi-Plot & Single Parcel Tags for Form-II Template
          Mouza: allMouzas,
          MouzaName: allMouzas,
          PlotNo: allPlotNos,
          TotalArea: combinedTotalArea,
          ApprovedArea: combinedApprovedArea,
          AreaOffered: combinedApprovedArea,
          KhatianNo: allKhatians,
          OwnershipDate: primaryParcel.OwnershipDate,
          DirectPurchaseArea: combinedDirectPurchaseArea,
          CBAArea: combinedCBAArea,
          TotalPossessionArea: combinedApprovedArea,
          DateOfUse: primaryParcel.DateOfUse,
          OwnShareArea: combinedApprovedArea,

          // Questions 3 to 13 Exact DOCX Template Placeholders
          PurposeOfPossession: purposeOfPossession,
          OwnershipBeforeUse: ownershipBeforeUse,
          WithinApprovedWorkingArea: withinApprovedWorkingArea,
          CompetentApprovalStatus: competentApprovalStatus,
          PreviouslyAcquiredStatus: previouslyAcquiredStatus,
          ErstwhileManagementStatus: erstwhileManagementStatus,
          PreNationalizationDamageStatus: preNationalizationDamageStatus,
          GovernmentLandStatus: governmentLandStatus,
          PreviousCompensationStatus: previousCompensationStatus,
          MasterPlanStatus: masterPlanStatus,
          RevenuePlanAttachment: revenuePlanAttachment,

          // Legacy / Alias Keys
          Q3_PurposeOfPossession: purposeOfPossession,
          Q4_OwnershipPriorToCompanyUse: ownershipBeforeUse,
          Q5_LiesInApprovedProjectArea: withinApprovedWorkingArea,
          Q6_IncludedInApprovedSchedule: competentApprovalStatus,
          Q7_NeverAcquiredOrBelongsToECL: previouslyAcquiredStatus,
          Q8_AcquiredBeforeNationalization: erstwhileManagementStatus,
          Q9_AffectedDamagedBeforeNationalization: preNationalizationDamageStatus,
          Q10_VestedInStateOrForestDept: governmentLandStatus,
          Q11_PriorCompensationOrBenefitProvided: previousCompensationStatus,
          Q12_IncludedInRaniganjMasterPlan: masterPlanStatus,
          Q13_RevenuePlanAttached: revenuePlanAttachment,

          ReportDate: new Date().toLocaleDateString('en-IN'),
          VerificationOfficerSignature: 'Revenue Inspector / Verification Officer',

          LandClerkSignature: ctx.LandClerkSignature || '[ Land Clerk / Amin / Rev.Inspector ]',
          LandClerkSig: ctx.LandClerkSig || '[ Land Clerk / Amin / Rev.Inspector ]',
          SurveyOfficerSignature: ctx.SurveyOfficerSignature || '[ Surveyor / Survey Officer ]',
          SurveyOfficerSig: ctx.SurveyOfficerSig || '[ Surveyor / Survey Officer ]',
          ManagerSignature: ctx.ManagerSignature || '[ Colliery / Project Manager ]',
          ManagerSig: ctx.ManagerSig || '[ Colliery / Project Manager ]',
          ProjectOfficerSignature: ctx.ProjectOfficerSignature || '[ Project Officer / Agent ]',
          ProjectOfficerSig: ctx.ProjectOfficerSig || '[ Project Officer / Agent ]',
        },
        tables: {
          LandParcels: tableData,
          ClaimPlots: tableData,
          PlotsTable: tableData,
          PlotSchedule: tableData,
          LandSchedule: tableData,
          Plots: tableData,
        },
      }
    } catch (err) {
      console.error('Error resolving FormIIResolver:', err)
      return {
        fields: {
          ClaimCode: applicationId,
          LandOwnerName: 'N/A',
          ReportDate: new Date().toLocaleDateString('en-IN'),
        },
        tables: {
          LandParcels: [],
        },
      }
    }
  }
}