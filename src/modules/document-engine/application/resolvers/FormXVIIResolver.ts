import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXVIIResolver implements IDocumentResolver {
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
          },
        },
        conditionalApproval: {
          include: {
            complianceConditions: true,
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
        ConditionalApprovalRefNo:
          application?.conditionalApproval?.referenceNo,
        ConditionalApprovalDate:
          application?.conditionalApproval?.approvalDate,
        ApprovalAttachmentPageNo:
          application?.conditionalApproval?.pageNo,
        RecommendationRemarks:
          application?.conditionalApproval?.recommendation,
      },

      tables: {
        ComplianceConditions:
          application?.conditionalApproval?.complianceConditions.map(
            (condition, index) => ({
              SerialNo: index + 1,
              ConditionDescription: condition.condition,
              ComplianceStatus: condition.status,
              ComplianceRemarks: condition.remarks,
              VerifiedBy: condition.verifiedBy,
              VerificationDate: condition.verificationDate,
            })
          ) ?? [],
      },
    };
  }
}