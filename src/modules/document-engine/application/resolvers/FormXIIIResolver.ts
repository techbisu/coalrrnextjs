import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXIIIResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        unit: true,
        area: true,
        nominee: true,
        employment: {
          include: {
            proposal: true,
            landDetails: true,
          },
        },
        committeeRecommendation: true,
      },
    });

    return {
      fields: {
        UnitName: application?.unit?.name,
        AreaName: application?.area?.name,
        EmploymentProposalRefNo:
          application?.employment?.proposal?.referenceNo,
        EmploymentProposalDate:
          application?.employment?.proposal?.referenceDate,
        EmploymentSerialNo:
          application?.employment?.proposal?.serialNo,
        NomineeName: application?.nominee?.name,
        CommitteeRecommendation:
          application?.committeeRecommendation?.recommendation,
      },

      tables: {
        CommitteeLandDetails:
          application?.employment?.landDetails ?? [],
      },
    };
  }
}