import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXXIVResolver implements IDocumentResolver {
  async resolve(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        agreement: true,
        area: true,
        project: true,
        landOwner: {
          include: {
            address: true,
          },
        },
        nominee: true,
        landAcquisition: true,
        landParcels: true,
        compensation: true,
        collectorNotification: true,
        ministryReference: true,
        affidavit: true,
        witnesses: true,
      },
    });

    return {
      fields: {
        AgreementDate: application?.agreement?.executionDate,
        AreaName: application?.area?.name,
        LandOwnerName: application?.landOwner?.name,
        GuardianName: application?.landOwner?.guardianName,
        LandOwnerAge: application?.landOwner?.age,
        Occupation: application?.landOwner?.occupation,
        ResidentialAddress:
          application?.landOwner?.address?.fullAddress,

        Section4NotificationNo:
          application?.landAcquisition?.section4NotificationNo,
        Section4NotificationDate:
          application?.landAcquisition?.section4NotificationDate,

        Section7NotificationNo:
          application?.landAcquisition?.section7NotificationNo,
        Section7NotificationDate:
          application?.landAcquisition?.section7NotificationDate,

        Section9NotificationNo:
          application?.landAcquisition?.section9NotificationNo,
        Section9NotificationDate:
          application?.landAcquisition?.section9NotificationDate,

        Section11NotificationNo:
          application?.landAcquisition?.section11NotificationNo,
        Section11NotificationDate:
          application?.landAcquisition?.section11NotificationDate,

        GazetteNumber:
          application?.landAcquisition?.gazetteNumber,

        GazetteDate:
          application?.landAcquisition?.gazetteDate,

        ProjectName:
          application?.project?.name,

        CompensationAmount:
          application?.compensation?.totalAmount,

        CompensationAmountInWords:
          application?.compensation?.amountInWords,

        NomineeName:
          application?.nominee?.name,
      },

      tables: {
        LandCompensationDetails:
          application?.landParcels.map((parcel, index) => ({
            SerialNo: index + 1,
            PlotNo: parcel.plotNo,
            SurveyNo: parcel.surveyNo,
            TotalAreaHectare: parcel.totalAreaHectare,
            AcquiredAreaHectare: parcel.acquiredAreaHectare,
            LandClass: parcel.landClass,
            AreaInAcres: parcel.areaAcres,
            GovernmentRatePerAcre:
              parcel.ratePerAcre,
            CompensationAmount:
              parcel.compensationAmount,
          })) ?? [],

        Witnesses:
          application?.witnesses.map((witness, index) => ({
            SerialNo: index + 1,
            WitnessName: witness.name,
            WitnessAddress: witness.address,
            WitnessSignature: witness.signature,
          })) ?? [],
      },
    };
  }
}