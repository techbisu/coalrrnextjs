/**
 * Project Repository Interface - Contract for project persistence.
 * Defined in the domain layer, implemented in infrastructure layer.
 */
import { Project } from './Project'
import { IPaginatedResult, IQueryOptions } from '@/core/interfaces'

export interface IProjectRepository {
  findById(id: string): Promise<Project | null>
  findAll(options?: IQueryOptions): Promise<IPaginatedResult<Project>>
  findByName(name: string): Promise<Project | null>
  findByMineCode(mine_cd: string, options?: IQueryOptions): Promise<IPaginatedResult<Project>>
  save(project: Project): Promise<void>
  updateProjectMouzas(projectId: string, mouzaLgds: bigint[]): Promise<void>
  syncProjectDocuments(projectId: string, fileIds: string[], userId: string): Promise<void>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  lock(id: string, user_id: string): Promise<boolean>
}

export interface IProjectQueryOptions extends IQueryOptions {
  mine_cd?: string
  isLocked?: boolean
  search?: string
}
