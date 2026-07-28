import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result, Fail, Ok } from '@/core/result/Result'
import { DomainException } from '@/core/errors'
import { createDomainEvent } from '@/core/base/DomainEvent'

export interface AdminRoleProps {
  id: string
  name: string
  displayName: string | null
  description: string | null
  guardName: string
  isSystem: boolean
  entryBy?: string | null
  updtBy?: string | null
  entryTs: Date
  updtTs: Date
}

export interface CreateAdminRoleProps {
  name: string
  displayName?: string | null
  description?: string | null
  actionBy: string
}

export class AdminRoleNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Role '${id}' not found`, 'ADMIN_ROLE_NOT_FOUND')
  }
}

export class AdminRole extends AggregateRoot<string> {
  private _name: string
  private _displayName: string | null
  private _description: string | null
  private _guardName: string
  private _isSystem: boolean
  private _entryBy: string | null
  private _updtBy: string | null
  private _entryTs: Date
  private _updtTs: Date

  private constructor(props: AdminRoleProps) {
    super(props.id)
    this._name = props.name
    this._displayName = props.displayName
    this._description = props.description
    this._guardName = props.guardName
    this._isSystem = props.isSystem
    this._entryBy = props.entryBy || null
    this._updtBy = props.updtBy || null
    this._entryTs = props.entryTs
    this._updtTs = props.updtTs
  }

  static create(props: CreateAdminRoleProps): Result<AdminRole> {
    const errors: string[] = []

    if (!props.name || props.name.trim().length === 0) errors.push('Role name is required')

    if (errors.length > 0) {
      return Fail(errors.join(', '))
    }

    const now = new Date()
    const generatedId = require('crypto').randomUUID()

    const role = new AdminRole({
      id: generatedId,
      name: props.name.trim(),
      displayName: props.displayName || null,
      description: props.description || null,
      guardName: 'web',
      isSystem: false,
      entryBy: props.actionBy,
      updtBy: props.actionBy,
      entryTs: now,
      updtTs: now,
    })

    role.addDomainEvent(createDomainEvent('ADMIN_ROLE_CREATED', role.id, {
      name: role.name,
    }))

    return Ok(role)
  }

  static reconstitute(data: AdminRoleProps): AdminRole {
    return new AdminRole(data)
  }

  get name(): string { return this._name }
  get displayName(): string | null { return this._displayName }
  get description(): string | null { return this._description }
  get isSystem(): boolean { return this._isSystem }
  get guardName(): string { return this._guardName }

  update(props: { name?: string; displayName?: string; description?: string; updtBy: string }) {
    if (props.name !== undefined) this._name = props.name.trim()
    if (props.displayName !== undefined) this._displayName = props.displayName
    if (props.description !== undefined) this._description = props.description
    
    this._updtBy = props.updtBy
    this._updtTs = new Date()

    this.addDomainEvent(createDomainEvent('ADMIN_ROLE_UPDATED', this.id, {
      name: this._name
    }))
  }

  toPersistence() {
    return {
      id: this.id,
      name: this._name,
      display_name: this._displayName,
      description: this._description,
      guard_name: this._guardName,
      is_system: this._isSystem,
      entry_by: this._entryBy,
      updt_by: this._updtBy,
      entry_ts: this._entryTs,
      updt_ts: this._updtTs,
    }
  }
}
