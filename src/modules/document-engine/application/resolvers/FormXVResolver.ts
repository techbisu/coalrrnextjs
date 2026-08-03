import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormXVResolver implements IDocumentResolver {

    constructor(
        private readonly prisma: PrismaClient
    ) {}

    async resolve(applicationId: string) {

        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                owner: {
                    include: {
                        address: {
                            include: {
                                policeStation: true
                            }
                        }
                    }
                },
                nominee: true,
                ownership: {
                    include: {
                        village: {
                            include: {
                                district: {
                                    include: {
                                        state: true
                                    }
                                }
                            }
                        }
                    }
                },
                relationship: true,
                verification: {
                    include: {
                        officials: true,
                        witnesses: true
                    }
                }
            }
        });

        return {

            fields: {

                AreaName: application?.area_name ?? "",

                HouseNo: application?.owner?.address?.house_no ?? "",

                RoadLocality: application?.owner?.address?.locality ?? "",

                VillageTown: application?.owner?.address?.village ?? "",

                PostOffice: application?.owner?.address?.post_office ?? "",

                PoliceStation: application?.owner?.address?.policeStation?.name ?? "",

                DistrictName: application?.ownership?.[0]?.village?.district?.name ?? "",

                StateName: application?.ownership?.[0]?.village?.district?.state?.name ?? "",

                PinCode: application?.owner?.address?.pin_code ?? "",

                LandOwnerName: application?.owner?.name ?? "",

                LandOwnerFatherName: application?.owner?.father_name ?? "",

                NomineeName: application?.nominee?.name ?? "",

                NomineeFatherName: application?.nominee?.father_name ?? "",

                PlotNumbers: application?.ownership?.map(p => p.plot_no).join(", ") ?? "",

                MouzaName: application?.ownership?.[0]?.village?.name ?? "",

                Relationship: application?.relationship?.relationship_name ?? "",

                VerificationDate: application?.verification?.verification_date ?? "",

                PoliceReferenceNo: application?.verification?.police_reference_no ?? "",

                PoliceReferenceDate: application?.verification?.police_reference_date ?? ""

            },

            tables: {

                Officials:
                    application?.verification?.officials?.map(item => ({
                        OfficialName: item.name,
                        OfficialDesignation: item.designation,
                        OfficialSignature: item.signature
                    })) ?? [],

                Witnesses:
                    application?.verification?.witnesses?.map(item => ({
                        WitnessName: item.name,
                        WitnessSignature: item.signature
                    })) ?? []

            }

        };

    }

}