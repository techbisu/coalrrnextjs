import { IUseCase } from '@/core'
import { Result, Fail } from '@/core/result/Result'
import { ProjectApproval } from '@/domain/entities/project/ProjectApproval'
import { ProjectApprovalLocation } from '@/domain/entities/project/ProjectApprovalLocation'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'
import { db } from '@/lib/db'
import { Area } from '@/domain/value-objects/Area'
import { Money } from '@/domain/value-objects/Money'
import { EventBus } from '@/core/notifications/EventBus'

export interface ApproveFormXXIIRequest {
  projectId: string
  approvedAreaAcres: string | number
  approvedJobs?: number
  approvalDate: Date
  approvalRefNo: string
  docId?: string
  mouzaLgds?: bigint[]
  userId: string
}

export class ApproveFormXXIIUseCase implements IUseCase<ApproveFormXXIIRequest, void> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: ApproveFormXXIIRequest): Promise<Result<void>> {
    const project = await this.projectRepository.findById(request.projectId)
    if (!project) return Fail('Project not found')

    // 1. Create Domain Entities (Form XXII Deviation)
    const approvalResult = ProjectApproval.create({
      projCd: project.id,
      aprvArea: request.approvedAreaAcres,
      empSanc: request.approvedJobs,
      aprvDt: request.approvalDate,
      aprvRefNo: request.approvalRefNo,
      aprvDocId: request.docId,
      aprvType: 'FORM_XXII_DEVIATION',
      aprvLevel: 'BOARD_OF_DIRECTORS'
    })

    if (approvalResult.isFailure) return Fail(approvalResult.error)
    const approval = approvalResult.value

    const locations: ProjectApprovalLocation[] = []
    if (request.mouzaLgds && request.mouzaLgds.length > 0) {
      for (const mouza of request.mouzaLgds) {
        const locResult = ProjectApprovalLocation.create({
          aprvCd: approval.id,
          mouzaLgd: mouza
        })
        if (locResult.isFailure) return Fail(locResult.error)
        locations.push(locResult.value)
      }
    }

    // 2. Wrap everything in a Prisma transaction
    try {
      await db.$transaction(async (tx) => {
        const aprvData = approval.toPersistence()
        
        // Insert approval
        await tx.projAprv.create({
          data: {
            aprvCd: aprvData.aprvCd,
            projCd: aprvData.projCd,
            aprvArea: aprvData.aprvArea,
            areaAcq: aprvData.areaAcq,
            empSanc: aprvData.empSanc,
            aprvDt: aprvData.aprvDt,
            aprvRefNo: aprvData.aprvRefNo,
            isActive: aprvData.isActive,
            aprvDocId: aprvData.aprvDocId,
            aprvType: aprvData.aprvType,
            aprvLevel: aprvData.aprvLevel,
            entryTs: aprvData.entryTs,
            updtTs: aprvData.updtTs
          }
        })

        // Insert locations
        if (locations.length > 0) {
          await tx.projAprvLocation.createMany({
            data: locations.map(loc => {
              const locData = loc.toPersistence()
              return {
                aprvLocationCode: locData.aprvLocationCode,
                aprvCd: locData.aprvCd,
                mouzaLgd: locData.mouzaLgd as bigint,
                approvedArea: locData.approvedArea,
                landClassBreakup: locData.landClassBreakup ?? undefined,
                entryTs: locData.entryTs,
                updtTs: locData.updtTs
              }
            })
          })
        }

        // Update project running totals
        const newApprovedArea = project.totalApprovedArea.add(approval.aprvArea || Area.fromAcres(0))
        const newEmpSanctioned = project.totalEmpSanctioned + (approval.empSanc || 0)

        await tx.project.update({
          where: { projCd: project.id },
          data: {
            totalApprovedArea: newApprovedArea.toDecimal(),
            totalEmpSanctioned: newEmpSanctioned,
            updtTs: BigInt(Math.floor(Date.now() / 1000))
          }
        })
      })

      EventBus.publish({
        event_name: 'FORM_XXII_APPROVED',
        module: 'project-master',
        user_id: request.userId,
        entity_id: project.id,
        data: {
          aprvId: approval.id,
          aprvRefNo: request.approvalRefNo
        }
      })

      return Result.ok(undefined)
    } catch (err: any) {
      return Fail(`Transaction failed: ${err.message}`)
    }
  }
}
