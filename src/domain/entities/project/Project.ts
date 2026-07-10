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
  colliery_code: string
  totalLandLimit: Area
  total_budget_ceiling: Money
  total_employment_quota: number
  boundary?: string
  statutory_clearances?: string
  locked_at: Date | null
  lockedBy: string | null
  entry_ts: Date
  updt_ts: Date
}

export interface CreateProjectProps {
  name: string
  colliery_code: string
  total_land_limit_acres: number | string
  total_budget_ceiling: number | string
  total_employment_quota: number
  boundary?: string
}

export interface UpdateProjectProps {
  name?: string
  colliery_code?: string
  total_land_limit_acres?: number | string
  total_budget_ceiling?: number | string
  total_employment_quota?: number
  statutory_clearances?: string
}

export class ProjectAlreadyLockedException extends DomainException {
  constructor(project_id: string) {
    super(`Project '${project_id}' is already locked and cannot be modified`, 'PROJECT_LOCKED')
  }
}

export class ProjectNotFoundException extends DomainException {
  constructor(project_id: string) {
    super(`Project '${project_id}' not found`, 'PROJECT_NOT_FOUND')
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
  private _entryTs: Date
  private _updtTs: Date

  private constructor(props: ProjectProps) {
    super(props.id.value)
    this._name = props.name
    this._collieryCode = props.colliery_code
    this._totalLandLimit = props.totalLandLimit
    this._totalBudgetCeiling = props.total_budget_ceiling
    this._totalEmploymentQuota = props.total_employment_quota
    this._boundary = props.boundary
    this._statutoryClearances = props.statutory_clearances
    this._lockedAt = props.locked_at
    this._lockedBy = props.lockedBy
    this._entryTs = props.entry_ts
    this._updtTs = props.updt_ts
  }

  // Factory method for creating new projects
  static create(props: CreateProjectProps, id?: string): Result<Project> {
    const errors: Array<{ field: string; message: string }> = []

    // Validate name
    if (!props.name || props.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Project name is required' })
    } else if (props.name.length > 500) {
      errors.push({ field: 'name', message: 'Project name must be less than 500 characters' })
    }

    // Validate colliery code
    if (!props.colliery_code || props.colliery_code.trim().length === 0) {
      errors.push({ field: 'colliery_code', message: 'Colliery code is required' })
    }

    // Validate land limit
    const landLimitResult = Area.tryCreate(props.total_land_limit_acres, 'ACRES')
    if (landLimitResult.isFailure) {
      errors.push({ field: 'total_land_limit_acres', message: 'Land limit must be a positive number' })
    }

    // Validate budget
    const budgetResult = Money.tryCreate(props.total_budget_ceiling)
    if (budgetResult.isFailure) {
      errors.push({ field: 'total_budget_ceiling', message: 'Budget ceiling must be a valid number' })
    } else if ((budgetResult as any).value.isNegative()) {
      errors.push({ field: 'total_budget_ceiling', message: 'Budget ceiling must be a positive number' })
    }

    // Validate employment quota
    if (props.total_employment_quota < 0) {
      errors.push({ field: 'total_employment_quota', message: 'Employment quota cannot be negative' })
    }

    if (errors.length > 0) {
      return Fail('Validation failed')
    }

    const project_id = id ? ProjectId.fromString(id) : ProjectId.create()
    const now = new Date()

    const project = new Project({
      id: project_id,
      name: props.name.trim(),
      colliery_code: props.colliery_code.trim(),
      totalLandLimit: (landLimitResult as any).value,
      total_budget_ceiling: (budgetResult as any).value,
      total_employment_quota: props.total_employment_quota,
      boundary: props.boundary ?? JSON.stringify({ type: 'MultiPolygon', coordinates: [], color: '#16a34a' }),
      locked_at: null,
      lockedBy: null,
      entry_ts: now,
      updt_ts: now,
    })

    project.addDomainEvent(createDomainEvent('PROJECT_CREATED', project.id.toString(), {
      name: project.name,
      colliery_code: project.colliery_code
    }))

    return { isSuccess: true, isFailure: false, value: project, error: null }
  }

  // Reconstitute from persistence
  static reconstitute(data: {
    id: string
    name: string
    colliery_code: string
    total_land_limit_acres: string
    total_budget_ceiling: string
    total_employment_quota: number
    boundary?: string | null
    statutory_clearances?: string | null
    locked_at?: Date | null
    lockedBy?: string | null
    entry_ts: Date
    updt_ts: Date
  }): Project {
    return new Project({
      id: ProjectId.fromString(data.id),
      name: data.name,
      colliery_code: data.colliery_code,
      totalLandLimit: Area.fromAcres(data.total_land_limit_acres),
      total_budget_ceiling: Money.fromINR(data.total_budget_ceiling),
      total_employment_quota: data.total_employment_quota,
      boundary: data.boundary ?? undefined,
      statutory_clearances: data.statutory_clearances ?? undefined,
      locked_at: data.locked_at ?? null,
      lockedBy: data.lockedBy ?? null,
      entry_ts: data.entry_ts,
      updt_ts: data.updt_ts,
    })
  }

  // Business behaviors
  lock(user_id: string): Result<void> {
    if (this._lockedAt !== null) {
      return Fail(this.id.toString())
    }

    this._lockedAt = new Date()
    this._lockedBy = user_id
    this._updtTs = new Date()

    this.addDomainEvent(createDomainEvent('PROJECT_LOCKED', this.id.toString(), {
      lockedBy: user_id,
      locked_at: this._lockedAt.toISOString(),
      projectName: this._name,
    }))

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  update(props: UpdateProjectProps, user_id: string): Result<void> {
    if (this._lockedAt !== null) {
      return Fail(this.id.toString())
    }

    const errors: Array<{ field: string; message: string }> = []

    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Project name is required' })
      } else {
        this._name = props.name.trim()
      }
    }

    if (props.colliery_code !== undefined) {
      if (!props.colliery_code || props.colliery_code.trim().length === 0) {
        errors.push({ field: 'colliery_code', message: 'Colliery code is required' })
      } else {
        this._collieryCode = props.colliery_code.trim()
      }
    }

    if (props.total_land_limit_acres !== undefined) {
      const landLimitResult = Area.tryCreate(props.total_land_limit_acres, 'ACRES')
      if (landLimitResult.isFailure) {
        errors.push({ field: 'total_land_limit_acres', message: 'Land limit must be a positive number' })
      } else {
        this._totalLandLimit = (landLimitResult as any).value
      }
    }

    if (props.total_budget_ceiling !== undefined) {
      const budgetResult = Money.tryCreate(props.total_budget_ceiling)
      if (budgetResult.isFailure) {
        errors.push({ field: 'total_budget_ceiling', message: 'Budget ceiling must be a valid number' })
      } else {
        this._totalBudgetCeiling = (budgetResult as any).value
      }
    }

    if (props.total_employment_quota !== undefined) {
      if (props.total_employment_quota < 0) {
        errors.push({ field: 'total_employment_quota', message: 'Employment quota cannot be negative' })
      } else {
        this._totalEmploymentQuota = props.total_employment_quota
      }
    }

    if (props.statutory_clearances !== undefined) {
      this._statutoryClearances = props.statutory_clearances
    }

    if (errors.length > 0) {
      return Fail('Validation failed')
    }

    this._updtTs = new Date()
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
  get project_id(): ProjectId {
    return ProjectId.fromString(this.id)
  }

  get name(): string {
    return this._name
  }

  get colliery_code(): string {
    return this._collieryCode
  }

  get totalLandLimit(): Area {
    return this._totalLandLimit
  }

  get total_budget_ceiling(): Money {
    return this._totalBudgetCeiling
  }

  get total_employment_quota(): number {
    return this._totalEmploymentQuota
  }

  get boundary(): string | undefined {
    return this._boundary
  }

  get statutory_clearances(): string | undefined {
    return this._statutoryClearances
  }

  get locked_at(): Date | null {
    return this._lockedAt
  }

  get lockedBy(): string | null {
    return this._lockedBy
  }

  get entry_ts(): Date {
    return this._entryTs
  }

  get updt_ts(): Date {
    return this._updtTs
  }

  // Serialization for persistence
  toPersistence(): {
    id: string
    name: string
    colliery_code: string
    total_land_limit_acres: string
    total_budget_ceiling: string
    total_employment_quota: number
    boundary: string | null
    statutory_clearances: string | null
    locked_at: Date | null
    lockedBy: string | null
    entry_ts: Date
    updt_ts: Date
  } {
    return {
      id: this.id,
      name: this._name,
      colliery_code: this._collieryCode,
      total_land_limit_acres: this._totalLandLimit.toDecimal().toString(),
      total_budget_ceiling: this._totalBudgetCeiling.toDecimal().toString(),
      total_employment_quota: this._totalEmploymentQuota,
      boundary: this._boundary ?? null,
      statutory_clearances: this._statutoryClearances ?? null,
      locked_at: this._lockedAt,
      lockedBy: this._lockedBy,
      entry_ts: this._entryTs,
      updt_ts: this._updtTs,
    }
  }
}
