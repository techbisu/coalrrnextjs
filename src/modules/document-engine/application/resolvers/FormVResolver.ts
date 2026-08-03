import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormVResolver implements IDocumentResolver {

    constructor(
        private readonly prisma: PrismaClient
    ) {}

    async resolve(applicationId: string) {

        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                nominee: true,
                employment: true,
                ownership: {
                    include: {
                        owner: true,
                        plot: {
                            include: {
                                village: true
                            }
                        },
                        possession: true
                    }
                },
                compensation: true
            }
        });

        return {

            fields: {

                NomineePhoto: application?.nominee?.photo ?? "",

                NomineeName: application?.nominee?.name ?? "",

                NomineeFatherName: application?.nominee?.father_name ?? "",

                PresentAddress: application?.nominee?.present_address ?? "",

                PermanentAddress: application?.nominee?.permanent_address ?? "",

                DateOfBirth: application?.nominee?.date_of_birth ?? "",

                EducationalQualification: application?.nominee?.educational_qualification ?? "",

                TechnicalQualification: application?.nominee?.technical_qualification ?? "",

                VoterCardNo: application?.nominee?.voter_card_no ?? "",

                AadhaarNo: application?.nominee?.aadhaar_no ?? "",

                Gender: application?.nominee?.gender ?? "",

                Nationality: application?.nominee?.nationality ?? "",

                Religion: application?.nominee?.religion ?? "",

                CommunityCategory: application?.nominee?.community ?? "",

                Occupation: application?.nominee?.occupation ?? "",

                MaritalStatus: application?.nominee?.marital_status ?? "",

                ECLEmployeeName: application?.employment?.employee_name ?? "",

                EmployeeDesignation: application?.employment?.designation ?? "",

                EmployeeUMNo: application?.employment?.um_no ?? "",

                EmployeeEIN: application?.employment?.ein ?? "",

                PostingPlace: application?.employment?.posting_place ?? "",

                TotalOfferedArea: application?.total_offered_area ?? "",

                TotalAreaInvolved: application?.total_area_involved ?? "",

                PossessionArea: application?.possession_area ?? "",

                PossessionDate: application?.possession_date ?? "",

                PreviousSale: application?.previous_sale ? "Yes" : "No",

                PreviousSaleDetails: application?.previous_sale_details ?? "",

                PreviousCompensation: application?.previous_compensation ? "Yes" : "No",

                CompensationDetails: application?.compensation_details ?? "",

                PreviousEmploymentIncluded: application?.previous_employment_included ? "Yes" : "No",

                EmploymentDetails: application?.employment_details ?? "",

                LandDispute: application?.land_dispute ? "Yes" : "No",

                DisputeDetails: application?.dispute_details ?? "",

                LandEncumbrance: application?.land_encumbrance ? "Yes" : "No",

                EncumbranceDetails: application?.encumbrance_details ?? ""

            },

            tables: {

                LandPlots:

                    application?.ownership?.map((item, index) => ({

                        SlNo: index + 1,

                        NameOfNominee: application.nominee?.name ?? "",

                        LandOwnerName: item.owner?.name ?? "",

                        RelationWithNominee: item.relation ?? "",

                        MouzaName: item.plot?.village?.name ?? "",

                        PlotNo: item.plot?.plot_no ?? "",

                        TotalPlotArea: item.plot?.total_area ?? "",

                        KhatianNo: item.plot?.khatian_no ?? "",

                        OwnShareArea: item.share_area ?? "",

                        OwnershipSource: item.source ?? "",

                        DirectPurchaseArea: item.direct_purchase_area ?? "",

                        CBALAArea: item.cbala_area ?? "",

                        TotalArea: item.total_area ?? "",

                        DirectPurchaseReference: item.direct_purchase_reference ?? "",

                        CBALAReference: item.cbala_reference ?? "",

                        Remarks: item.remarks ?? ""

                    })) ?? []

            }

        };

    }

}