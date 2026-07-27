import { db } from '@/lib/db'
import { IProjectApprovalLocationRepository } from '@/domain/entities/project/ProjectApprovalLocationRepository.interface'
import { ProjectApprovalLocation } from '@/domain/entities/project/ProjectApprovalLocation'

export class PrismaProjectApprovalLocationRepository implements IProjectApprovalLocationRepository {
  async findById(id: string): Promise<ProjectApprovalLocation | null> {
    const data = await db.projAprvLocation.findUnique({
      where: { aprvLocationCode: id }
    })

    if (!data) return null

    return ProjectApprovalLocation.reconstitute({
      aprvLocId: data.aprvLocationCode,
      aprvCd: data.aprvCd.toString(),
      stateLgd: null, // Removed from schema
      districtLgd: null, // Removed from schema
      mouzaLgd: data.mouzaLgd,
      aprvArea: data.approvedArea ? data.approvedArea.toString() : null,
      areaAcq: '0', // Removed from schema
      landClassBreakup: data.landClassBreakup,
      entryTs: new Date(Number(data.entryTs ?? 0) * 1000),
      updtTs: new Date(Number(data.updtTs ?? 0) * 1000),
    })
  }

  async findByApprovalCode(aprvCd: string): Promise<ProjectApprovalLocation[]> {
    const data = await db.projAprvLocation.findMany({
      where: { aprvCd: BigInt(aprvCd) }
    })

    return data.map(d => ProjectApprovalLocation.reconstitute({
      aprvLocId: d.aprvLocationCode,
      aprvCd: d.aprvCd.toString(),
      stateLgd: null,
      districtLgd: null,
      mouzaLgd: d.mouzaLgd,
      aprvArea: d.approvedArea ? d.approvedArea.toString() : null,
      areaAcq: '0',
      landClassBreakup: d.landClassBreakup,
      entryTs: new Date(Number(d.entryTs ?? 0) * 1000),
      updtTs: new Date(Number(d.updtTs ?? 0) * 1000),
    }))
  }

  async isMouzaAuthorized(projectId: string, mouzaLgd: bigint): Promise<boolean> {
    const count = await db.projAprvLocation.count({
      where: {
        mouzaLgd: mouzaLgd,
        approval: {
          projCd: projectId,
          isActive: true
        }
      }
    })
    return count > 0
  }

  async save(location: ProjectApprovalLocation): Promise<void> {
    const data = location.toPersistence()
    
    await db.projAprvLocation.upsert({
      where: { aprvLocationCode: data.aprvLocationCode },
      update: {
        aprvCd: data.aprvCd,
        mouzaLgd: data.mouzaLgd ?? BigInt(0),
        approvedArea: data.approvedArea,
        landClassBreakup: data.landClassBreakup ?? undefined,
        updtTs: data.updtTs,
      },
      create: {
        aprvLocationCode: data.aprvLocationCode,
        aprvCd: data.aprvCd,
        mouzaLgd: data.mouzaLgd ?? BigInt(0),
        approvedArea: data.approvedArea,
        landClassBreakup: data.landClassBreakup ?? undefined,
        entryTs: data.entryTs,
        updtTs: data.updtTs,
      }
    })
  }
}
