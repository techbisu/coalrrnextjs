import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXVIIIResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        area: true,
        project: true,
        nominee: true,
        employment: {
          include: {
            approval: true,
          },
        },
        pattaLands: {
          include: {
            cancellation: true,
          },
        },
        governmentLandTransfer: true,
      },
    });

    return {
      fields: {
        AreaName: application?.area?.name,
        ProjectName: application?.project?.name,
        EmploymentProposalRefNo:
          application?.employment?.referenceNo,
        EmploymentProposalDate:
          application?.employment?.referenceDate,
        NomineeName: application?.nominee?.name,
        EmploymentApprovalRefNo:
          application?.employment?.approval?.referenceNo,
        EmploymentApprovalDate:
          application?.employment?.approval?.approvalDate,
        TotalLandOffered:
          application?.employment?.totalLandOffered,
        TotalPattaLand:
          application?.employment?.totalPattaLand,
        TransferApplicationPageNo:
          application?.governmentLandTransfer?.pageNo,
        RecommendationRemarks:
          application?.employment?.approval?.recommendation,
      },

      tables: {
        PattaLandDetails:
          application?.pattaLands.map((land, index) => ({
            SerialNo: index + 1,
            Mouza: land.mouza,
            PlotNo: land.plotNo,
            LandArea: land.area,
            RecordedPattaHolder: land.recordedHolder,
            PattaSurrenderPerson: land.surrenderPerson,
            RelationshipWithPattaHolder: land.relationship,
            PattaCancelled: land.cancellation?.isCancelled,
            PattaCancellationPageNo:
              land.cancellation?.pageNo,
          })) ?? [],
      },
    };
  }
}