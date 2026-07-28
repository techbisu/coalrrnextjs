import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result, Fail, Ok } from '@/core/result/Result'
import { DomainException } from '@/core/errors'
import { createDomainEvent } from '@/core/base/DomainEvent'

export interface AdminUserProps {
  id: number
  tenantId: string | null
  tenantName: string | null
  name: string
  email: string | null
  mobile: string | null
  designation: string | null
  passwordHash: string | null
  aadhaarHash: string | null
  verifiedAt: Date | null
  isActive: boolean
  isOnline?: boolean
  entryBy?: string | null
  updtBy?: string | null
  entryTs: Date
  updtTs: Date
  scope?: { scopeLevel: string; areaCd?: string | null; mineCd?: string | null }
  role?: string
}

export interface CreateAdminUserProps {
  tenantId?: string | null
  name: string
  email?: string | null
  mobile?: string | null
  designation?: string | null
  action_by: string
}

export class AdminUserNotFoundException extends DomainException {
  constructor(id: number | string) {
    super(`User '${id}' not found`, 'ADMIN_USER_NOT_FOUND')
  }
}

export class AdminUser extends AggregateRoot<number> {
  private _tenantId: string | null
  private _tenantName: string | null
  private _name: string
  private _email: string | null
  private _mobile: string | null
  private _designation: string | null
  private _passwordHash: string | null
  private _aadhaarHash: string | null
  private _verifiedAt: Date | null
  private _isActive: boolean
  private _isOnline: boolean
  private _entryBy: string | null
  private _updtBy: string | null
  private _entryTs: Date
  private _updtTs: Date
  private _scope?: { scopeLevel: string; areaCd?: string | null; mineCd?: string | null }
  private _role?: string

  private constructor(props: AdminUserProps) {
    super(props.id)
    this._tenantId = props.tenantId || null
    this._tenantName = props.tenantName || null
    this._name = props.name
    this._email = props.email
    this._mobile = props.mobile
    this._designation = props.designation
    this._passwordHash = props.passwordHash
    this._aadhaarHash = props.aadhaarHash
    this._verifiedAt = props.verifiedAt
    this._isActive = props.isActive
    this._isOnline = props.isOnline || false
    this._entryBy = props.entryBy || null
    this._updtBy = props.updtBy || null
    this._entryTs = props.entryTs
    this._updtTs = props.updtTs
    this._scope = props.scope
    this._role = props.role
  }

  static create(props: CreateAdminUserProps): Result<AdminUser> {
    const errors: string[] = []

    if (!props.name || props.name.trim().length === 0) errors.push('Name is required')

    if (errors.length > 0) {
      return Fail(errors.join(', '))
    }

    const now = new Date()

    const user = new AdminUser({
      id: 0, // Assigned by persistence
      tenantId: props.tenantId || null,
      tenantName: null,
      name: props.name.trim(),
      email: props.email || null,
      mobile: props.mobile || null,
      designation: props.designation || null,
      passwordHash: null,
      aadhaarHash: null,
      verifiedAt: null,
      isActive: true,
      entryBy: props.action_by,
      updtBy: props.action_by,
      entryTs: now,
      updtTs: now,
    })

    user.addDomainEvent(createDomainEvent('ADMIN_USER_CREATED', '0', {
      tenant_id: user.tenantId,
      name: user.name,
      email: user.email,
    }))

    return Ok(user)
  }

  static reconstitute(data: AdminUserProps): AdminUser {
    return new AdminUser(data)
  }

  get tenantId(): string | null { return this._tenantId }
  get tenantName(): string | null { return this._tenantName }
  get name(): string { return this._name }
  get email(): string | null { return this._email }
  get mobile(): string | null { return this._mobile }
  get designation(): string | null { return this._designation }
  get isActive(): boolean { return this._isActive }
  get isOnline(): boolean { return this._isOnline }
  get verifiedAt(): Date | null { return this._verifiedAt }
  get scope() { return this._scope }
  get role(): string | undefined { return this._role }

  update(props: {
    tenantId?: string | null
    name?: string
    email?: string
    mobile?: string
    designation?: string
    updtBy: string
  }) {
    if (props.tenantId !== undefined) this._tenantId = props.tenantId
    if (props.name !== undefined) this._name = props.name.trim()
    if (props.email !== undefined) this._email = props.email || null
    if (props.mobile !== undefined) this._mobile = props.mobile || null
    if (props.designation !== undefined) this._designation = props.designation || null
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
      tenant_id: this._tenantId,
      name: this._name,
      email: this._email,
      mobile: this._mobile,
      designation: this._designation,
      password_hash: this._passwordHash,
      aadhaar_hash: this._aadhaarHash,
      verified_at: this._verifiedAt,
      is_active: this._isActive,
      entry_by: this._entryBy,
      updt_by: this._updtBy,
      entry_ts: this._entryTs,
      updt_ts: this._updtTs,
    }
  }
}
