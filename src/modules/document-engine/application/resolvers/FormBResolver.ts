import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormBResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        unit: true,
        project: true,
        area: true,
        nominee: true,
        acquisition: true,
        possessionCertificate: true,
        landParcels: true,
      },
    });

    return {
      fields: {
        UnitName: application?.unit?.name,
        ProjectName: application?.project?.name,
        AreaName: application?.area?.name,
        NomineeName: application?.nominee?.name,
        AcquisitionApprovalRef: application?.acquisition?.approvalRef,
        TotalLandOffered:
          application?.possessionCertificate?.totalLandOffered,
      },
      tables: {
        LandParcels:
          application?.landParcels.map((parcel, index) => ({
            SerialNo: index + 1,
            LandLoserName: parcel.landLoserName,
            Mouza: parcel.mouza,
            PlotNo: parcel.plotNo,
            TotalArea: parcel.totalArea,
            ApprovedArea: parcel.approvedArea,
            KhatianNo: parcel.khatianNo,
            DirectPurchaseArea: parcel.directPurchaseArea,
            CBAArea: parcel.cbaArea,
            LAArea: parcel.laArea,
            PossessedArea: parcel.possessedArea,
            MutationStatus: parcel.mutationStatus,
          })) ?? [],
      },
    };
  }
}