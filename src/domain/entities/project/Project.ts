/**
 * Project Aggregate Root - Core domain entity for land acquisition projects.
 * Encapsulates all business rules and invariants for project management.
 */
import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException, DomainException } from '@/core/errors'
import { createDomainEvent } from '@/core/base/DomainEvent'
import { Money } from '@/domain/value-objects/Money'
import { Area } from '@/domain/value-objects/Area'
import { ProjectId } from './ProjectId'

export interface ProjectProps {
  id: ProjectId
  name: string
  collieryCode: string
  totalLandLimit: Area
  totalBudgetCeiling: Money
  totalEmploymentQuota: number
  boundary?: string
  statutoryClearances?: string
  lockedAt: Date | null
  lockedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectProps {
  name: string
  collieryCode: string
  totalLandLimitAcres: number | string
  totalBudgetCeiling: number | string
  totalEmploymentQuota: number
  boundary?: string
}

export interface UpdateProjectProps {
  name?: string
  collieryCode?: string
  totalLandLimitAcres?: number | string
  totalBudgetCeiling?: number | string
  totalEmploymentQuota?: number
  statutoryClearances?: string
}

export class ProjectAlreadyLockedException extends DomainException {
  constructor(projectId: string) {
    super(`Project '${projectId}' is already locked and cannot be modified`, 'PROJECT_LOCKED')
  }
}

export class ProjectNotFoundException extends DomainException {
  constructor(projectId: string) {
    super(`Project '${projectId}' not found`, 'PROJECT_NOT_FOUND')
  }
}

export class Project extends AggregateRoot<string> {
  private _name: string
  private _collieryCode: string
  private _totalLandLimit: Area
  private _totalBudgetCeiling: Money
  private _totalEmploymentQuota: number
  private _boundary: string | undefined
  private _statutoryClearances: string | undefined
  private _lockedAt: Date | null
  private _lockedBy: string | null
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(props: ProjectProps) {
    super(props.id.value)
    this._name = props.name
    this._collieryCode = props.collieryCode
    this._totalLandLimit = props.totalLandLimit
    this._totalBudgetCeiling = props.totalBudgetCeiling
    this._totalEmploymentQuota = props.totalEmploymentQuota
    this._boundary = props.boundary
    this._statutoryClearances = props.statutoryClearances
    this._lockedAt = props.lockedAt
    this._lockedBy = props.lockedBy
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  // Factory method for creating new projects
  static create(props: CreateProjectProps, id?: string): Result<Project, ValidationException> {
    const errors: Array<{ field: string; message: string }> = []

    // Validate name
    if (!props.name || props.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Project name is required' })
    } else if (props.name.length > 500) {
      errors.push({ field: 'name', message: 'Project name must be less than 500 characters' })
    }

    // Validate colliery code
    if (!props.collieryCode || props.collieryCode.trim().length === 0) {
      errors.push({ field: 'collieryCode', message: 'Colliery code is required' })
    }

    // Validate land limit
    const landLimitResult = Area.tryCreate(props.totalLandLimitAcres, 'ACRES')
    if (landLimitResult.isFailure) {
      errors.push({ field: 'totalLandLimitAcres', message: 'Land limit must be a positive number' })
    }

    // Validate budget
    const budgetResult = Money.tryCreate(props.totalBudgetCeiling)
    if (budgetResult.isFailure) {
      errors.push({ field: 'totalBudgetCeiling', message: 'Budget ceiling must be a positive number' })
    }

    // Validate employment quota
    if (props.totalEmploymentQuota < 0) {
      errors.push({ field: 'totalEmploymentQuota', message: 'Employment quota cannot be negative' })
    }

    if (errors.length > 0) {
      return Fail(new ValidationException('Validation failed', errors))
    }

    const projectId = id ? ProjectId.fromString(id) : ProjectId.create()
    const now = new Date()

    const project = new Project({
      id: projectId,
      name: props.name.trim(),
      collieryCode: props.collieryCode.trim(),
      totalLandLimit: (landLimitResult as any).value,
      totalBudgetCeiling: (budgetResult as any).value,
      totalEmploymentQuota: props.totalEmploymentQuota,
      boundary: props.boundary ?? JSON.stringify({ type: 'MultiPolygon', coordinates: [], color: '#16a34a' }),
      lockedAt: null,
      lockedBy: null,
      createdAt: now,
      updatedAt: now,
    })

    return { isSuccess: true, isFailure: false, value: project, error: null }
  }

  // Reconstitute from persistence
  static reconstitute(data: {
    id: string
    name: string
    collieryCode: string
    totalLandLimitAcres: string
    totalBudgetCeiling: string
    totalEmploymentQuota: number
    boundary?: string | null
    statutoryClearances?: string | null
    lockedAt?: Date | null
    lockedBy?: string | null
    createdAt: Date
    updatedAt: Date
  }): Project {
    return new Project({
      id: ProjectId.fromString(data.id),
      name: data.name,
      collieryCode: data.collieryCode,
      totalLandLimit: Area.fromAcres(data.totalLandLimitAcres),
      totalBudgetCeiling: Money.fromINR(data.totalBudgetCeiling),
      totalEmploymentQuota: data.totalEmploymentQuota,
      boundary: data.boundary ?? undefined,
      statutoryClearances: data.statutoryClearances ?? undefined,
      lockedAt: data.lockedAt ?? null,
      lockedBy: data.lockedBy ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  // Business behaviors
  lock(userId: string): Result<void, ProjectAlreadyLockedException> {
    if (this._lockedAt !== null) {
      return Fail(new ProjectAlreadyLockedException(this.id))
    }

    this._lockedAt = new Date()
    this._lockedBy = userId
    this._updatedAt = new Date()

    this.addDomainEvent(createDomainEvent('PROJECT_LOCKED', this.id, {
      lockedBy: userId,
      lockedAt: this._lockedAt.toISOString(),
      projectName: this._name,
    }))

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  update(props: UpdateProjectProps, userId: string): Result<void, ProjectAlreadyLockedException | ValidationException> {
    if (this._lockedAt !== null) {
      return Fail(new ProjectAlreadyLockedException(this.id))
    }

    const errors: Array<{ field: string; message: string }> = []

    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Project name is required' })
      } else {
        this._name = props.name.trim()
      }
    }

    if (props.collieryCode !== undefined) {
      if (!props.collieryCode || props.collieryCode.trim().length === 0) {
        errors.push({ field: 'collieryCode', message: 'Colliery code is required' })
      } else {
        this._collieryCode = props.collieryCode.trim()
      }
    }

    if (props.totalLandLimitAcres !== undefined) {
      const landLimitResult = Area.tryCreate(props.totalLandLimitAcres, 'ACRES')
      if (landLimitResult.isFailure) {
        errors.push({ field: 'totalLandLimitAcres', message: 'Land limit must be a positive number' })
      } else {
        this._totalLandLimit = (landLimitResult as any).value
      }
    }

    if (props.totalBudgetCeiling !== undefined) {
      const budgetResult = Money.tryCreate(props.totalBudgetCeiling)
      if (budgetResult.isFailure) {
        errors.push({ field: 'totalBudgetCeiling', message: 'Budget ceiling must be a positive number' })
      } else {
        this._totalBudgetCeiling = (budgetResult as any).value
      }
    }

    if (props.totalEmploymentQuota !== undefined) {
      if (props.totalEmploymentQuota < 0) {
        errors.push({ field: 'totalEmploymentQuota', message: 'Employment quota cannot be negative' })
      } else {
        this._totalEmploymentQuota = props.totalEmploymentQuota
      }
    }

    if (props.statutoryClearances !== undefined) {
      this._statutoryClearances = props.statutoryClearances
    }

    if (errors.length > 0) {
      return Fail(new ValidationException('Validation failed', errors))
    }

    this._updatedAt = new Date()
    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  // Business rules / invariants
  canBeEdited(): boolean {
    return this._lockedAt === null
  }

  canBeLocked(): boolean {
    return this._lockedAt === null
  }

  isLocked(): boolean {
    return this._lockedAt !== null
  }

  hasAvailableBudget(amount: Money): boolean {
    return this._totalBudgetCeiling.isGreaterThanOrEqual(amount)
  }

  hasAvailableLand(area: Area): boolean {
    return this._totalLandLimit.isGreaterThanOrEqual(area)
  }

  // Getters
  get projectId(): ProjectId {
    return ProjectId.fromString(this.id)
  }

  get name(): string {
    return this._name
  }

  get collieryCode(): string {
    return this._collieryCode
  }

  get totalLandLimit(): Area {
    return this._totalLandLimit
  }

  get totalBudgetCeiling(): Money {
    return this._totalBudgetCeiling
  }

  get totalEmploymentQuota(): number {
    return this._totalEmploymentQuota
  }

  get boundary(): string | undefined {
    return this._boundary
  }

  get statutoryClearances(): string | undefined {
    return this._statutoryClearances
  }

  get lockedAt(): Date | null {
    return this._lockedAt
  }

  get lockedBy(): string | null {
    return this._lockedBy
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  // Serialization for persistence
  toPersistence(): {
    id: string
    name: string
    collieryCode: string
    totalLandLimitAcres: string
    totalBudgetCeiling: string
    totalEmploymentQuota: number
    boundary: string | null
    statutoryClearances: string | null
    lockedAt: Date | null
    lockedBy: string | null
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      name: this._name,
      collieryCode: this._collieryCode,
      totalLandLimitAcres: this._totalLandLimit.toDecimal().toString(),
      totalBudgetCeiling: this._totalBudgetCeiling.toDecimal().toString(),
      totalEmploymentQuota: this._totalEmploymentQuota,
      boundary: this._boundary ?? null,
      statutoryClearances: this._statutoryClearances ?? null,
      lockedAt: this._lockedAt,
      lockedBy: this._lockedBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
