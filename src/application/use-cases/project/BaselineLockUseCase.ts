import { UseCase } from '@/core/base/UseCase'
import { Result, Fail } from '@/core/result/Result'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'
import { ProjectApproval } from '@/domain/entities/project/ProjectApproval'
import { ProjectApprovalLocation } from '@/domain/entities/project/ProjectApprovalLocation'
import { EventBus } from '@/core/notifications/EventBus'
import { db } from '@/lib/db'

export interface BaselineLockRequest {
  projectId: string
  approvedAreaAcres: string | number
  approvedBudgetINR: string | number
  approvedJobs: number
  approvalDate: Date
  approvalRefNo: string
  docId?: string
  mouzaLgds?: bigint[]
  userId: string
}

export class BaselineLockUseCase implements UseCase<BaselineLockRequest, void> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: BaselineLockRequest): Promise<Result<void>> {
    const project = await this.projectRepository.findById(request.projectId)
    if (!project) return Fail('Project not found')

    if (project.isLocked()) {
      return Fail('Project is already baseline-locked.')
    }

    // 1. Create INITIAL_BASELINE approval
    const approvalResult = ProjectApproval.create({
      projCd: project.id,
      aprvArea: request.approvedAreaAcres,
      empSanc: request.approvedJobs,
      aprvDt: request.approvalDate,
      aprvRefNo: request.approvalRefNo,
      aprvDocId: request.docId,
      aprvType: 'INITIAL_PR',
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

    // 2. Perform DB Transaction
    try {
      await db.$transaction(async (tx) => {
        // Insert approval
        const aprvData = approval.toPersistence()
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
                mouzaLgd: locData.mouzaLgd,
                approvedArea: locData.approvedArea,
                landClassBreakup: locData.landClassBreakup ?? undefined,
                entryTs: locData.entryTs,
                updtTs: locData.updtTs
              }
            })
          })
        }

        // Update master.project
        project.lock(request.userId)
        await tx.project.update({
          where: { projCd: project.id },
          data: {
            status: 1,
            lockedAt: new Date(),
            totalApprovedArea: Number(request.approvedAreaAcres),
            landBudget: Number(request.approvedBudgetINR),
            totalEmpSanctioned: request.approvedJobs,
            updtTs: Math.floor(Date.now() / 1000)
          }
        })
      })

      EventBus.publish({
        event_name: 'PROJECT_BASELINE_LOCKED',
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
