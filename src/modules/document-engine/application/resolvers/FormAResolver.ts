import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormAResolver implements IDocumentResolver {

    constructor(
        private readonly prisma: PrismaClient
    ) {}

    async resolve(applicationId: string) {

        const application = await this.prisma.application.findUnique({
            where: {
                id: applicationId
            },
            include: {
                nominee: true,
                ownership: {
                    include: {
                        plot: {
                            include: {
                                village: true
                            }
                        }
                    }
                },
                attestation: true
            }
        });

        return {

            fields: {

                ApplicantPhoto:
                    application?.photo ?? "",

                LandLoserName:
                    application?.land_loser_name ?? "",

                FatherName:
                    application?.father_name ?? "",

                PresentAddress:
                    application?.present_address ?? "",

                PermanentAddress:
                    application?.permanent_address ?? "",

                AadhaarNo:
                    application?.aadhaar_no ?? "",

                Occupation:
                    application?.occupation ?? "",

                NomineeName:
                    application?.nominee?.name ?? "",

                NomineeFatherName:
                    application?.nominee?.father_name ?? "",

                NomineeDOB:
                    application?.nominee?.date_of_birth ?? "",

                NomineeGender:
                    application?.nominee?.gender ?? "",

                CommunityCategory:
                    application?.nominee?.community ?? "",

                NominationReason:
                    application?.nomination_reason ?? "",

                TotalOfferedArea:
                    application?.total_offered_area ?? ""
            },

            tables: {

                Plots:
                    application?.ownership?.map(o => ({

                        SlNo: o.serial_no,

                        NameOfNominee:
                            application.nominee?.name,

                        LandOwnerName:
                            application.land_loser_name,

                        RelationWithNominee:
                            o.relation,

                        MouzaName:
                            o.plot.village.name,

                        PlotNo:
                            o.plot.plot_no,

                        TotalPlotArea:
                            o.plot.total_area,

                        KhatianNo:
                            o.plot.khatian_no,

                        OwnShareArea:
                            o.share_area,

                        OwnershipSource:
                            o.source,

                        OwnershipReference:
                            o.reference,

                        DirectPurchaseArea:
                            o.direct_purchase_area,

                        CBAArea:
                            o.cba_area,

                        LAArea:
                            o.la_area,

                        TotalArea:
                            o.total_area,

                        DirectPurchaseReference:
                            o.direct_purchase_reference,

                        CBALAReference:
                            o.cbala_reference,

                        Remarks:
                            o.remarks

                    })) ?? []

            }

        };

    }

}