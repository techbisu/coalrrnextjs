import { db } from '@/lib/db'
import { IProjectApprovalLocationRepository } from '@/domain/entities/project/ProjectApprovalLocationRepository.interface'
import { ProjectApprovalLocation } from '@/domain/entities/project/ProjectApprovalLocation'

export class PrismaProjectApprovalLocationRepository implements IProjectApprovalLocationRepository {
  async findById(id: string): Promise<ProjectApprovalLocation | null> {
    const data = await db.projAprvLocation.findUnique({
      where: { aprvLocId: BigInt(id) }
    })

    if (!data) return null

    return ProjectApprovalLocation.reconstitute({
      aprvLocId: data.aprvLocId.toString(),
      aprvCd: data.aprvCd.toString(),
      stateLgd: data.stateLgd,
      districtLgd: data.districtLgd,
      mouzaLgd: data.mouzaLgd,
      aprvArea: data.aprvArea ? data.aprvArea.toString() : null,
      areaAcq: data.areaAcq ? data.areaAcq.toString() : '0',
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
      aprvLocId: d.aprvLocId.toString(),
      aprvCd: d.aprvCd.toString(),
      stateLgd: d.stateLgd,
      districtLgd: d.districtLgd,
      mouzaLgd: d.mouzaLgd,
      aprvArea: d.aprvArea ? d.aprvArea.toString() : null,
      areaAcq: d.areaAcq ? d.areaAcq.toString() : '0',
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
      where: { aprvLocId: data.aprvLocId },
      update: {
        aprvCd: data.aprvCd,
        stateLgd: data.stateLgd,
        districtLgd: data.districtLgd,
        mouzaLgd: data.mouzaLgd,
        aprvArea: data.aprvArea,
        areaAcq: data.areaAcq,
        landClassBreakup: data.landClassBreakup,
        updtTs: data.updtTs,
      },
      create: {
        aprvLocId: data.aprvLocId,
        aprvCd: data.aprvCd,
        stateLgd: data.stateLgd,
        districtLgd: data.districtLgd,
        mouzaLgd: data.mouzaLgd,
        aprvArea: data.aprvArea,
        areaAcq: data.areaAcq,
        landClassBreakup: data.landClassBreakup,
        entryTs: data.entryTs,
        updtTs: data.updtTs,
      }
    })
  }
}
