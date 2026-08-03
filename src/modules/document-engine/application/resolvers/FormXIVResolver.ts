import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXIVResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
        area: true,
        nominee: true,
        employment: true,
        landOwner: true,
        relationship: true,
        landAcquisition: true,
        landPossession: true,
      },
    });

    return {
      fields: {
        ProjectName: application?.project?.name,
        AreaName: application?.area?.name,
        NomineeName: application?.nominee?.name,
        NomineeFatherName: application?.nominee?.fatherName,
        PresentAddress: application?.nominee?.presentAddress,
        PermanentAddress: application?.nominee?.permanentAddress,
        DateOfBirth: application?.nominee?.dateOfBirth,
        EducationalQualification:
          application?.nominee?.educationalQualification,
        EducationalPassingYear:
          application?.nominee?.educationalPassingYear,
        EducationalInstitute:
          application?.nominee?.educationalInstitute,
        TechnicalQualification:
          application?.nominee?.technicalQualification,
        TechnicalPassingYear:
          application?.nominee?.technicalPassingYear,
        TechnicalInstitute:
          application?.nominee?.technicalInstitute,
        VoterCardNo: application?.nominee?.voterCardNo,
        AadhaarNo: application?.nominee?.aadhaarNo,
        Community: application?.nominee?.community,
        TotalLandOffered:
          application?.employment?.totalLandOffered,
        AcquisitionMode:
          application?.landAcquisition?.mode,
        PurposeOfAcquisition:
          application?.landPossession?.purpose,
        LandOwnerName:
          application?.landOwner?.name,
        RelationshipWithNominee:
          application?.relationship?.relationship,
        WebsitePublicationDate:
          application?.landPossession?.websitePublicationDate,
        IsUnderPhysicalPossession:
          application?.landPossession?.isUnderPhysicalPossession,
      },

      tables: {},
    };
  }
}