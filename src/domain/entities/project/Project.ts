import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result, Fail } from '@/core/result/Result'
import { DomainException } from '@/core/errors'
import { createDomainEvent } from '@/core/base/DomainEvent'
import { Money } from '@/domain/value-objects/Money'
import { Area } from '@/domain/value-objects/Area'
import { ProjectId } from './ProjectId'

export interface ProjectProps {
  id: ProjectId
  projNm: string
  eclProjCd?: string | null
  mineCds?: string[]
  projectDesc?: string | null
  totalApprovedArea: Area
  totalAcquiredArea: Area
  approvedTenancyArea?: number
  approvedGovtArea?: number
  approvedPattaArea?: number
  approvedForestArea?: number
  approvedExcavationArea?: number
  approvedSafetyZoneArea?: number
  approvedObDumpArea?: number
  approvedInfraArea?: number
  approvedDiversionArea?: number
  approvedRehabArea?: number
  isComboProject?: boolean
  linkedMineCodes?: string[]
  totalEmpSanctioned: number
  totalEmpCompleted: number
  landBudget: Money
  rrBudget: Money
  status: number
  remarks?: string | null
  tenantId?: string | null
  isActive: boolean
  lockedAt?: Date | null
  entryTs: Date
  updtTs: Date
}

export interface CreateProjectProps {
  projCd?: string
  projNm: string
  eclProjCd?: string
  mine_cds: string[]
  projectDesc?: string
  area_cd?: string
  totalApprovedArea?: string
  totalAcquiredArea?: string
  approved_tenancy_area?: number
  approved_govt_area?: number
  approved_patta_area?: number
  approved_forest_area?: number
  approved_excavation_area?: number
  approved_safety_zone_area?: number
  approved_ob_dump_area?: number
  approved_infra_area?: number
  approved_diversion_area?: number
  approved_rehab_area?: number
  is_combo_project?: boolean
  linked_mine_codes?: string[]
  totalEmpSanctioned?: number
  totalEmpCompleted?: number
  landBudget?: string
  rrBudget?: string
  status?: number
  remarks?: string
  tenantId?: string
  isActive?: boolean
  lockedAt?: Date
  state_lgd?: bigint
  district_lgd?: string | number
  block_lgds?: string[]
  mouza_lgds?: string[]
  total_land_limit_acres?: number | string
  total_budget_ceiling?: number | string
  total_employment_quota?: number
  pr_doc_id?: string
  boundary?: string
  statutory_clearances?: any
}

export interface UpdateProjectProps {
  name?: string
  mine_cd?: string
  totalApprovedArea?: string
  landBudget?: string
  rrBudget?: string
  totalEmpSanctioned?: number
  area_cd?: string
  state_lgd?: bigint
  pr_doc_id?: string
  boundary?: string
  statutory_clearances?: any
}

export class ProjectNotFoundException extends DomainException {
  constructor(project_id: string) {
    super(`Project '${project_id}' not found`, 'PROJECT_NOT_FOUND')
  }
}

export class ProjectAlreadyLockedException extends DomainException {
  constructor(project_id: string) {
    super(`Project '${project_id}' is already locked`, 'PROJECT_ALREADY_LOCKED')
  }
}

export class Project extends AggregateRoot<string> {
  private _projNm: string
  private _eclProjCd: string | null
  private _mineCds: string[]
  private _projectDesc: string | null
  private _totalApprovedArea: Area
  private _totalAcquiredArea: Area
  private _approvedTenancyArea: number
  private _approvedGovtArea: number
  private _approvedPattaArea: number
  private _approvedForestArea: number
  private _approvedExcavationArea: number
  private _approvedSafetyZoneArea: number
  private _approvedObDumpArea: number
  private _approvedInfraArea: number
  private _approvedDiversionArea: number
  private _approvedRehabArea: number
  private _isComboProject: boolean
  private _linkedMineCodes: string[]
  private _totalEmpSanctioned: number
  private _totalEmpCompleted: number
  private _landBudget: Money
  private _rrBudget: Money
  private _status: number
  private _remarks: string | null
  private _tenantId: string | null
  private _isActive: boolean
  private _lockedAt: Date | null
  private _entryTs: Date
  private _updtTs: Date

