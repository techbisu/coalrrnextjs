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
  findByCollieryCode(collieryCode: string, options?: IQueryOptions): Promise<IPaginatedResult<Project>>
  save(project: Project): Promise<void>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  lock(id: string, userId: string): Promise<boolean>
}

export interface IProjectQueryOptions extends IQueryOptions {
  collieryCode?: string
  isLocked?: boolean
  search?: string
}
