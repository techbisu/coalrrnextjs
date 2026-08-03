import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormIXResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        area: true,
        project: true,
        nominee: true,
        employment: {
          include: {
            proposal: true,
            landDetails: {
              include: {
                approval: true,
                history: true,
              },
            },
          },
        },
      },
    });

    return {
      fields: {
        AreaName: application?.area?.name,
        ProjectName: application?.project?.name,
        NomineeName: application?.nominee?.name,
        EmploymentProposalRefNo:
          application?.employment?.proposal?.referenceNo,
        EmploymentProposalDate:
          application?.employment?.proposal?.referenceDate,
        EmploymentSerialNo:
          application?.employment?.proposal?.formXSerialNo,
        TotalOfferedArea:
          application?.employment?.totalOfferedArea,
      },

      tables: {
        EmploymentLandDetails:
          application?.employment?.landDetails.map((item, index) => ({
            SerialNo: index + 1,
            Mouza: item.mouza,
            PlotNo: item.plotNo,
            TotalPlotArea: item.totalArea,
            ApprovedEmploymentArea: item.approvedArea,
            ApprovalReference: item.approval.referenceNo,
            ApprovalDate: item.approval.approvalDate,
            CurrentEmploymentArea: item.currentEmploymentArea,
            PreviousEmploymentArea: item.previousEmploymentArea,
            RemainingApprovedArea: item.remainingApprovedArea,
          })) ?? [],
      },
    };
  }
}