import { IUseCase } from '@/core'
import { Result, Fail } from '@/core/result/Result'
import { ProjectApproval } from '@/domain/entities/project/ProjectApproval'
import { ProjectApprovalLocation } from '@/domain/entities/project/ProjectApprovalLocation'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'
import { EventBus } from '@/core/notifications/EventBus'
import { Audit } from '@/core/audit/services/AuditService'

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

    try {
      await this.projectRepository.approveFormXXII(project, approval, locations); await EventBus.publish({
        event_name: 'FORM_XXII_APPROVED',
        module: 'project-master',
        user_id: request.userId,
        entity_id: project.id,
        data: {
          aprvId: approval.id,
          aprvRefNo: request.approvalRefNo
        }
      })

      Audit.logCustomAction({
        activity: `Approved Form-XXII deviation for Project ${project.id}. Area: ${request.approvedAreaAcres}, Ref: ${request.approvalRefNo}`,
        userId: request.userId
      }).catch(console.error)

      return Result.ok(undefined)
    } catch (err: any) {
      return Fail(`Transaction failed: ${err.message}`)
    }
  }
}