  private constructor(props: ProjectProps) {
    super(props.id.value)
    this._projNm = props.projNm
    this._eclProjCd = props.eclProjCd ?? null
    this._mineCds = props.mineCds || []
    this._projectDesc = props.projectDesc ?? null
    this._totalApprovedArea = props.totalApprovedArea
    this._totalAcquiredArea = props.totalAcquiredArea
    this._approvedTenancyArea = props.approvedTenancyArea || 0
    this._approvedGovtArea = props.approvedGovtArea || 0
    this._approvedPattaArea = props.approvedPattaArea || 0
    this._approvedForestArea = props.approvedForestArea || 0
    this._approvedExcavationArea = props.approvedExcavationArea || 0
    this._approvedSafetyZoneArea = props.approvedSafetyZoneArea || 0
    this._approvedObDumpArea = props.approvedObDumpArea || 0
    this._approvedInfraArea = props.approvedInfraArea || 0
    this._approvedDiversionArea = props.approvedDiversionArea || 0
    this._approvedRehabArea = props.approvedRehabArea || 0
    this._isComboProject = props.isComboProject || false
    this._linkedMineCodes = props.linkedMineCodes || []
    this._totalEmpSanctioned = props.totalEmpSanctioned
    this._totalEmpCompleted = props.totalEmpCompleted
    this._landBudget = props.landBudget
    this._rrBudget = props.rrBudget
    this._status = props.status
    this._remarks = props.remarks ?? null
    this._tenantId = props.tenantId ?? null
    this._isActive = props.isActive
    this._lockedAt = props.lockedAt ?? null
    this._entryTs = props.entryTs
    this._updtTs = props.updtTs
  }

  get mineCds(): string[] {
    return this._mineCds
  }

  get approvedTenancyArea(): number { return this._approvedTenancyArea }
  get approvedGovtArea(): number { return this._approvedGovtArea }
  get approvedPattaArea(): number { return this._approvedPattaArea }
  get approvedForestArea(): number { return this._approvedForestArea }
  get approvedExcavationArea(): number { return this._approvedExcavationArea }
  get approvedSafetyZoneArea(): number { return this._approvedSafetyZoneArea }
  get approvedObDumpArea(): number { return this._approvedObDumpArea }
  get approvedInfraArea(): number { return this._approvedInfraArea }
  get approvedDiversionArea(): number { return this._approvedDiversionArea }
  get approvedRehabArea(): number { return this._approvedRehabArea }
  get isComboProject(): boolean { return this._isComboProject }
  get linkedMineCodes(): string[] { return this._linkedMineCodes }

  static create(props: CreateProjectProps): Result<Project> {
    const errors: Array<{ field: string; message: string }> = []

    if (!props.mine_cds || props.mine_cds.length === 0) {
      errors.push({ field: 'mine_cds', message: 'At least one mine code is required' })
    }

    if (!props.projNm || props.projNm.trim().length === 0) {
      errors.push({ field: 'projNm', message: 'Project name is required' })
    }

    if (errors.length > 0) {
      return Fail(errors.map(e => e.message).join(', '))
    }

    const now = new Date()
    const targetProjCd = props.projCd && props.projCd.trim() !== '' 
      ? props.projCd.trim() 
      : `PRJ-${require('crypto').randomBytes(6).toString('hex').toUpperCase()}`

    const project = new Project({
      id: ProjectId.fromString(targetProjCd),
      projNm: props.projNm.trim(),
      eclProjCd: props.eclProjCd || '',
      mineCds: props.mine_cds,
      projectDesc: props.projectDesc || null,
      totalApprovedArea: props.totalApprovedArea ? Area.fromAcres(Number(props.totalApprovedArea) || 0) : Area.fromAcres(0),
      totalAcquiredArea: Area.fromAcres(0),
      approvedTenancyArea: props.approved_tenancy_area || 0,
      approvedGovtArea: props.approved_govt_area || 0,
      approvedPattaArea: props.approved_patta_area || 0,
      approvedForestArea: props.approved_forest_area || 0,
      approvedExcavationArea: props.approved_excavation_area || 0,
      approvedSafetyZoneArea: props.approved_safety_zone_area || 0,
      approvedObDumpArea: props.approved_ob_dump_area || 0,
      approvedInfraArea: props.approved_infra_area || 0,
      approvedDiversionArea: props.approved_diversion_area || 0,
      approvedRehabArea: props.approved_rehab_area || 0,
      isComboProject: props.is_combo_project || false,
      linkedMineCodes: props.linked_mine_codes || [],
      totalEmpSanctioned: props.totalEmpSanctioned || 0,
      totalEmpCompleted: 0,
      landBudget: props.landBudget ? Money.fromINR(Number(props.landBudget) || 0) : Money.fromINR(0),
      rrBudget: props.rrBudget ? Money.fromINR(Number(props.rrBudget) || 0) : Money.fromINR(0),
      status: 0,
      tenantId: props.tenantId,
      isActive: true,
      entryTs: now,
      updtTs: now,
    })

    project.addDomainEvent(createDomainEvent('PROJECT_CREATED', project.id.toString(), {
      name: project.projNm,
      code: project.id.toString()
    }))

    return { isSuccess: true, isFailure: false, value: project, error: null }
  }

