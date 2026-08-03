import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormIIIResolver implements IDocumentResolver {

    constructor(
        private readonly prisma: PrismaClient
    ) {}

    async resolve(reportId: string) {

        const report = await this.prisma.report.findUnique({
            where: {
                id: reportId
            },
            include: {
                application: {
                    include: {
                        project: {
                            include: {
                                area: true
                            }
                        },
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
                        }
                    }
                }
            }
        });

        return {

            fields: {

                ReportDate: report?.report_date ?? "",

                CollieryName:
                    report?.application?.project?.colliery_name ?? "",

                AreaName:
                    report?.application?.project?.area?.name ?? "",

                Purpose:
                    report?.application?.purpose ?? "",

                LandUse:
                    report?.application?.land_use ?? "",

                GrandTotalLand:
                    report?.total_land ?? ""

            },

            tables: {

                LandPlots:

                    report?.application?.ownership?.map((item, index) => ({

                        SlNo: index + 1,

                        LandLoserName:
                            item.owner?.name ?? "",

                        MouzaName:
                            item.plot?.village?.name ?? "",

                        PlotNo:
                            item.plot?.plot_no ?? "",

                        TotalArea:
                            item.plot?.total_area ?? "",

                        ApprovedArea:
                            item.plot?.approved_area ?? "",

                        KhatianNo:
                            item.plot?.khatian_no ?? "",

                        OfferedArea:
                            item.offered_area ?? "",

                        OwnershipDate:
                            item.ownership_date ?? "",

                        DirectPurchaseArea:
                            item.possession?.direct_purchase_area ?? "",

                        CBAArea:
                            item.possession?.cba_area ?? "",

                        PossessionTotalArea:
                            item.possession?.total_area ?? ""

                    })) ?? []

            }

        };

    }

}