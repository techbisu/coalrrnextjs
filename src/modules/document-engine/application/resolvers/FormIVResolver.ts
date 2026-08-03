import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormIVResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        unit: true,
        project: true,
        area: true,
        possessionCertificate: true,
        landPossessions: {
          include: {
            landOwner: true,
            landParcel: true,
          },
        },
      },
    });

    return {
      fields: {
        PossessionDate:
          application?.possessionCertificate?.possessionDate,
        PossessionPurpose:
          application?.possessionCertificate?.purpose,
        ProjectName: application?.project?.name,
        AreaName: application?.area?.name,
        TotalPossessedArea:
          application?.possessionCertificate?.totalArea,
      },
      tables: {
        LandPossessions:
          application?.landPossessions.map((item, index) => ({
            SerialNo: index + 1,
            LandOwnerName: item.landOwner.name,
            Mouza: item.landParcel.mouza,
            PlotNo: item.landParcel.plotNo,
            TotalArea: item.landParcel.totalArea,
            KhatianNo: item.landParcel.khatianNo,
            OwnerShareArea: item.landParcel.ownerShareArea,
            DirectPurchaseArea: item.directPurchaseArea,
            CBAArea: item.cbaArea,
            PossessionArea: item.totalPossessionArea,
            DirectPurchaseReference:
              item.directPurchaseReference,
            CBAReference: item.cbaReference,
            Remarks: item.remarks,
          })) ?? [],
      },
    };
  }
}