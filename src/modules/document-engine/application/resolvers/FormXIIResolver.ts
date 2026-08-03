import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXIIResolver implements IDocumentResolver {
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
            offeredLand: {
              include: {
                landOwner: true,
                mutation: true,
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
          application?.employment?.proposal?.serialNo,
        TotalLandOffered:
          application?.employment?.totalLandOffered,
      },

      tables: {
        LandOwnerRelationships:
          application?.employment?.offeredLand.map((item, index) => ({
            SerialNo: index + 1,
            LandOwnerName: item.landOwner.name,
            RelationshipWithNominee:
              item.landOwner.relationshipWithNominee,
            CBAArea: item.cbaArea,
            LARFCTLARRArea: item.laRfctlarrArea,
            DirectPurchaseArea: item.directPurchaseArea,
            GrandTotalArea: item.totalArea,
            MutationMouza: item.mutation?.mouza,
            MutationKhatianNo: item.mutation?.khatianNo,
            Remarks: item.remarks,
          })) ?? [],
      },
    };
  }
}