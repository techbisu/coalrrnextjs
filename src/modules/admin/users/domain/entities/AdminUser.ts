import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result, Fail, Ok } from '@/core/result/Result'
import { DomainException } from '@/core/errors'
import { createDomainEvent } from '@/core/base/DomainEvent'

export interface AdminUserProps {
  id: number
  portal: string
  role: string
  name: string
  email: string | null
  mobile: string | null
  designation: string | null
  mineCd: string | null
  passwordHash: string | null
  aadhaarHash: string | null
  plotId: string | null
  verifiedAt: Date | null
  isActive: boolean
  entryBy?: string | null
  updtBy?: string | null
  entryTs: Date
  updtTs: Date
}

export interface CreateAdminUserProps {
  portal: string
  role: string
  name: string
  email?: string | null
  mobile?: string | null
  designation?: string | null
  mine_cd?: string | null
  action_by: string
}

export class AdminUserNotFoundException extends DomainException {
  constructor(id: number | string) {
    super(`User '${id}' not found`, 'ADMIN_USER_NOT_FOUND')
  }
}

export class AdminUser extends AggregateRoot<number> {
  private _portal: string
  private _role: string
  private _name: string
  private _email: string | null
  private _mobile: string | null
  private _designation: string | null
  private _mineCd: string | null
  private _passwordHash: string | null
  private _aadhaarHash: string | null
  private _plotId: string | null
  private _verifiedAt: Date | null
  private _isActive: boolean
  private _entryBy: string | null
  private _updtBy: string | null
  private _entryTs: Date
  private _updtTs: Date

  private constructor(props: AdminUserProps) {
    super(props.id)
    this._portal = props.portal
    this._role = props.role
    this._name = props.name
    this._email = props.email
    this._mobile = props.mobile
    this._designation = props.designation
    this._mineCd = props.mineCd
    this._passwordHash = props.passwordHash
    this._aadhaarHash = props.aadhaarHash
    this._plotId = props.plotId
    this._verifiedAt = props.verifiedAt
    this._isActive = props.isActive
    this._entryBy = props.entryBy || null
    this._updtBy = props.updtBy || null
    this._entryTs = props.entryTs
    this._updtTs = props.updtTs
  }

  static create(props: CreateAdminUserProps): Result<AdminUser> {
    const errors: string[] = []

    if (!props.portal) errors.push('Portal is required')
    if (!props.role) errors.push('Role is required')
    if (!props.name || props.name.trim().length === 0) errors.push('Name is required')

    if (errors.length > 0) {
      return Fail(errors.join(', '))
    }

    const now = new Date()

    const user = new AdminUser({
      id: 0, // Assigned by persistence
      portal: props.portal,
      role: props.role,
      name: props.name.trim(),
      email: props.email || null,
      mobile: props.mobile || null,
      designation: props.designation || null,
      mineCd: props.mine_cd || null,
      passwordHash: null,
      aadhaarHash: null,
      plotId: null,
      verifiedAt: null,
      isActive: true,
      entryBy: props.action_by,
      updtBy: props.action_by,
      entryTs: now,
      updtTs: now,
    })

    user.addDomainEvent(createDomainEvent('ADMIN_USER_CREATED', '0', {
      portal: user.portal,
      role: user.role,
      name: user.name,
      email: user.email,
    }))

    return Ok(user)
  }

  static reconstitute(data: AdminUserProps): AdminUser {
    return new AdminUser(data)
  }

  get portal(): string { return this._portal }
  get role(): string { return this._role }
  get name(): string { return this._name }
  get email(): string | null { return this._email }
  get mobile(): string | null { return this._mobile }
  get designation(): string | null { return this._designation }
  get mineCd(): string | null { return this._mineCd }
  get isActive(): boolean { return this._isActive }

  update(props: {
    portal?: string
    role?: string
    name?: string
    email?: string
    mobile?: string
    designation?: string
    mineCd?: string
    updtBy: string
  }) {
    if (props.portal !== undefined) this._portal = props.portal
    if (props.role !== undefined) this._role = props.role
    if (props.name !== undefined) this._name = props.name.trim()
    if (props.email !== undefined) this._email = props.email || null
    if (props.mobile !== undefined) this._mobile = props.mobile || null
    if (props.designation !== undefined) this._designation = props.designation || null
    if (props.mineCd !== undefined) this._mineCd = props.mineCd || null
    this._updtBy = props.updtBy
    this._updtTs = new Date()

    this.addDomainEvent(createDomainEvent('ADMIN_USER_UPDATED', this.id.toString(), {
      updatedFields: Object.keys(props),
      updtBy: props.updtBy
    }))
  }

  toPersistence() {
    return {
      id: this.id === 0 ? undefined : this.id, // For creation, id must be undefined so autoincrement works
      portal: this._portal,
      role: this._role,
      name: this._name,
      email: this._email,
      mobile: this._mobile,
      designation: this._designation,
      mine_cd: this._mineCd,
      password_hash: this._passwordHash,
      aadhaar_hash: this._aadhaarHash,
      plot_id: this._plotId,
      verified_at: this._verifiedAt,
      is_active: this._isActive,
      entry_by: this._entryBy,
      updt_by: this._updtBy,
      entry_ts: this._entryTs,
      updt_ts: this._updtTs,
    }
  }
}
