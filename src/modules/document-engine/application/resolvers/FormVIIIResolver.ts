import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormVIIIResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        unit: true,
        project: true,
        area: true,
        nominee: true,
        employment: true,
        landPossession: true,
        landUtilisations: {
          include: {
            landParcel: true,
            landOwner: true,
          },
        },
      },
    });

    return {
      fields: {
        UnitName: application?.unit?.name,
        ProjectName: application?.project?.name,
        AreaName: application?.area?.name,
        NomineeName: application?.nominee?.name,
        NomineeGuardianName: application?.nominee?.guardianName,
        EmploymentProposalRefNo: application?.employment?.referenceNo,
        EmploymentProposalDate: application?.employment?.referenceDate,
        PossessionReferenceNo: application?.landPossession?.referenceNo,
        NoticeReferenceNo: application?.landPossession?.noticeReference,
        NoticeDate: application?.landPossession?.noticeDate,
        WebsitePublicationDate:
          application?.landPossession?.websitePublicationDate,
        PhysicalPossessionDate:
          application?.landPossession?.physicalPossessionDate,
      },

      tables: {
        LandUtilisations:
          application?.landUtilisations.map((item, index) => ({
            SerialNo: index + 1,
            LandLoserName: item.landOwner.name,
            Mouza: item.landParcel.mouza,
            PlotNo: item.landParcel.plotNo,
            TotalArea: item.landParcel.totalArea,
            ApprovedArea: item.landParcel.approvedArea,
            PhysicalPossessionArea: item.physicalPossessionArea,
            DirectPurchaseArea: item.directPurchaseArea,
            CBAArea: item.cbaArea,
            LARFCTLARRArea: item.laRfctlarrArea,
            TotalPossessedArea: item.totalPossessedArea,
            PurposeOfPossession: item.purpose,
            PossessionDate: item.possessionDate,
            UtilizationDate: item.utilizationDate,
            Remarks: item.remarks,
          })) ?? [],
      },
    };
  }
}