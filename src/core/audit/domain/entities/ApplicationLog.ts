import { Entity } from '@/core/base/Entity'
import { Result, Fail, Ok } from '@/core/result/Result'
import { randomUUID } from 'crypto'

export interface ApplicationLogProps {
  id: string
  tableName: string
  conditions?: any | null
  oldData?: any | null
  newData?: any | null
  entryTs: Date
  updtTs: Date
}

export interface CreateApplicationLogProps {
  tableName: string
  conditions?: any | null
  oldData?: any | null
  newData?: any | null
  timestamp?: Date
}

export class ApplicationLog extends Entity<string> {
  private props: ApplicationLogProps

  private constructor(props: ApplicationLogProps) {
    super(props.id)
    this.props = props
  }

  static create(props: CreateApplicationLogProps): Result<ApplicationLog> {
    if (!props.tableName || props.tableName.trim().length === 0) {
      return Fail('Table name is required')
    }

    const now = props.timestamp || new Date()
    const log = new ApplicationLog({
      id: randomUUID(),
      tableName: props.tableName.trim(),
      conditions: props.conditions || null,
      oldData: props.oldData || null,
      newData: props.newData || null,
      entryTs: now,
      updtTs: now,
    })

    return Ok(log)
  }

  static reconstitute(props: ApplicationLogProps): ApplicationLog {
    return new ApplicationLog(props)
  }

  get tableName(): string { return this.props.tableName }
  get conditions(): any | null { return this.props.conditions || null }
  get oldData(): any | null { return this.props.oldData || null }
  get newData(): any | null { return this.props.newData || null }
  get entryTs(): Date { return this.props.entryTs }
  get updtTs(): Date { return this.props.updtTs }

  toPersistence() {
    return {
      id: this.id,
      table_name: this.props.tableName,
      conditions: this.props.conditions ? JSON.stringify(this.props.conditions) : null,
      old_data: this.props.oldData ? JSON.stringify(this.props.oldData) : null,
      new_data: this.props.newData ? JSON.stringify(this.props.newData) : null,
      entry_ts: this.props.entryTs,
      updt_ts: this.props.updtTs,
    }
  }
}
