import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXXIResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        area: true,
        colliery: true,
        nominee: true,
        employment: {
          include: {
            proposal: true,
          },
        },
        landInventory: true,
        landPossession: true,
        areaLandDealingOfficer: true,
        certificate: true,
      },
    });

    return {
      fields: {
        LandInventoryUpdateDate:
          application?.landInventory?.lastUpdated,

        NomineeName:
          application?.nominee?.name,

        NomineeFatherName:
          application?.nominee?.fatherName,

        LandArea:
          application?.employment?.landArea,

        CollieryName:
          application?.colliery?.name,

        AreaName:
          application?.area?.name,

        PurposeOfAcquisition:
          application?.landPossession?.purpose,

        AreaLandDealingOfficerName:
          application?.areaLandDealingOfficer?.name,

        AreaLandDealingOfficerDesignation:
          application?.areaLandDealingOfficer?.designation,

        OfficeArea:
          application?.area?.name,

        CertificatePlace:
          application?.certificate?.place,

        CertificateDate:
          application?.certificate?.date,
      },

      tables: {},
    };
  }
}