  update(props: UpdateProjectProps, userId: string): Result<void> {
    if (this.isLocked()) {
      return Fail('Cannot update a locked baseline')
    }

    if (props.name !== undefined) {
      if (props.name.trim().length === 0) return Fail('Project name cannot be empty')
      this._projNm = props.name.trim()
    }

    if (props.totalApprovedArea !== undefined) {
      this._totalApprovedArea = Area.fromAcres(Number(props.totalApprovedArea) || 0)
    }

    if (props.landBudget !== undefined) {
      this._landBudget = Money.fromINR(Number(props.landBudget) || 0)
    }

    if (props.rrBudget !== undefined) {
      this._rrBudget = Money.fromINR(Number(props.rrBudget) || 0)
    }

    if (props.totalEmpSanctioned !== undefined) {
      this._totalEmpSanctioned = props.totalEmpSanctioned
    }

    this._updtTs = new Date()

    this.addDomainEvent(createDomainEvent('PROJECT_UPDATED', this.id, {
      name: this._projNm,
      code: this.id,
      updated_by: userId
    }))

    return Result.ok<void>(undefined as void)
  }

  static reconstitute(data: {
    projCd: string
    projNm: string
    eclProjCd?: string | null
    mineCds?: string[]
    projectDesc?: string | null
    totalApprovedArea: string
    totalAcquiredArea: string
    approvedTenancyArea?: number
    approvedGovtArea?: number
    approvedPattaArea?: number
    approvedForestArea?: number
    approvedExcavationArea?: number
    approvedSafetyZoneArea?: number
    approvedObDumpArea?: number
    approvedInfraArea?: number
    approvedDiversionArea?: number
    approvedRehabArea?: number
    isComboProject?: boolean
    linkedMineCodes?: string[]
    totalEmpSanctioned: number
    totalEmpCompleted: number
    landBudget: string
    rrBudget: string
    status: number
    remarks?: string | null
    tenantId?: string | null
    isActive: boolean
    lockedAt?: Date | null
    entryTs: Date
    updtTs: Date
  }): Project {
    return new Project({
      id: ProjectId.fromString(data.projCd),
      projNm: data.projNm,
      eclProjCd: data.eclProjCd,
      mineCds: data.mineCds,
      projectDesc: data.projectDesc,
      totalApprovedArea: Area.fromAcres(data.totalApprovedArea),
      totalAcquiredArea: Area.fromAcres(data.totalAcquiredArea),
      approvedTenancyArea: data.approvedTenancyArea || 0,
      approvedGovtArea: data.approvedGovtArea || 0,
      approvedPattaArea: data.approvedPattaArea || 0,
      approvedForestArea: data.approvedForestArea || 0,
      approvedExcavationArea: data.approvedExcavationArea || 0,
      approvedSafetyZoneArea: data.approvedSafetyZoneArea || 0,
      approvedObDumpArea: data.approvedObDumpArea || 0,
      approvedInfraArea: data.approvedInfraArea || 0,
      approvedDiversionArea: data.approvedDiversionArea || 0,
      approvedRehabArea: data.approvedRehabArea || 0,
      isComboProject: data.isComboProject || false,
      linkedMineCodes: data.linkedMineCodes || [],
      totalEmpSanctioned: data.totalEmpSanctioned,
      totalEmpCompleted: data.totalEmpCompleted,
      landBudget: Money.fromINR(data.landBudget),
      rrBudget: Money.fromINR(data.rrBudget),
      status: data.status,
      remarks: data.remarks,
      tenantId: data.tenantId,
      isActive: data.isActive,
      lockedAt: data.lockedAt,
      entryTs: data.entryTs,
      updtTs: data.updtTs,
    })
  }

