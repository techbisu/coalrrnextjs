import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXXIIIResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: {
        id: applicationId,
      },
      include: {
        landOwner: {
          include: {
            address: true,
          },
        },
        nominee: true,
        relationship: true,
        landAcquisition: true,
        femaleNomineeCounselling: true,
        area: true,
      },
    });

    return {
      fields: {
        LandOwnerName: application?.landOwner?.name,
        LandOwnerFatherName: application?.landOwner?.fatherName,
        IdentityNumber: application?.landOwner?.identityNumber,
        ResidentialAddress:
          application?.landOwner?.address?.fullAddress,

        FemaleNomineeRelationship:
          application?.relationship?.relationship,

        FemaleNomineeName:
          application?.nominee?.name,

        FemaleNomineeFatherName:
          application?.nominee?.fatherName,

        GeneralManagerArea:
          application?.area?.name,

        CounsellingDate:
          application?.femaleNomineeCounselling?.counsellingDate,

        AcquisitionMode:
          application?.landAcquisition?.mode,

        RegisteredDeedNumber:
          application?.landAcquisition?.registeredDeedNo,

        RegisteredDeedDate:
          application?.landAcquisition?.registeredDeedDate,

        FemaleNominationReason:
          application?.femaleNomineeCounselling?.reason,

        DeclarationDate:
          application?.femaleNomineeCounselling?.declarationDate,
      },

      tables: {},
    };
  }
}