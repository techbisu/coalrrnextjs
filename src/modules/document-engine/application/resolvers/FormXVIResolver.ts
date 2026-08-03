import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXVIResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        area: true,
        mine: true,
        project: true,
        landAcquisition: true,
        landApproval: true,
        landParcels: {
          include: {
            landOwner: true,
          },
        },
      },
    });

    return {
      fields: {
        AreaName: application?.area?.name,
        MineName: application?.mine?.name,
        ProjectWorkingPanel: application?.project?.workingPanel,
        ProposalNo: application?.landAcquisition?.proposalNo,
        QuantumOfLand: application?.landAcquisition?.totalArea,
        ApprovalNo: application?.landApproval?.referenceNo,
        TenancyLandArea: application?.landAcquisition?.tenancyLandArea,
        GovernmentLandArea: application?.landAcquisition?.governmentLandArea,
        PattaLandArea: application?.landAcquisition?.pattaLandArea,
        CompetentApprovalReference:
          application?.landApproval?.specialReference,
      },

      tables: {
        LandSchedule:
          application?.landParcels.map((parcel, index) => ({
            SerialNo: index + 1,
            LandOwnerName: parcel.landOwner?.name,
            Mouza: parcel.mouza,
            PlotNo: parcel.plotNo,
            KhatianNo: parcel.khatianNo,
            LandType: parcel.landType,
            Area: parcel.area,
            Remarks: parcel.remarks,
          })) ?? [],
      },
    };
  }
}