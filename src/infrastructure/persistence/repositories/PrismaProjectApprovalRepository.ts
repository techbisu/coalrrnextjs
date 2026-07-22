import { db } from '@/lib/db'
import { IProjectApprovalRepository } from '@/domain/entities/project/ProjectApprovalRepository.interface'
import { ProjectApproval } from '@/domain/entities/project/ProjectApproval'

export class PrismaProjectApprovalRepository implements IProjectApprovalRepository {
  async findById(id: string): Promise<ProjectApproval | null> {
    const data = await db.projAprv.findUnique({
      where: { aprvCd: BigInt(id) }
    })

    if (!data) return null

    return ProjectApproval.reconstitute({
      aprvCd: data.aprvCd.toString(),
      projCd: data.projCd,
      aprvArea: data.aprvArea ? data.aprvArea.toString() : null,
      areaAcq: data.areaAcq ? data.areaAcq.toString() : '0',
      empSanc: data.empSanc,
      aprvDt: data.aprvDt,
      aprvRefNo: data.aprvRefNo,
      isActive: data.isActive ?? true,
      aprvDocId: data.aprvDocId,
      aprvType: data.aprvType,
      aprvLevel: data.aprvLevel,
      entryTs: new Date(Number(data.entryTs ?? 0) * 1000),
      updtTs: new Date(Number(data.updtTs ?? 0) * 1000),
    })
  }

  async findByProjectCode(projCd: string): Promise<ProjectApproval[]> {
    const data = await db.projAprv.findMany({
      where: { projCd }
    })

    return data.map(d => ProjectApproval.reconstitute({
      aprvCd: d.aprvCd.toString(),
      projCd: d.projCd,
      aprvArea: d.aprvArea ? d.aprvArea.toString() : null,
      areaAcq: d.areaAcq ? d.areaAcq.toString() : '0',
      empSanc: d.empSanc,
      aprvDt: d.aprvDt,
      aprvRefNo: d.aprvRefNo,
      isActive: d.isActive ?? true,
      aprvDocId: d.aprvDocId,
      aprvType: d.aprvType,
      aprvLevel: d.aprvLevel,
      entryTs: new Date(Number(d.entryTs ?? 0) * 1000),
      updtTs: new Date(Number(d.updtTs ?? 0) * 1000),
    }))
  }

  async save(approval: ProjectApproval): Promise<void> {
    const data = approval.toPersistence()
    
    // Attempt to upsert
    await db.projAprv.upsert({
      where: { aprvCd: data.aprvCd },
      update: {
        projCd: data.projCd,
        aprvArea: data.aprvArea,
        areaAcq: data.areaAcq,
        empSanc: data.empSanc,
        aprvDt: data.aprvDt,
        aprvRefNo: data.aprvRefNo,
        isActive: data.isActive,
        aprvDocId: data.aprvDocId,
        aprvType: data.aprvType,
        aprvLevel: data.aprvLevel,
        updtTs: data.updtTs,
      },
      create: {
        aprvCd: data.aprvCd,
        projCd: data.projCd,
        aprvArea: data.aprvArea,
        areaAcq: data.areaAcq,
        empSanc: data.empSanc,
        aprvDt: data.aprvDt,
        aprvRefNo: data.aprvRefNo,
        isActive: data.isActive,
        aprvDocId: data.aprvDocId,
        aprvType: data.aprvType,
        aprvLevel: data.aprvLevel,
        entryTs: data.entryTs,
        updtTs: data.updtTs,
      }
    })
  }
}
