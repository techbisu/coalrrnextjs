import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormVIResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        nominee: {
          include: {
            permanentAddress: true,
            presentAddress: true,
          },
        },
        landOwner: true,
        relationship: true,
        declaration: true,
        witnesses: {
          include: {
            employee: true,
          },
        },
      },
    });

    return {
      fields: {
        NomineeName: application?.nominee?.name,
        NomineeFatherName: application?.nominee?.fatherName,

        PermanentVillage: application?.nominee?.permanentAddress?.village,
        PermanentPostOffice: application?.nominee?.permanentAddress?.postOffice,
        PermanentPoliceStation: application?.nominee?.permanentAddress?.policeStation,
        PermanentDistrict: application?.nominee?.permanentAddress?.district,
        PermanentState: application?.nominee?.permanentAddress?.state,

        PresentVillage: application?.nominee?.presentAddress?.village,
        PresentPostOffice: application?.nominee?.presentAddress?.postOffice,
        PresentPoliceStation: application?.nominee?.presentAddress?.policeStation,
        PresentDistrict: application?.nominee?.presentAddress?.district,
        PresentState: application?.nominee?.presentAddress?.state,

        LandOwnerName: application?.landOwner?.name,
        Relationship: application?.relationship?.relationship,

        DeclarationDate: application?.declaration?.date,
        DeclarationPlace: application?.declaration?.place,
      },

      tables: {
        Witnesses:
          application?.witnesses.map((witness, index) => ({
            SerialNo: index + 1,
            WitnessName: witness.employee?.name,
            WitnessDesignation: witness.employee?.designation,
            WitnessUMNo: witness.employee?.umNo,
            WitnessPlaceOfPosting: witness.employee?.placeOfPosting,
            WitnessSignature: witness.employee?.signature,
          })) ?? [],
      },
    };
  }
}