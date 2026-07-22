import { ProjectApproval } from './ProjectApproval'

export interface IProjectApprovalRepository {
  findById(id: string): Promise<ProjectApproval | null>
  findByProjectCode(projCd: string): Promise<ProjectApproval[]>
  save(approval: ProjectApproval): Promise<void>
}
