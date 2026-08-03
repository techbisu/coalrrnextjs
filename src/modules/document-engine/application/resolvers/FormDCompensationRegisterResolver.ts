import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormDCompensationRegisterResolver implements IDocumentResolver {
  constructor(private readonly prisma: PrismaClient) {}
  async resolve() {
    const applications = await this.prisma.application.findMany({
      include: {
        compensation: true,
        acquisitions: {
          include: { owner: true, plot: { include: { village: true } } },
        },
      },
    });
    return {
      fields: {},
      tables: {
        CompensationRegister: applications.flatMap((application) =>
          application.acquisitions.map((item) => ({
            AwardNoAndDate: application.compensation?.award_no_date ?? "",
            AwardeeName: application.compensation?.awardee_name ?? "",
            MouzaName: item.plot?.village?.name ?? "",
            PlotNo: item.plot?.plot_no ?? "",
            ApprovedArea: item.approved_area ?? "",
            PurchasedArea: item.purchased_area ?? "",
            RecordedLandOwner: item.owner?.name ?? "",
            LandCompensationAmount: application.compensation?.land_amount ?? "",
            LandCompensationPaymentDate:
              application.compensation?.land_payment_date ?? "",
            AssetCompensationAmount:
              application.compensation?.asset_amount ?? "",
            AssetCompensationPaymentDate:
              application.compensation?.asset_payment_date ?? "",
            EmploymentCompensationAmount:
              application.compensation?.employment_amount ?? "",
            EmploymentCompensationPaymentDate:
              application.compensation?.employment_payment_date ?? "",
            SubsistenceGrantAmount:
              application.compensation?.subsistence_grant ?? "",
            SubsistenceGrantPaymentDate:
              application.compensation?.subsistence_payment_date ?? "",
            TransportationCostAmount:
              application.compensation?.transportation_amount ?? "",
            TransportationCostPaymentDate:
              application.compensation?.transportation_payment_date ?? "",
            CattleShedGrantAmount:
              application.compensation?.cattle_shed_amount ?? "",
            CattleShedGrantPaymentDate:
              application.compensation?.cattle_shed_payment_date ?? "",
            ArtisanGrantAmount: application.compensation?.artisan_grant ?? "",
            ArtisanGrantPaymentDate:
              application.compensation?.artisan_payment_date ?? "",
            OtherPaymentDetails:
              application.compensation?.other_payment_details ?? "",
            OtherPaymentAmount:
              application.compensation?.other_payment_amount ?? "",
            OtherPaymentDate:
              application.compensation?.other_payment_date ?? "",
            TotalCompensationPaid: application.compensation?.total_amount ?? "",
          })),
        ),
      },
    };
  }
}
