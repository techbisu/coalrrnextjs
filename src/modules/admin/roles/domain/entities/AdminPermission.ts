import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result, Fail, Ok } from '@/core/result/Result'
import { DomainException } from '@/core/errors'

export interface AdminPermissionProps {
  id: string
  name: string
  displayName: string | null
  description: string | null
  module: string | null
  group: string | null
  guardName: string
  entryBy?: string | null
  updtBy?: string | null
  entryTs: Date
  updtTs: Date
}

export class AdminPermission extends AggregateRoot<string> {
  private _name: string
  private _displayName: string | null
  private _description: string | null
  private _module: string | null
  private _group: string | null
  private _guardName: string
  private _entryBy: string | null
  private _updtBy: string | null
  private _entryTs: Date
  private _updtTs: Date

  private constructor(props: AdminPermissionProps) {
    super(props.id)
    this._name = props.name
    this._displayName = props.displayName
    this._description = props.description
    this._module = props.module
    this._group = props.group
    this._guardName = props.guardName
    this._entryBy = props.entryBy || null
    this._updtBy = props.updtBy || null
    this._entryTs = props.entryTs
    this._updtTs = props.updtTs
  }

  static create(props: { name: string; displayName?: string; description?: string; module?: string; group?: string; actionBy?: string }): Result<AdminPermission> {
    const errors: string[] = []

    if (!props.name || props.name.trim().length === 0) errors.push('Permission name is required')

    if (errors.length > 0) {
      return Fail(errors.join(', '))
    }

    const now = new Date()
    const generatedId = `PERM-${require('crypto').randomBytes(6).toString('hex').toUpperCase()}`

    return Ok(new AdminPermission({
      id: generatedId,
      name: props.name.trim(),
      displayName: props.displayName || null,
      description: props.description || null,
      module: props.module || null,
      group: props.group || null,
      guardName: 'web',
      entryBy: props.actionBy || null,
      updtBy: props.actionBy || null,
      entryTs: now,
      updtTs: now,
    }))
  }

  static reconstitute(data: AdminPermissionProps): AdminPermission {
    return new AdminPermission(data)
  }

  get name(): string { return this._name }
  get displayName(): string | null { return this._displayName }
  get description(): string | null { return this._description }
  get group(): string | null { return this._group }
  get module(): string | null { return this._module }
  get guardName(): string { return this._guardName }

  update(props: { name?: string; displayName?: string; description?: string; module?: string; group?: string; updtBy: string }) {
    if (props.name !== undefined) this._name = props.name.trim()
    if (props.displayName !== undefined) this._displayName = props.displayName
    if (props.description !== undefined) this._description = props.description
    if (props.module !== undefined) this._module = props.module
    if (props.group !== undefined) this._group = props.group
    
    this._updtBy = props.updtBy
    this._updtTs = new Date()
  }

  toPersistence() {
    return {
      id: this.id,
      name: this._name,
      display_name: this._displayName,
      description: this._description,
      module: this._module,
      group: this._group,
      guard_name: this._guardName,
      entry_by: this._entryBy,
      updt_by: this._updtBy,
      entry_ts: this._entryTs,
      updt_ts: this._updtTs,
    }
  }
}
