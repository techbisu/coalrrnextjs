import { ProjectApprovalLocation } from './ProjectApprovalLocation'

export interface IProjectApprovalLocationRepository {
  findById(id: string): Promise<ProjectApprovalLocation | null>
  findByApprovalCode(aprvCd: string): Promise<ProjectApprovalLocation[]>
  isMouzaAuthorized(projectId: string, mouzaLgd: bigint): Promise<boolean>
  save(location: ProjectApprovalLocation): Promise<void>
}
