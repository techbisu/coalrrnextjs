import { Entity } from '@/core/base/Entity'
import { Result, Fail } from '@/core/result/Result'
import { Area } from '@/domain/value-objects/Area'

export interface ProjectApprovalLocationProps {
  id: string // mapping BigInt aprvLocId to string
  aprvCd: string
  stateLgd: bigint | null
  districtLgd: bigint | null
  mouzaLgd: bigint | null
  aprvArea: Area | null
  areaAcq: Area
  landClassBreakup: any | null
  entryTs: Date
  updtTs: Date
}

export interface CreateProjectApprovalLocationProps {
  aprvCd: string
  stateLgd?: bigint
  districtLgd?: bigint
  mouzaLgd?: bigint
  aprvArea?: number | string
  landClassBreakup?: any
}

export class ProjectApprovalLocation extends Entity<string> {
  private _aprvCd: string
  private _stateLgd: bigint | null
  private _districtLgd: bigint | null
  private _mouzaLgd: bigint | null
  private _aprvArea: Area | null
  private _areaAcq: Area
  private _landClassBreakup: any | null
  private _entryTs: Date
  private _updtTs: Date

  private constructor(props: ProjectApprovalLocationProps) {
    super(props.id)
    this._aprvCd = props.aprvCd
    this._stateLgd = props.stateLgd
    this._districtLgd = props.districtLgd
    this._mouzaLgd = props.mouzaLgd
    this._aprvArea = props.aprvArea
    this._areaAcq = props.areaAcq
    this._landClassBreakup = props.landClassBreakup
    this._entryTs = props.entryTs
    this._updtTs = props.updtTs
  }

  static create(props: CreateProjectApprovalLocationProps): Result<ProjectApprovalLocation> {
    const id = Math.random().toString(36).substring(2, 12).toUpperCase().padEnd(10, '0').slice(0, 10) // 10 chars
    const now = new Date()

    let aprvArea: Area | null = null
    if (props.aprvArea !== undefined) {
      const areaResult = Area.tryCreate(props.aprvArea, 'ACRES')
      if (areaResult.isFailure) return Fail('Invalid aprvArea')
      aprvArea = (areaResult as any).value
    }

    const location = new ProjectApprovalLocation({
      id,
      aprvCd: props.aprvCd,
      stateLgd: props.stateLgd ?? null,
      districtLgd: props.districtLgd ?? null,
      mouzaLgd: props.mouzaLgd ?? null,
      aprvArea,
      areaAcq: Area.fromAcres(0),
      landClassBreakup: props.landClassBreakup ?? null,
      entryTs: now,
      updtTs: now
    })

    return Result.ok(location)
  }

  static reconstitute(data: {
    aprvLocId: string
    aprvCd: string
    stateLgd: bigint | null
    districtLgd: bigint | null
    mouzaLgd: bigint | null
    aprvArea: string | null
    areaAcq: string
    landClassBreakup: any | null
    entryTs: Date
    updtTs: Date
  }): ProjectApprovalLocation {
    return new ProjectApprovalLocation({
      id: data.aprvLocId,
      aprvCd: data.aprvCd,
      stateLgd: data.stateLgd,
      districtLgd: data.districtLgd,
      mouzaLgd: data.mouzaLgd,
      aprvArea: data.aprvArea !== null ? Area.fromAcres(data.aprvArea) : null,
      areaAcq: Area.fromAcres(data.areaAcq),
      landClassBreakup: data.landClassBreakup,
      entryTs: data.entryTs,
      updtTs: data.updtTs
    })
  }

  // Getters
  get id(): string { return this._id }
  get aprvCd(): string { return this._aprvCd }
  get stateLgd(): bigint | null { return this._stateLgd }
  get districtLgd(): bigint | null { return this._districtLgd }
  get mouzaLgd(): bigint | null { return this._mouzaLgd }
  get aprvArea(): Area | null { return this._aprvArea }
  get areaAcq(): Area { return this._areaAcq }
  get landClassBreakup(): any | null { return this._landClassBreakup }
  get entryTs(): Date { return this._entryTs }
  get updtTs(): Date { return this._updtTs }

  toPersistence() {
    return {
      aprvLocationCode: this.id,
      aprvCd: BigInt(this._aprvCd),
      mouzaLgd: this._mouzaLgd,
      approvedArea: this._aprvArea ? this._aprvArea.toDecimal().toNumber() : 0,
      landClassBreakup: this._landClassBreakup,
      entryTs: BigInt(Math.floor(this._entryTs.getTime() / 1000)),
      updtTs: BigInt(Math.floor(this._updtTs.getTime() / 1000)),
    }
  }
}
