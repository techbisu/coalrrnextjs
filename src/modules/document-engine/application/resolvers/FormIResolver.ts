import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'

/**
 * FormIResolver — Citizen Land/Employment Intake (Form-I)
 *
 * Form-I captures the landowner's personal declaration, bank details,
 * land parcel ownerships, and consent for compensation.
 *
 * NOTE: The Form-I citizen intake data model (PAF application) is under
 * construction. This resolver returns a safe stub so the ResolverRegistry
 * entry is valid and the workspace endpoint does not crash. Replace the
 * stub body with real db queries once the PAF module is complete.
 *
 * Real data sources (to implement):
 *  - paf_application  → applicant personal details, consent flags
 *  - paf_bank_account → bank details
 *  - paf_land_parcel  → land ownership rows
 */
export class FormIResolver implements IDocumentResolver {
  async resolve(
    applicationId: string,
    context?: Record<string, any>
  ): Promise<DocumentResolverResult> {
    // TODO: replace with real PAF DB queries once paf_application model is available
    return {
      fields: {
        LandOwnerName: '',
        FatherOrHusbandName: '',
        PermanentAddress: '',
        EpicNumber: '',
        AadhaarNumber: '',
        Occupation: '',
        Gender: '',
        Nationality: '',
        Religion: '',
        CommunityCategory: '',
        CompensationReceived: '',
        CompensationDetails: '',
        BankName: '',
        BranchName: '',
        BankAccountNumber: '',
        IFSCCode: '',
        PreviousEmploymentClaim: '',
        EmploymentClaimDetails: '',
        LandDisputeStatus: '',
        DisputeDetails: '',
        EncumbranceFree: '',
        EncumbranceDetails: '',
        PeacefulPossession: '',
        PossessionRemarks: '',
        OneTimeCompensationAccepted: '',
        CompensationRemarks: '',
        ApplicationDate: new Date().toLocaleDateString('en-IN'),
        ApplicantPhoto: '',
        ApplicantSignature: '',
      },
      tables: {
        LandParcels: [],
      },
    }
  }
}
