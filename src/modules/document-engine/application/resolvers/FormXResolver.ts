import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXResolver implements IDocumentResolver {
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
            approvals: true,
          },
        },
      },
    });

    return {
      fields: {
        AreaName: application?.area?.name,
        ProjectName: application?.project?.name,
        EmploymentProposalRefNo:
          application?.employment?.proposal?.referenceNo,
        EmploymentProposalDate:
          application?.employment?.proposal?.referenceDate,
        NomineeName: application?.nominee?.name,
      },

      tables: {
        EmploymentApprovals:
          application?.employment?.approvals.map((item) => ({
            ApprovedLandArea: item.approvedLandArea,
            ApprovedEmploymentCount: item.approvedEmploymentCount,
            ApprovalReference: item.referenceNo,
            ApprovalDate: item.approvalDate,
            EmploymentsAlreadyOffered: item.employmentsAlreadyOffered,
            CurrentEmploymentSerialNo:
              item.currentEmploymentSerialNo,
            RemainingEmploymentCount:
              item.remainingEmploymentCount,
            Remarks: item.remarks,
          })) ?? [],
      },
    };
  }
}