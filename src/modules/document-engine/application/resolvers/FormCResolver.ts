import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class FormCResolver implements IDocumentResolver {

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
                medical: true,
                employment: true,
                verification: true,
                area: true
            }
        });

        return {

            fields: {

                UnitName: application?.unit_name ?? "",

                AreaName: application?.area?.name ?? "",

                NomineeName: application?.nominee?.name ?? "",

                NomineeFatherName: application?.nominee?.father_name ?? "",

                PresentAddress: application?.nominee?.present_address ?? "",

                PermanentAddress: application?.nominee?.permanent_address ?? "",

                VoterCardNo: application?.nominee?.voter_card_no ?? "",

                AadhaarNo: application?.nominee?.aadhaar_no ?? "",

                Gender: application?.nominee?.gender ?? "",

                Nationality: application?.nominee?.nationality ?? "",

                Religion: application?.nominee?.religion ?? "",

                EducationalQualification: application?.nominee?.educational_qualification ?? "",

                TechnicalQualification: application?.nominee?.technical_qualification ?? "",

                CommunityCategory: application?.nominee?.community ?? "",

                IsPhysicallyChallenged: application?.medical?.is_physically_challenged ? "Yes" : "No",

                DisabilityDetails: application?.medical?.disability_details ?? "",

                MedicalCertificatePageNo: application?.medical?.certificate_page_no ?? "",

                BelongsToECLFamily: application?.employment?.belongs_to_ecl_family ? "Yes" : "No",

                ECLEmployeeName: application?.employment?.employee_name ?? "",

                PostingPlace: application?.employment?.posting_place ?? "",

                EmployeeDesignation: application?.employment?.designation ?? "",

                EmployeeUMNo: application?.employment?.um_no ?? "",

                GenealogyVerified: application?.verification?.genealogy_verified ? "Yes" : "No",

                RelationshipVerified: application?.verification?.relationship_verified ? "Yes" : "No",

                VerifiedNominator: application?.verification?.nominator_name ?? "",

                RelationshipWithNominee: application?.verification?.relationship ?? "",

                VerificationDate: application?.verification?.verification_date ?? ""

            },

            tables: {}

        };

    }

}