import { IDocumentResolver, DocumentResolverResult } from '../../domain/IDocumentResolver'
import { db } from '@/lib/db'
export class AttestationFormResolver implements IDocumentResolver {
  async resolve(employeeId: number) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        addresses: true,
        residenceHistory: true,
        familyMembers: true,
        education: true,
        employmentHistory: true,
        policeVerification: true,
        references: true,
        attestation: true,
      },
    });

    return {
      fields: {
        CandidateSurname: employee?.surname,
        CandidateName: employee?.name,
        AliasName: employee?.aliasName,
        PresentAddress: employee?.presentAddress,
        PermanentAddress: employee?.permanentAddress,
        Nationality: employee?.nationality,
        DateOfBirth: employee?.dateOfBirth,
        PresentAge: employee?.age,
        Religion: employee?.religion,
        CommunityCategory: employee?.communityCategory,
        CommunityName: employee?.communityName,
      },

      tables: {
        ResidentialHistory: employee?.residenceHistory ?? [],
        FamilyMembers: employee?.familyMembers ?? [],
        ForeignResidentChildren: employee?.foreignResidentChildren ?? [],
        EducationalQualifications: employee?.education ?? [],
        EmploymentHistory: employee?.employmentHistory ?? [],
        AntecedentCases: employee?.policeVerification ?? [],
        References: employee?.references ?? [],
      },
    };
  }
}