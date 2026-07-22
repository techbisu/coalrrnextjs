import { Entity } from '@/core/base/Entity'
import { Result, Fail } from '@/core/result/Result'
import { Area } from '@/domain/value-objects/Area'

export interface ProjectApprovalProps {
  id: string // mapping BigInt to string for domain
  projCd: string
  aprvArea: Area | null
  areaAcq: Area
  empSanc: number | null
  aprvDt: Date | null
  aprvRefNo: string | null
  isActive: boolean
  aprvDocId: string | null
  aprvType: string | null
  aprvLevel: string | null
  entryTs: Date
  updtTs: Date
}

export interface CreateProjectApprovalProps {
  projCd: string
  aprvArea?: number | string
  empSanc?: number
  aprvDt?: Date
  aprvRefNo?: string
  aprvDocId?: string
  aprvType: 'INITIAL_PR' | 'FORM_XXII_DEVIATION' | 'REVISED_BASELINE'
  aprvLevel: 'CMD' | 'BOARD_OF_DIRECTORS'
}

export class ProjectApproval extends Entity<string> {
  private _projCd: string
  private _aprvArea: Area | null
  private _areaAcq: Area
  private _empSanc: number | null
  private _aprvDt: Date | null
  private _aprvRefNo: string | null
  private _isActive: boolean
  private _aprvDocId: string | null
  private _aprvType: string | null
  private _aprvLevel: string | null
  private _entryTs: Date
  private _updtTs: Date

  private constructor(props: ProjectApprovalProps) {
    super(props.id)
    this._projCd = props.projCd
    this._aprvArea = props.aprvArea
    this._areaAcq = props.areaAcq
    this._empSanc = props.empSanc
    this._aprvDt = props.aprvDt
    this._aprvRefNo = props.aprvRefNo
    this._isActive = props.isActive
    this._aprvDocId = props.aprvDocId
    this._aprvType = props.aprvType
    this._aprvLevel = props.aprvLevel
    this._entryTs = props.entryTs
    this._updtTs = props.updtTs
  }

  static create(props: CreateProjectApprovalProps): Result<ProjectApproval> {
    const id = Date.now().toString() // Generates a unique ID (mock BigInt)
    const now = new Date()

    let aprvArea: Area | null = null
    if (props.aprvArea !== undefined) {
      const areaResult = Area.tryCreate(props.aprvArea, 'ACRES')
      if (areaResult.isFailure) return Fail('Invalid aprvArea')
      aprvArea = (areaResult as any).value
    }

    const approval = new ProjectApproval({
      id,
      projCd: props.projCd,
      aprvArea,
      areaAcq: Area.fromAcres(0),
      empSanc: props.empSanc ?? null,
      aprvDt: props.aprvDt ?? null,
      aprvRefNo: props.aprvRefNo ?? null,
      isActive: true,
      aprvDocId: props.aprvDocId ?? null,
      aprvType: props.aprvType,
      aprvLevel: props.aprvLevel,
      entryTs: now,
      updtTs: now
    })

    return Result.ok(approval)
  }

  static reconstitute(data: {
    aprvCd: string
    projCd: string
    aprvArea: string | null
    areaAcq: string
    empSanc: number | null
    aprvDt: Date | null
    aprvRefNo: string | null
    isActive: boolean
    aprvDocId: string | null
    aprvType: string | null
    aprvLevel: string | null
    entryTs: Date
    updtTs: Date
  }): ProjectApproval {
    return new ProjectApproval({
      id: data.aprvCd,
      projCd: data.projCd,
      aprvArea: data.aprvArea !== null ? Area.fromAcres(data.aprvArea) : null,
      areaAcq: Area.fromAcres(data.areaAcq),
      empSanc: data.empSanc,
      aprvDt: data.aprvDt,
      aprvRefNo: data.aprvRefNo,
      isActive: data.isActive,
      aprvDocId: data.aprvDocId,
      aprvType: data.aprvType,
      aprvLevel: data.aprvLevel,
      entryTs: data.entryTs,
      updtTs: data.updtTs
    })
  }

  // Getters
  get id(): string { return this._id }
  get projCd(): string { return this._projCd }
  get aprvArea(): Area | null { return this._aprvArea }
  get areaAcq(): Area { return this._areaAcq }
  get empSanc(): number | null { return this._empSanc }
  get aprvDt(): Date | null { return this._aprvDt }
  get aprvRefNo(): string | null { return this._aprvRefNo }
  get isActive(): boolean { return this._isActive }
  get aprvDocId(): string | null { return this._aprvDocId }
  get aprvType(): string | null { return this._aprvType }
  get aprvLevel(): string | null { return this._aprvLevel }
  get entryTs(): Date { return this._entryTs }
  get updtTs(): Date { return this._updtTs }

  toPersistence() {
    return {
      aprvCd: BigInt(this.id),
      projCd: this._projCd,
      aprvArea: this._aprvArea ? this._aprvArea.toDecimal().toNumber() : null,
      areaAcq: this._areaAcq.toDecimal().toNumber(),
      empSanc: this._empSanc,
      aprvDt: this._aprvDt,
      aprvRefNo: this._aprvRefNo,
      isActive: this._isActive,
      aprvDocId: this._aprvDocId,
      aprvType: this._aprvType,
      aprvLevel: this._aprvLevel,
      entryTs: BigInt(Math.floor(this._entryTs.getTime() / 1000)),
      updtTs: BigInt(Math.floor(this._updtTs.getTime() / 1000)),
    }
  }
}
