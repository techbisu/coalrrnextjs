import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXIResolver implements IDocumentResolver {
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
            landDetails: true,
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
          application?.employment?.proposal?.serialNo,
      },
      tables: {
        CompositeLandDetails:
          application?.employment?.landDetails ?? [],
      },
    };
  }
}