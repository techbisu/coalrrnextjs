import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXVResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        area: true,
        landOwner: { include: { address: true } },
        nominee: true,
        relationship: true,
        landParcels: true,
        fieldVerification: true,
        policeVerification: true,
        verificationOfficers: true,
        neighbourWitnesses: true,
      },
    });

    return {
      fields: {
        AreaName: application?.area?.name,
        HouseNo: application?.landOwner?.address?.houseNo,
        RoadLocality: application?.landOwner?.address?.locality,
        VillageTown: application?.landOwner?.address?.village,
        PostOffice: application?.landOwner?.address?.postOffice,
        PoliceStation: application?.landOwner?.address?.policeStation,
        District: application?.landOwner?.address?.district,
        State: application?.landOwner?.address?.state,
        PinCode: application?.landOwner?.address?.pinCode,
        LandOwnerName: application?.landOwner?.name,
        LandOwnerFatherName: application?.landOwner?.fatherName,
        NomineeName: application?.nominee?.name,
        NomineeFatherName: application?.nominee?.fatherName,
        VisitDate: application?.fieldVerification?.visitDate,
        Relationship: application?.relationship?.relationship,
        PoliceVerificationReferenceNo:
          application?.policeVerification?.referenceNo,
        PoliceVerificationRequestDate:
          application?.policeVerification?.requestDate,
        PoliceVerificationPoliceStation:
          application?.policeVerification?.policeStation,
        PoliceReportReceived:
          application?.policeVerification?.reportReceived,
      },
      tables: {
        LandParcels:
          application?.landParcels.map((plot, index) => ({
            SerialNo: index + 1,
            PlotNo: plot.plotNo,
            Mouza: plot.mouza,
            KhatianNo: plot.khatianNo,
            LandArea: plot.area,
          })) ?? [],

        VerificationTeam:
          application?.verificationOfficers.map((officer, index) => ({
            SerialNo: index + 1,
            OfficerName: officer.name,
            Designation: officer.designation,
            OfficerSignature: officer.signature,
          })) ?? [],

        NeighbourWitnesses:
          application?.neighbourWitnesses.map((witness, index) => ({
            SerialNo: index + 1,
            WitnessName: witness.name,
            WitnessSignature: witness.signature,
          })) ?? [],
      },
    };
  }
}