  canAccommodate(newArea: Area, newBudget: Money, newJobs: number): Result<boolean> {
    const resultingAcquiredArea = this._totalAcquiredArea.add(newArea)
    if (resultingAcquiredArea.isGreaterThan(this._totalApprovedArea)) {
      return Fail(`Area overflow: resulting ${resultingAcquiredArea.toDecimal().toString()} exceeds approved ${this._totalApprovedArea.toDecimal().toString()}`)
    }

    const resultingCompletedJobs = this._totalEmpCompleted + newJobs
    if (resultingCompletedJobs > this._totalEmpSanctioned) {
      return Fail(`Jobs overflow: resulting ${resultingCompletedJobs} exceeds approved ${this._totalEmpSanctioned}`)
    }

    return Result.ok(true)
  }

  updateTotalLandLimit(acres: string | number): Result<void> {
    this._totalApprovedArea = Area.fromAcres(Number(acres))
    this._updtTs = new Date()
    return Result.ok<void>(undefined as void)
  }

  updateTotalBudgetCeiling(amount: string | number): Result<void> {
    this._landBudget = Money.fromINR(Number(amount))
    this._rrBudget = Money.fromINR(0)
    this._updtTs = new Date()
    return Result.ok<void>(undefined as void)
  }

  updateTotalEmploymentQuota(quota: string | number): Result<void> {
    this._totalEmpSanctioned = Number(quota)
    this._updtTs = new Date()
    return Result.ok<void>(undefined as void)
  }

  // Getters
  get id(): string { return this._id }
  get projCd(): string { return this._id }
  get projNm(): string { return this._projNm }
  get eclProjCd(): string | null { return this._eclProjCd }
  get projectDesc(): string | null { return this._projectDesc }
  get totalApprovedArea(): Area { return this._totalApprovedArea }
  get totalAcquiredArea(): Area { return this._totalAcquiredArea }
  get totalEmpSanctioned(): number { return this._totalEmpSanctioned }
  get totalEmpCompleted(): number { return this._totalEmpCompleted }
  get landBudget(): Money { return this._landBudget }
  get rrBudget(): Money { return this._rrBudget }
  get status(): number { return this._status }
  get tenantId(): string | null { return this._tenantId }
  get isActive(): boolean { return this._isActive }
  get locked_at(): Date | null { return this._lockedAt }

  isLocked(): boolean {
    return this._status === 1
  }

  lock(userId: string): Result<void> {
    if (this.isLocked()) {
      return Fail('Project is already locked.')
    }
    
    this._status = 1
    this._lockedAt = new Date()
    this._updtTs = new Date()
    
    this.addDomainEvent(createDomainEvent('PROJECT_LOCKED', this.id, {
      lockedBy: userId
    }))
    
    return Result.ok<void>(undefined as void)
  }

  get name(): string { return this._projNm }
  get total_land_limit_acres(): string { return this._totalApprovedArea.toDecimal().toString() }
  get total_budget_ceiling(): string { return this._landBudget.add(this._rrBudget).toDecimal().toString() }
  get total_employment_quota(): number { return this._totalEmpSanctioned }

  toPersistence() {
    return {
      projCd: this.id,
      projNm: this._projNm,
      eclProjCd: this._eclProjCd,
      projectDesc: this._projectDesc,
      totalApprovedArea: this._totalApprovedArea.toDecimal().toString(),
      totalAcquiredArea: this._totalAcquiredArea.toDecimal().toString(),
      approvedTenancyArea: this._approvedTenancyArea,
      approvedGovtArea: this._approvedGovtArea,
      approvedPattaArea: this._approvedPattaArea,
      approvedForestArea: this._approvedForestArea,
      approvedExcavationArea: this._approvedExcavationArea,
      approvedSafetyZoneArea: this._approvedSafetyZoneArea,
      approvedObDumpArea: this._approvedObDumpArea,
      approvedInfraArea: this._approvedInfraArea,
      approvedDiversionArea: this._approvedDiversionArea,
      approvedRehabArea: this._approvedRehabArea,
      isComboProject: this._isComboProject,
      linkedMineCodes: this._linkedMineCodes,
      totalEmpSanctioned: this._totalEmpSanctioned,
      totalEmpCompleted: this._totalEmpCompleted,
      landBudget: this._landBudget.toDecimal().toString(),
      rrBudget: this._rrBudget.toDecimal().toString(),
      status: this._status,
      remarks: this._remarks,
      tenantId: this._tenantId,
      isActive: this._isActive,
      entryTs: this._entryTs,
      updtTs: this._updtTs,
    }
  }
}
