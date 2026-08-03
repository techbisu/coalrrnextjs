import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXXVIResolver implements IDocumentResolver {
  constructor(private readonly prisma: PrismaClient) {}
  async resolve(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        owner: {
          include: {
            address: {
              include: {
                village: {
                  include: { district: { include: { state: true } } },
                },
                policeStation: true,
              },
            },
          },
        },
        nominee: true,
        relationship: true,
        acquisitions: { include: { plot: { include: { village: true } } } },
        declaration: true,
      },
    });
    return {
      fields: {
        LandOwnerName: application?.owner?.name ?? "",
        LandOwnerFatherName: application?.owner?.father_name ?? "",
        LandOwnerAge: application?.owner?.age ?? "",
        LandOwnerAddress: application?.owner?.address?.full_address ?? "",
        VillageName: application?.owner?.address?.village?.name ?? "",
        PostOffice: application?.owner?.address?.post_office ?? "",
        PoliceStation: application?.owner?.address?.policeStation?.name ?? "",
        DistrictName:
          application?.owner?.address?.village?.district?.name ?? "",
        StateName:
          application?.owner?.address?.village?.district?.state?.name ?? "",
        NomineeName: application?.nominee?.name ?? "",
        NomineeFatherName: application?.nominee?.father_name ?? "",
        Relationship: application?.relationship?.relationship_name ?? "",
        NomineeDateOfBirth: application?.nominee?.date_of_birth ?? "",
        NomineeAadhaarNo: application?.nominee?.aadhaar_no ?? "",
        EducationalQualification:
          application?.nominee?.educational_qualification ?? "",
        DeclarationDate: application?.declaration?.declaration_date ?? "",
        DeclarationPlace: application?.declaration?.place ?? "",
        LandOwnerSignature: application?.owner?.signature ?? "",
        NomineeSignature: application?.nominee?.signature ?? "",
      },
      tables: {
        LandPlots:
          application?.acquisitions?.map((item, index) => ({
            SlNo: index + 1,
            MouzaName: item.plot?.village?.name ?? "",
            KhatianNo: item.plot?.khatian_no ?? "",
            PlotNo: item.plot?.plot_no ?? "",
            AcquiredArea: item.acquired_area ?? "",
            AreaUnit: item.area_unit ?? "",
            AwardNumber: item.award_no ?? "",
            AwardDate: item.award_date ?? "",
          })) ?? [],
      },
    };
  }
}
