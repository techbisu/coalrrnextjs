/**
 * Repository Interface - Base contract for all repositories.
 * Repositories are responsible for persisting and retrieving aggregates.
 */

export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>
  findAll(): Promise<T[]>
  save(entity: T): Promise<void>
  delete(id: ID): Promise<void>
}

export interface ISpecification<T> {
  isSatisfiedBy(entity: T): boolean
}

export interface IPaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface IQueryOptions {
  page?: number
  pageSize?: number
  orderBy?: Record<string, 'asc' | 'desc'>
  filter?: Record<string, unknown>
}
