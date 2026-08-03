import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormIIResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        unit: true,
        project: true,
        area: true,
        ownershipVerification: true,
        landParcels: {
          include: {
            landOwner: true,
          },
        },
        attachments: true,
      },
    });

    return {
      fields: {
        UnitName: application?.unit?.name,
        ProjectName: application?.project?.name,
        AreaName: application?.area?.name,
        AcquisitionPolicy: application?.policy,
        LandUsePurpose: application?.landUsePurpose,
        OwnershipBeforeUse:
          application?.ownershipVerification?.ownershipBeforeUse,
        WithinApprovedWorkingArea:
          application?.ownershipVerification?.workingAreaStatus,
        CompetentApprovalStatus:
          application?.ownershipVerification?.competentApproval,
        CompetentApprovalReference:
          application?.ownershipVerification?.approvalReference,
      },
      tables: {
        LandParcels:
          application?.landParcels.map((parcel, index) => ({
            SerialNo: index + 1,
            LandLoserName: parcel.landOwner?.name,
            Mouza: parcel.mouza,
            PlotNo: parcel.plotNo,
            TotalArea: parcel.totalArea,
            ApprovedArea: parcel.approvedArea,
            AreaOffered: parcel.areaOffered,
            KhatianNo: parcel.khatianNo,
            OwnershipDate: parcel.ownershipDate,
            DirectPurchaseArea: parcel.directPurchaseArea,
            CBAArea: parcel.cbaArea,
            TotalPossessionArea: parcel.totalPossessionArea,
            PurposeOfPossession: parcel.purposeOfPossession,
            DateOfUse: parcel.dateOfUse,
          })) ?? [],
      },
    };
  }
}